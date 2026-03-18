// Task controller — CRUD, move, and subtask toggle operations.
// All write operations call verifyTaskOwnership first to prevent cross-user access.

import { query } from "../db/index.js";

// Helper: confirms that a task belongs to the given user by tracing
// tasks → columns → boards → user_id.
// Returns true if the user owns the task, false otherwise.
async function verifyTaskOwnership(taskId, userId) {
  const result = await query(
    "SELECT t.id FROM tasks t JOIN columns c ON t.column_id = c.id JOIN boards b ON c.board_id = b.id WHERE t.id = $1 AND b.user_id = $2",
    [taskId, userId],
  );
  return result.rows.length > 0;
}

// GET /api/tasks/:id
// Returns a single task with its subtasks ordered by position.
export async function getTask(req, res) {
  try {
    const { id } = req.params;

    // Return 404 instead of 403 to avoid revealing that the task exists
    if (!await verifyTaskOwnership(id, req.user.userId)) {
      return res.status(404).json({ error: "Task not found" });
    }

    const taskResult = await query("SELECT * FROM tasks WHERE id = $1", [id]);

    const subtasksResult = await query(
      "SELECT * FROM subtasks WHERE task_id = $1 ORDER BY position ASC",
      [id],
    );

    res.json({ ...taskResult.rows[0], subtasks: subtasksResult.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// POST /api/tasks
// Creates a new task in the specified column, then creates any provided subtasks.
export async function createTask(req, res) {
  try {
    const { columnId, title, description, subtasks } = req.body;

    if (!columnId || !title || !title.trim()) {
      return res
        .status(400)
        .json({ error: "Column ID and title are required" });
    }

    // Verify the column belongs to the current user
    const colCheck = await query(
      "SELECT c.id FROM columns c JOIN boards b ON c.board_id = b.id WHERE c.id = $1 AND b.user_id = $2",
      [columnId, req.user.userId],
    );

    if (colCheck.rows.length === 0) {
      return res.status(404).json({ error: "Column not found" });
    }

    // Place the new task at the end of the column
    const posResult = await query(
      "SELECT COALESCE(MAX(position), 0) + 1 AS new_position FROM tasks WHERE column_id = $1",
      [columnId],
    );

    const taskResult = await query(
      "INSERT INTO tasks (column_id, title, description, position) VALUES ($1, $2, $3, $4) RETURNING *",
      [columnId, title.trim(), description || "", posResult.rows[0].next_pos],
    );

    const task = taskResult.rows[0];

    // Insert any subtasks provided, skipping blank titles
    const createdSubtasks = [];

    if (subtasks && subtasks.length > 0) {
      for (let i = 0; i < subtasks.length; i++) {
        if (subtasks[i].title && subtasks[i].title.trim()) {
          const stResult = await query(
            "INSERT INTO subtasks (task_id, title, is_completed, position) VALUES ($1, $2, $3, $4) RETURNING *",
            [task.id, subtasks[i].title.trim(), false, i],
          );
          createdSubtasks.push(stResult.rows[0]);
        }
      }
    }
    res.status(201).json({ ...task, subtasks: createdSubtasks });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// PUT /api/tasks/:id
// Partially updates a task. Only fields present in the request body are changed.
// Subtasks are diffed: removed if absent, updated if they have an id, inserted if new.
export async function updateTask(req, res) {
  try {
    const { id } = req.params;
    const { title, description, columnId, subtasks } = req.body;

    if (!await verifyTaskOwnership(id, req.user.userId)) {
      return res
        .status(404)
        .json({ error: "Task not found or unauthorized access" });
    }

    // Build a dynamic SET clause — only include fields that were sent
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (title !== undefined) {
      updates.push(`title = $${paramCount++}`);
      values.push(title.trim());
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }
    if (columnId !== undefined) {
      // Validate the target column belongs to this user
      const colCheck = await query(
        `SELECT c.id FROM columns c JOIN boards b ON c.board_id = b.id WHERE c.id = $1 AND b.user_id = $2`,
        [columnId, req.user.userId],
      );
      if (colCheck.rows.length === 0) {
        return res.status(404).json({ error: "Target Column not found" });
      }

      // Append the task to the end of the target column
      const posResult = await query(
        `SELECT COALESCE(MAX(position), 0) + 1 AS new_position FROM tasks WHERE column_id = $1`,
        [columnId],
      );
      updates.push(
        `column_id = $${paramCount++}`,
        `position = $${paramCount++}`,
      );
      values.push(columnId, posResult.rows[0].next_pos);
    }

    if (updates.length > 0) {
      values.push(id);
      await query(
        `UPDATE tasks SET ${updates.join(", ")} WHERE id = $${paramCount}`,
        values,
      );
    }

    // Diff subtasks: delete removed ones, update existing, insert new ones
    if (subtasks !== undefined) {
      const existingSubs = await query(
        `SELECT id FROM subtasks WHERE task_id = $1`,
        [id],
      );
      const existingIds = existingSubs.rows.map((r) => r.id);
      const incomingIds = subtasks.filter((s) => s.id).map((s) => s.id);

      // Delete subtasks that are no longer in the incoming list
      for (const existingId of existingIds) {
        if (!incomingIds.includes(existingId)) {
          await query(`DELETE FROM subtasks WHERE id = $1`, [existingId]);
        }
      }

      for (let i = 0; i < subtasks.length; i++) {
        const sub = subtasks[i];
        if (!sub.title || !sub.title.trim()) continue;

        if (sub.id && existingIds.includes(sub.id)) {
          // Update existing subtask
          await query(
            `UPDATE subtasks SET title = $1, is_completed = $2, position = $3 WHERE id = $4`,
            [sub.title.trim(), sub.is_completed, i, sub.id],
          );
        } else {
          // Insert new subtask
          await query(
            `INSERT INTO subtasks (task_id, title, is_completed, position) VALUES ($1, $2, $3, $4)`,
            [id, sub.title.trim(), sub.is_completed || false, i],
          );
        }
      }
    }

    // Return the full updated task (re-uses getTask to keep the response shape consistent)
    return getTask(req, res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// POST /api/tasks/:taskId/subtasks/:subTaskId/toggle
// Flips is_completed on a single subtask (true → false, false → true).
export async function toggleSubtask(req, res) {
  try {
    const { taskId, subTaskId } = req.params;

    if (!(await verifyTaskOwnership(taskId, req.user.userId))) {
      return res
        .status(404)
        .json({ error: "Task not found or unauthorized access" });
    }

    // SQL NOT flips the boolean in a single atomic update
    const result = await query(
      "UPDATE subtasks SET is_completed = NOT is_completed WHERE id = $1 AND task_id = $2 RETURNING *",
      [subTaskId, taskId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Subtask not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// DELETE /api/tasks/:id
// Deletes a task. Subtasks cascade automatically via FK constraint.
export async function deleteTask(req, res) {
  try {
    const { id } = req.params;

    if (!(await verifyTaskOwnership(id, req.user.userId))) {
      return res
        .status(404)
        .json({ error: "Task not found or unauthorized access" });
    }

    await query("DELETE FROM tasks WHERE id = $1", [id]);
    res.json({ message: "Task deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// POST /api/tasks/:id/move
// Moves a task to a different column and/or position (used by drag-and-drop).
// The client sends the target columnId and the desired position index.
export async function moveTask(req, res) {
  try {
    const { id } = req.params;
    const { columnId, position } = req.body;

    if (!(await verifyTaskOwnership(id, req.user.userId))) {
      return res
        .status(404)
        .json({ error: "Task not found or unauthorized access" });
    }

    // Update column and position in one query
    await query(
      "UPDATE tasks SET column_id = $1, position = $2 WHERE id = $3",
      [columnId, position, id],
    );

    // Return the updated task with its subtasks
    const taskResult = await query("SELECT * FROM tasks WHERE id = $1", [id]);
    const subTaskResult = await query(
      "SELECT * FROM subtasks WHERE task_id = $1 ORDER BY position ASC",
      [id],
    );

    res.json({ ...taskResult.rows[0], subtasks: subTaskResult.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
}

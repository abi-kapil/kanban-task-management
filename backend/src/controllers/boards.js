// Board controller — CRUD operations for kanban boards and their columns.
// Every function checks req.user.userId so users can only access their own boards.

import { query } from "../db/index.js";

// GET /api/boards
// Returns all boards belonging to the current user, ordered by position.
export async function getBoards(req, res) {
  try {
    const result = await query(
      "SELECT * FROM boards WHERE user_id = $1 ORDER BY position ASC",
      [req.user.userId],
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// GET /api/boards/:id
// Returns a single board with all its columns, tasks, and subtasks nested inside.
// Data shape: { ...board, columns: [{ ...col, tasks: [{ ...task, subtasks: [...] }] }] }
export async function getBoardWithColumns(req, res) {
  try {
    const { id } = req.params;

    // Verify the board exists and belongs to this user
    const boardResult = await query(
      "SELECT * FROM boards WHERE id = $1 AND user_id = $2",
      [id, req.user.userId],
    );
    if (boardResult.rows.length === 0) {
      return res.status(404).json({ error: "Board not found" });
    }

    const board = boardResult.rows[0];

    // Fetch columns in display order
    const columnsResult = await query(
      "SELECT * FROM columns WHERE board_id = $1 ORDER BY position ASC",
      [id],
    );

    // For each column, fetch its tasks; for each task, fetch its subtasks.
    // Promise.all runs these in parallel within each level for performance.
    const columns = await Promise.all(
      columnsResult.rows.map(async (col) => {
        const tasksResult = await query(
          "SELECT * FROM tasks WHERE column_id = $1 ORDER BY position ASC",
          [col.id],
        );

        const tasks = await Promise.all(
          tasksResult.rows.map(async (task) => {
            const subtasksResult = await query(
              "SELECT * FROM subtasks WHERE task_id = $1 ORDER BY position ASC",
              [task.id],
            );
            return { ...task, subtasks: subtasksResult.rows };
          }),
        );

        return { ...col, tasks };
      }),
    );

    res.json({ ...board, columns });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// POST /api/boards
// Creates a new board and optionally creates its initial columns.
export async function createBoard(req, res) {
  try {
    const { name, columns } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Board name is required" });
    }

    // Calculate next position so the new board appears last in the sidebar
    const posResult = await query(
      "SELECT COALESCE(MAX(position), -1) + 1 as next_pos FROM boards WHERE user_id = $1",
      [req.user.userId],
    );

    const boardResult = await query(
      "INSERT INTO boards (user_id, name, position) VALUES ($1, $2, $3) RETURNING *",
      [req.user.userId, name.trim(), posResult.rows[0].next_pos],
    );

    const board = boardResult.rows[0];

    // Insert any columns provided in the request body (skips blank names)
    const createdColumns = [];
    if (columns && columns.length > 0) {
      for (let i = 0; i < columns.length; i++) {
        const col = columns[i];
        if (col.name && col.name.trim()) {
          const colResult = await query(
            "INSERT INTO columns (board_id, name, color, position) VALUES ($1, $2, $3, $4) RETURNING *",
            [board.id, col.name.trim(), col.color || "#49C4E5", i],
          );
          // New columns have no tasks yet
          createdColumns.push({ ...colResult.rows[0], tasks: [] });
        }
      }
    }

    res.status(201).json({ ...board, columns: createdColumns });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// PUT /api/boards/:id
// Updates the board name and/or its columns.
// Columns not present in the incoming payload are deleted.
// Columns with an id are updated; columns without an id are created.
export async function updateBoard(req, res) {
  try {
    const { id } = req.params;
    const { name, columns } = req.body;

    // Ownership check
    const existing = await query(
      "SELECT * FROM boards WHERE id = $1 AND user_id = $2",
      [id, req.user.userId],
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: "Board not found" });
    }

    // Update board name if provided
    if (name && name.trim()) {
      await query("UPDATE boards SET name = $1 WHERE id = $2", [
        name.trim(),
        id,
      ]);
    }

    if (columns) {
      // Get current column IDs for this board
      const existingCols = await query(
        "SELECT id FROM columns WHERE board_id = $1",
        [id],
      );
      const existingIds = existingCols.rows.map((r) => r.id);

      // Any existing column not in the incoming payload gets deleted
      const incomingIds = columns.filter((c) => c.id).map((c) => c.id);

      for (const existingId of existingIds) {
        if (!incomingIds.includes(existingId)) {
          await query("DELETE FROM columns WHERE id = $1", [existingId]);
        }
      }

      // Upsert: update existing columns, insert new ones
      for (let i = 0; i < columns.length; i++) {
        const col = columns[i];
        if (!col.name || !col.name.trim()) continue; // skip blank column names

        if (col.id && existingIds.includes(col.id)) {
          // Existing column — update name, color, and position
          await query(
            "UPDATE columns SET name = $1, color = $2, position = $3 WHERE id = $4",
            [col.name.trim(), col.color || "#49C4E5", i, col.id],
          );
        } else {
          // New column — insert it
          await query(
            "INSERT INTO columns (board_id, name, color, position) VALUES ($1, $2, $3, $4)",
            [id, col.name.trim(), col.color || "#49C4E5", i],
          );
        }
      }
    }

    // Re-use getBoardWithColumns to return the full updated board shape
    return getBoardWithColumns({ ...req, params: { id } }, res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// DELETE /api/boards/:id
// Deletes the board. Columns, tasks, and subtasks cascade automatically via FK constraints.
export async function deleteBoard(req, res) {
  try {
    const { id } = req.params;

    // RETURNING id lets us detect if no matching row was found (wrong id or wrong user)
    const result = await query(
      "DELETE FROM boards WHERE id = $1 AND user_id = $2 RETURNING id",
      [id, req.user.userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Board not found" });
    }

    res.json({ message: "Board deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
}

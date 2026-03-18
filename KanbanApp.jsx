// KanbanApp — the main authenticated page of the application.
// Owns all board/task state and passes handler props down to child components.
// Modal visibility is controlled by simple state variables:
//   - null/false = closed, a value = open (with that value as context data).

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Board from '../components/Board';
import TaskViewModal from '../components/TaskViewModal';
import TaskFormModal from '../components/TaskFormModal';
import BoardFormModal from '../components/BoardFormModal';
import DeleteModal from '../components/DeleteModal';
import styles from './KanbanApp.module.css';

export default function KanbanApp() {
  const { logout } = useAuth();

  // --- Core state ---
  const [boards, setBoards] = useState([]);           // sidebar list (name + id only)
  const [activeBoard, setActiveBoard] = useState(null); // full board with columns + tasks
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [loading, setLoading] = useState(true);         // initial data fetch

  // --- Modal states ---
  // Each state is either null/false (closed) or holds the relevant data (open).
  const [viewTask, setViewTask] = useState(null);       // task details modal
  const [editTask, setEditTask] = useState(null);       // edit-task form modal
  const [showNewTask, setShowNewTask] = useState(false);// new-task form modal
  const [showNewBoard, setShowNewBoard] = useState(false); // new-board form modal
  const [editBoard, setEditBoard] = useState(null);     // edit-board form modal
  const [deleteTarget, setDeleteTarget] = useState(null); // { type: 'board'|'task', item }
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch the board list once when the component mounts
  useEffect(() => {
    loadBoards();
  }, []);

  // Loads the board list, then auto-selects the first board
  const loadBoards = async () => {
    try {
      const res = await api.get('/boards');
      setBoards(res.data);
      if (res.data.length > 0 && !activeBoard) {
        await loadBoard(res.data[0].id);
      }
    } catch (err) {
      // A 401 means the token is expired — log the user out
      if (err.response?.status === 401) logout();
    } finally {
      setLoading(false);
    }
  };

  // Fetches the full board (columns + tasks + subtasks) and sets it as active
  const loadBoard = async (boardId) => {
    try {
      const res = await api.get(`/boards/${boardId}`);
      setActiveBoard(res.data);
    } catch (err) {
      console.error('Failed to load board:', err);
    }
  };

  // useCallback prevents Sidebar from re-rendering on every state change
  const handleSelectBoard = useCallback(async (board) => {
    await loadBoard(board.id);
  }, []);

  // --- Board handlers ---

  // Creates a board and immediately switches to it
  const handleCreateBoard = async (data) => {
    const res = await api.post('/boards', data);
    const newBoard = res.data;
    setBoards(prev => [...prev, newBoard]);
    setActiveBoard(newBoard);
  };

  // Updates board name/columns and syncs both the sidebar list and the active board
  const handleUpdateBoard = async (data) => {
    const res = await api.put(`/boards/${activeBoard.id}`, data);
    const updated = res.data;
    // Only update the name in the sidebar list (avoid replacing the whole object)
    setBoards(prev => prev.map(b => b.id === updated.id ? { ...b, name: updated.name } : b));
    setActiveBoard(updated);
  };

  // Deletes the active board and switches to the next available one
  const handleDeleteBoard = async () => {
    setDeleteLoading(true);
    try {
      await api.delete(`/boards/${activeBoard.id}`);
      const remaining = boards.filter(b => b.id !== activeBoard.id);
      setBoards(remaining);
      if (remaining.length > 0) {
        await loadBoard(remaining[0].id);
      } else {
        setActiveBoard(null);
      }
      setDeleteTarget(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  // --- Task handlers ---

  // Creates a task and inserts it into the correct column in local state
  const handleCreateTask = async (data) => {
    const res = await api.post('/tasks', {
      columnId: data.columnId,
      title: data.title,
      description: data.description,
      subtasks: data.subtasks,
    });
    const newTask = res.data;
    setActiveBoard(prev => ({
      ...prev,
      columns: prev.columns.map(col =>
        col.id === data.columnId
          ? { ...col, tasks: [...col.tasks, newTask] }
          : col
      )
    }));
  };

  // Updates a task and repositions it if the column changed
  const handleUpdateTask = async (data) => {
    const task = editTask || viewTask;
    const res = await api.put(`/tasks/${task.id}`, {
      title: data.title,
      description: data.description,
      columnId: data.columnId,
      subtasks: data.subtasks,
    });
    const updated = res.data;
    // Pass the new columnId only when the task moved columns
    refreshTask(updated, data.columnId !== findTaskColumn(task.id)?.id ? data.columnId : null);
  };

  // Deletes the task referenced by deleteTarget and removes it from local state
  const handleDeleteTask = async () => {
    const task = deleteTarget.item;
    setDeleteLoading(true);
    try {
      await api.delete(`/tasks/${task.id}`);
      setActiveBoard(prev => ({
        ...prev,
        columns: prev.columns.map(col => ({
          ...col,
          tasks: col.tasks.filter(t => t.id !== task.id)
        }))
      }));
      setDeleteTarget(null);
      setViewTask(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Toggles a subtask's completion and updates local state with the server response
  const handleToggleSubtask = async (taskId, subtaskId) => {
    try {
      const res = await api.patch(`/tasks/${taskId}/subtasks/${subtaskId}/toggle`);
      setActiveBoard(prev => ({
        ...prev,
        columns: prev.columns.map(col => ({
          ...col,
          tasks: col.tasks.map(t =>
            t.id === taskId
              ? { ...t, subtasks: t.subtasks.map(s => s.id === subtaskId ? res.data : s) }
              : t
          )
        }))
      }));
      return res.data;
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  // Moves a task to a different column via the status dropdown in TaskViewModal
  const handleStatusChange = async (taskId, newColumnId) => {
    try {
      const res = await api.put(`/tasks/${taskId}`, { columnId: newColumnId });
      const updated = res.data;

      setActiveBoard(prev => {
        // Remove task from every column first, then add it to the target column
        const newColumns = prev.columns.map(col => ({
          ...col,
          tasks: col.tasks.filter(t => t.id !== taskId)
        }));

        return {
          ...prev,
          columns: newColumns.map(col =>
            col.id === newColumnId
              ? { ...col, tasks: [...col.tasks, updated] }
              : col
          )
        };
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Moves a task via drag-and-drop: calls the /move endpoint and updates local state optimistically
  const handleMoveTask = async (taskId, targetColumnId, targetPosition) => {
    try {
      await api.patch(`/tasks/${taskId}/move`, { columnId: targetColumnId, position: targetPosition });

      setActiveBoard(prev => {
        let movedTask = null;

        // Remove the task from its current column and remember it
        const clearedCols = prev.columns.map(col => {
          const task = col.tasks.find(t => t.id === taskId);
          if (task) movedTask = task;
          return { ...col, tasks: col.tasks.filter(t => t.id !== taskId) };
        });

        if (!movedTask) return prev;

        // Splice it into the target column at the desired position
        return {
          ...prev,
          columns: clearedCols.map(col => {
            if (col.id !== targetColumnId) return col;
            const tasks = [...col.tasks];
            tasks.splice(targetPosition, 0, movedTask);
            return { ...col, tasks };
          })
        };
      });
    } catch (err) {
      console.error(err);
    }
  };

  // --- Helpers ---

  // Finds which column currently contains the given task (used to detect column changes on edit)
  const findTaskColumn = (taskId) => {
    return activeBoard?.columns.find(col => col.tasks.some(t => t.id === taskId));
  };

  // Removes the old version of a task from all columns then inserts the updated version.
  // If movedToColumnId is provided the task goes there; otherwise it stays in its original column.
  const refreshTask = (updated, movedToColumnId) => {
    setActiveBoard(prev => {
      if (!prev) return prev;
      let cols = prev.columns.map(col => ({
        ...col,
        tasks: col.tasks.filter(t => t.id !== updated.id)
      }));

      const targetColId = movedToColumnId || updated.column_id;

      cols = cols.map(col =>
        col.id === targetColId
          ? { ...col, tasks: [...col.tasks, updated] }
          : col
      );

      return { ...prev, columns: cols };
    });
  };

  // Show a spinner while the initial board data is loading
  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
      </div>
    );
  }

  return (
    <div className={styles.app}>
      {/* Sidebar: board list + theme toggle */}
      <Sidebar
        boards={boards}
        activeBoard={activeBoard}
        onSelectBoard={handleSelectBoard}
        onNewBoard={() => setShowNewBoard(true)}
        sidebarVisible={sidebarVisible}
        setSidebarVisible={setSidebarVisible}
      />

      <div className={styles.main}>
        {/* Header: board title + Add Task button + board menu */}
        <Header
          board={activeBoard}
          onAddTask={() => setShowNewTask(true)}
          onEditBoard={() => setEditBoard(activeBoard)}
          onDeleteBoard={() => setDeleteTarget({ type: 'board', item: activeBoard })}
          sidebarVisible={sidebarVisible}
        />

        <div className={styles.content}>
          {/* Board: renders columns and task cards, handles drag-and-drop */}
          <Board
            board={activeBoard}
            onTaskClick={setViewTask}
            onAddColumn={() => setEditBoard(activeBoard)}
            onMoveTask={handleMoveTask}
          />
        </div>
      </div>

      {/* Task View Modal — read-only view with subtask toggles and status change */}
      {viewTask && (
        <TaskViewModal
          task={viewTask}
          columns={activeBoard?.columns || []}
          onClose={() => setViewTask(null)}
          onEdit={() => { setEditTask(viewTask); setViewTask(null); }}
          onDelete={() => { setDeleteTarget({ type: 'task', item: viewTask }); setViewTask(null); }}
          onToggleSubtask={handleToggleSubtask}
          onStatusChange={handleStatusChange}
        />
      )}

      {/* New Task Modal — no `task` prop means the form starts empty */}
      {showNewTask && (
        <TaskFormModal
          columns={activeBoard?.columns || []}
          onClose={() => setShowNewTask(false)}
          onSubmit={handleCreateTask}
        />
      )}

      {/* Edit Task Modal — `task` prop pre-fills the form */}
      {editTask && (
        <TaskFormModal
          task={editTask}
          columns={activeBoard?.columns || []}
          onClose={() => setEditTask(null)}
          onSubmit={handleUpdateTask}
        />
      )}

      {/* New Board Modal */}
      {showNewBoard && (
        <BoardFormModal
          onClose={() => setShowNewBoard(false)}
          onSubmit={handleCreateBoard}
        />
      )}

      {/* Edit Board Modal — `board` prop pre-fills name and columns */}
      {editBoard && (
        <BoardFormModal
          board={editBoard}
          onClose={() => setEditBoard(null)}
          onSubmit={handleUpdateBoard}
        />
      )}

      {/* Delete Confirmation Modal — shared for boards and tasks */}
      {deleteTarget && (
        <DeleteModal
          type={deleteTarget.type}
          name={deleteTarget.item.name || deleteTarget.item.title}
          onClose={() => setDeleteTarget(null)}
          onConfirm={deleteTarget.type === 'board' ? handleDeleteBoard : handleDeleteTask}
          loading={deleteLoading}
        />
      )}
    </div>
  );
}

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

  const [boards, setBoards] = useState([]);
  const [activeBoard, setActiveBoard] = useState(null);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [loading, setLoading] = useState(true);

  const [viewTask, setViewTask] = useState(null);
  const [editTask, setEditTask] = useState(null);
  const [showNewTask, setShowNewTask] = useState(false);
  const [showNewBoard, setShowNewBoard] = useState(false);
  const [editBoard, setEditBoard] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    loadBoards();
  }, []);

  const loadBoards = async () => {
    try {
      const res = await api.get('/boards');
      setBoards(res.data);
      if (res.data.length > 0) {
        await loadBoard(res.data[0].id);
      }
    } catch (err) {
      if (err.response?.status === 401) logout();
    } finally {
      setLoading(false);
    }
  };

  const loadBoard = async (boardId) => {
    try {
      const res = await api.get(`/boards/${boardId}`);
      setActiveBoard(res.data);
    } catch (err) {
      console.error('Failed to load board:', err);
    }
  };

  const handleSelectBoard = useCallback(async (board) => {
    await loadBoard(board.id);
  }, []);

  const handleCreateBoard = async (data) => {
    const res = await api.post('/boards', data);
    const newBoard = res.data;
    setBoards(prev => [...prev, newBoard]);
    setActiveBoard(newBoard);
  };

  const handleUpdateBoard = async (data) => {
    const res = await api.put(`/boards/${activeBoard.id}`, data);
    const updated = res.data;
    setBoards(prev => prev.map(b =>
      b.id === updated.id ? { ...b, name: updated.name } : b
    ));
    setActiveBoard(updated);
  };

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

  const handleUpdateTask = async (data) => {
    const task = editTask || viewTask;
    const res = await api.put(`/tasks/${task.id}`, {
      title: data.title,
      description: data.description,
      columnId: data.columnId,
      subtasks: data.subtasks,
    });
    const updated = res.data;
    refreshTaskInState(updated, data.columnId);
  };

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

  const handleStatusChange = async (taskId, newColumnId) => {
    try {
      const res = await api.put(`/tasks/${taskId}`, { columnId: newColumnId });
      const updated = res.data;
      setActiveBoard(prev => {
        const clearedColumns = prev.columns.map(col => ({
          ...col,
          tasks: col.tasks.filter(t => t.id !== taskId)
        }));
        return {
          ...prev,
          columns: clearedColumns.map(col =>
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

  const handleMoveTask = async (taskId, targetColumnId, targetPosition) => {
    try {
      await api.patch(`/tasks/${taskId}/move`, {
        columnId: targetColumnId,
        position: targetPosition
      });

      setActiveBoard(prev => {
        let movedTask = null;

        const clearedCols = prev.columns.map(col => {
          const task = col.tasks.find(t => t.id === taskId);
          if (task) movedTask = task;
          return { ...col, tasks: col.tasks.filter(t => t.id !== taskId) };
        });

        if (!movedTask) return prev;

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

  const refreshTaskInState = (updated, newColumnId) => {
    setActiveBoard(prev => {
      if (!prev) return prev;

      let cols = prev.columns.map(col => ({
        ...col,
        tasks: col.tasks.filter(t => t.id !== updated.id)
      }));

      const targetColId = newColumnId || updated.column_id;
      cols = cols.map(col =>
        col.id === targetColId
          ? { ...col, tasks: [...col.tasks, updated] }
          : col
      );

      return { ...prev, columns: cols };
    });
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
      </div>
    );
  }

  return (
    <div className={styles.app}>
      <Sidebar
        boards={boards}
        activeBoard={activeBoard}
        onSelectBoard={handleSelectBoard}
        onNewBoard={() => setShowNewBoard(true)}
        sidebarVisible={sidebarVisible}
        setSidebarVisible={setSidebarVisible}
      />

      <div className={styles.main}>
        <Header
          board={activeBoard}
          onAddTask={() => setShowNewTask(true)}
          onEditBoard={() => setEditBoard(activeBoard)}
          onDeleteBoard={() => setDeleteTarget({ type: 'board', item: activeBoard })}
          sidebarVisible={sidebarVisible}
        />

        <div className={styles.content}>
          <Board
            board={activeBoard}
            onTaskClick={setViewTask}
            onAddColumn={() => setEditBoard(activeBoard)}
            onMoveTask={handleMoveTask}
          />
        </div>
      </div>

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

      {showNewTask && (
        <TaskFormModal
          columns={activeBoard?.columns || []}
          onClose={() => setShowNewTask(false)}
          onSubmit={handleCreateTask}
        />
      )}

      {editTask && (
        <TaskFormModal
          task={editTask}
          columns={activeBoard?.columns || []}
          onClose={() => setEditTask(null)}
          onSubmit={handleUpdateTask}
        />
      )}

      {showNewBoard && (
        <BoardFormModal
          onClose={() => setShowNewBoard(false)}
          onSubmit={handleCreateBoard}
        />
      )}

      {editBoard && (
        <BoardFormModal
          board={editBoard}
          onClose={() => setEditBoard(null)}
          onSubmit={handleUpdateBoard}
        />
      )}

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
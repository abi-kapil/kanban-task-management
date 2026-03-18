import { useState } from 'react';
import Modal from './Modal';
import styles from './TaskViewModal.module.css';
import f from './FormStyles.module.css';

const EllipsisIcon = () => (
  <svg width="5" height="20" viewBox="0 0 5 20" fill="none">
    <circle cx="2.308" cy="2.308" r="2.308" fill="#828FA3"/>
    <circle cx="2.308" cy="10" r="2.308" fill="#828FA3"/>
    <circle cx="2.308" cy="17.692" r="2.308" fill="#828FA3"/>
  </svg>
);

export default function TaskViewModal({ task, columns, onClose, onEdit, onDelete, onToggleSubtask, onStatusChange }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [localTask, setLocalTask] = useState(task);

  const completedCount = localTask.subtasks?.filter(s => s.is_completed).length || 0;
  const totalCount = localTask.subtasks?.length || 0;

  const handleToggle = async (subtaskId) => {
    setLocalTask(prev => ({
      ...prev,
      subtasks: prev.subtasks.map(s =>
        s.id === subtaskId ? { ...s, is_completed: !s.is_completed } : s
      )
    }));
    await onToggleSubtask(task.id, subtaskId);
  };

  const handleStatusChange = async (e) => {
    const newColumnId = e.target.value;
    await onStatusChange(task.id, newColumnId);
    onClose();
  };

  const currentColumn = columns.find(c => c.tasks?.some(t => t.id === task.id));

  return (
    <Modal onClose={onClose}>
      <div className={styles.header}>
        <h2 className={styles.title}>{localTask.title}</h2>
        <div className={styles.menuWrap}>
          <button className={styles.ellipsis} onClick={() => setMenuOpen(o => !o)}>
            <EllipsisIcon />
          </button>
          {menuOpen && (
            <>
              <div className={styles.backdrop} onClick={() => setMenuOpen(false)} />
              <div className={styles.menu}>
                <button onClick={() => { setMenuOpen(false); onEdit(); }}>
                  Edit Task
                </button>
                <button
                  className={styles.danger}
                  onClick={() => { setMenuOpen(false); onDelete(); }}
                >
                  Delete Task
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {localTask.description && (
        <p className={styles.description}>{localTask.description}</p>
      )}

      {totalCount > 0 && (
        <div className={styles.subtasksSection}>
          <p className={styles.sectionLabel}>
            Subtasks ({completedCount} of {totalCount})
          </p>
          <div className={styles.subtaskList}>
            {localTask.subtasks.map(subtask => (
              <label key={subtask.id} className={styles.subtask}>
                <input
                  type="checkbox"
                  checked={subtask.is_completed}
                  onChange={() => handleToggle(subtask.id)}
                />
                <span className={subtask.is_completed ? styles.completed : ''}>
                  {subtask.title}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div className={styles.statusSection}>
        <p className={styles.sectionLabel}>Current Status</p>
        <select
          className={f.select}
          value={currentColumn?.id || ''}
          onChange={handleStatusChange}
        >
          {columns.map(col => (
            <option key={col.id} value={col.id}>{col.name}</option>
          ))}
        </select>
      </div>
    </Modal>
  );
}

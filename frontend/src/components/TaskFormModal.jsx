import { useState } from 'react';
import Modal from './Modal';
import f from './FormStyles.module.css';

export default function TaskFormModal({ task, columns, onClose, onSubmit }) {
  const isEdit = !!task;

  const currentColumn = columns.find(c => c.tasks?.some(t => t.id === task?.id));

  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [columnId, setColumnId] = useState(currentColumn?.id || columns[0]?.id || '');
  const [subtasks, setSubtasks] = useState(
    task?.subtasks?.length > 0
      ? task.subtasks.map(s => ({ id: s.id, title: s.title, is_completed: s.is_completed }))
      : [{ id: null, title: '', is_completed: false }]
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const addSubtask = () => {
    setSubtasks(prev => [...prev, { id: null, title: '', is_completed: false }]);
  };

  const removeSubtask = (index) => {
    setSubtasks(prev => prev.filter((_, i) => i !== index));
  };

  const updateSubtask = (index, value) => {
    setSubtasks(prev => prev.map((s, i) => i === index ? { ...s, title: value } : s));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await onSubmit({
        title,
        description,
        columnId,
        subtasks: subtasks.filter(s => s.title.trim()),
      });
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal onClose={onClose}>
      <h2 className={f.title}>{isEdit ? 'Edit Task' : 'Add New Task'}</h2>

      {error && <div className={f.errorMsg}>{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className={f.field}>
          <label className={f.label}>Title</label>
          <input
            className={f.input}
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Take coffee break"
          />
        </div>

        <div className={f.field}>
          <label className={f.label}>Description</label>
          <textarea
            className={f.textarea}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="e.g. It's always good to take a break. This 15 minute break will recharge the batteries a little."
          />
        </div>

        <div className={f.field}>
          <label className={f.label}>Subtasks</label>
          {subtasks.map((subtask, index) => (
            <div key={index} className={f.fieldRow} style={{ marginBottom: 8 }}>
              <input
                className={f.input}
                value={subtask.title}
                onChange={e => updateSubtask(index, e.target.value)}
                placeholder="e.g. Make coffee"
              />
              <button
                type="button"
                className={f.removeBtn}
                onClick={() => removeSubtask(index)}
              >
                ✕
              </button>
            </div>
          ))}
          <button type="button" className={f.addBtn} onClick={addSubtask}>
            + Add New Subtask
          </button>
        </div>

        <div className={f.field}>
          <label className={f.label}>Status</label>
          <select
            className={f.select}
            value={columnId}
            onChange={e => setColumnId(e.target.value)}
          >
            {columns.map(col => (
              <option key={col.id} value={col.id}>{col.name}</option>
            ))}
          </select>
        </div>

        <button type="submit" className={f.submitBtn} disabled={loading}>
          {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Task'}
        </button>
      </form>
    </Modal>
  );
}

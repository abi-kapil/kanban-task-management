import Modal from './Modal';
import f from './FormStyles.module.css';

export default function DeleteModal({ type, name, onClose, onConfirm, loading }) {
  const isTask = type === 'task';

  return (
    <Modal onClose={onClose}>
      <h2 className={`${f.title} ${f.danger}`}>
        Delete this {isTask ? 'task' : 'board'}?
      </h2>

      <p style={{
        fontSize: 13,
        fontWeight: 500,
        color: 'var(--medium-grey)',
        lineHeight: 1.7,
        marginBottom: 24
      }}>
        {isTask
          ? `Are you sure you want to delete the '${name}' task and its subtasks? This action cannot be reversed.`
          : `Are you sure you want to delete the '${name}' board? This action will remove all columns and tasks and cannot be reversed.`
        }
      </p>

      <button
        className={`${f.submitBtn} ${f.danger}`}
        onClick={onConfirm}
        disabled={loading}
        style={{ marginBottom: 16 }}
      >
        {loading ? 'Deleting...' : 'Delete'}
      </button>

      <button
        className={f.cancelBtn}
        onClick={onClose}
        disabled={loading}
      >
        Cancel
      </button>
    </Modal>
  );
}

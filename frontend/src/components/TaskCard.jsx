import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import styles from './TaskCard.module.css';

export default function TaskCard({ task, onClick, isDragging }) {

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id });

  const completedCount = task.subtasks?.filter(s => s.is_completed).length || 0;
  const totalCount = task.subtasks?.length || 0;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.3 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${styles.card} ${isDragging ? styles.dragging : ''}`}
      onClick={onClick}
      {...attributes}
      {...listeners}
    >
      <h4 className={styles.title}>{task.title}</h4>

      {totalCount > 0 && (
        <p className={styles.subtasks}>
          {completedCount} of {totalCount} subtasks
        </p>
      )}
    </div>
  );
}

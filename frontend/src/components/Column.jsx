import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import TaskCard from './TaskCard';
import styles from './Column.module.css';

export default function Column({ column, onTaskClick }) {

  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <div className={styles.column}>
      <div className={styles.header}>
        <div
          className={styles.dot}
          style={{ backgroundColor: column.color }}
        />
        <h3>{column.name.toUpperCase()} ({column.tasks.length})</h3>
      </div>

      <SortableContext
        items={column.tasks.map(t => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div
          ref={setNodeRef}
          className={`${styles.taskList} ${isOver ? styles.over : ''}`}
        >
          {column.tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onClick={() => onTaskClick(task)}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

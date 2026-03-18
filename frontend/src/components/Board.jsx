import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import Column from './Column';
import TaskCard from './TaskCard';
import styles from './Board.module.css';

export default function Board({ board, onTaskClick, onAddColumn, onMoveTask }) {
  const [activeTask, setActiveTask] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event) => {
    const { active } = event;
    const task = findTask(active.id);
    setActiveTask(task);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id;
    const overId = over.id;

    let targetColumnId = null;
    let targetPosition = 0;

    for (const col of board.columns) {
      if (col.id === overId) {
        targetColumnId = col.id;
        targetPosition = col.tasks.length;
        break;
      }
      const taskIndex = col.tasks.findIndex(t => t.id === overId);
      if (taskIndex !== -1) {
        targetColumnId = col.id;
        targetPosition = taskIndex;
        break;
      }
    }

    if (targetColumnId) {
      onMoveTask(taskId, targetColumnId, targetPosition);
    }
  };

  const findTask = (id) => {
    for (const col of board.columns) {
      const task = col.tasks.find(t => t.id === id);
      if (task) return task;
    }
    return null;
  };

  if (!board) {
    return (
      <div className={styles.emptyState}>
        <p>Select a board from the sidebar to get started.</p>
      </div>
    );
  }

  if (board.columns.length === 0) {
    return (
      <div className={styles.emptyState}>
        <h2>This board is empty. Create a new column to get started.</h2>
        <button className={styles.addColBtn} onClick={onAddColumn}>
          + Add New Column
        </button>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className={styles.board}>
        {board.columns.map((column) => (
          <Column
            key={column.id}
            column={column}
            onTaskClick={onTaskClick}
          />
        ))}

        <button className={styles.addColumn} onClick={onAddColumn}>
          + New Column
        </button>
      </div>

      <DragOverlay>
        {activeTask && (
          <TaskCard task={activeTask} isDragging />
        )}
      </DragOverlay>
    </DndContext>
  );
}

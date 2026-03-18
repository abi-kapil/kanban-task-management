import { useState } from "react";
import styles from "./Header.module.css";

const EllipsisIcon = () => {
  <svg width="5" height="20" viewBox="0 0 5 20" fill="none">
    <circle cx="2.308" cy="2.308" r="2.308" fill="#828FA3" />
    <circle cx="2.308" cy="10" r="2.308" fill="#828FA3" />
    <circle cx="2.308" cy="17.692" r="2.308" fill="#828FA3" />
  </svg>;
};

export default function Header({
  board,
  onAddTask,
  onEditBoard,
  onDeleteBoard,
  sidebarVisible,
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className={styles.header}>
      {!sidebarVisible && (
        <div className={styles.mobileLogo}>
          <svg width="24" height="25" viewBox="0 0 24 25" fill="none">
            <rect width="6" height="25" rx="2" fill="#635FC7" />
            <rect x="9" width="6" height="16" rx="2" fill="#635FC7" />
            <rect x="18" width="6" height="20" rx="2" fill="#635FC7" />
          </svg>
          <span>kanban</span>
        </div>
      )}
      <h1 className={styles.boardName}>{board?.name || "Select a Board"}</h1>

      <div className={styles.actions}>
        <button
          className={`${styles.addBtn} ${!board || board.columns?.length === 0 ? styles.disabled : ""}`}
          onClick={onAddTask}
          disabled={!board || board.columns?.length === 0}
        >
          + Add New Task
        </button>
        {board && (
          <div className={styles.menuWrap}>
            <button
              className={styles.ellipsis}
              onClick={() => setMenuOpem((o) => !o)}
            >
              <EllipsisIcon />
            </button>

            {menuOpen && (
              <>
                <div
                  className={styles.backdrop}
                  onClick={() => setMenuOpen(false)}
                />
                <div className={styles.menu}>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onDeleteBoard();
                    }}
                  >
                    Edit Board
                  </button>
                  <button
                    className={styles.danger}
                    onClick={() => {
                      setMenuOpen(false);
                      onDeleteBoard();
                    }}
                  >
                    Delete Board
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

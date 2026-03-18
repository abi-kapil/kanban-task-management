import { useTheme } from "../contexts/ThemeContext";
import styles from "./Sidebar.module.css";

const BoardIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M0.846 0.846A2.077 2.077 0 012.308 0h11.385a2.077 2.077 0 012.076 2.077v11.384a2.077 2.077 0 01-2.076 2.077H2.308a2.077 2.077 0 01-2.077-2.077V2.077c0-.55.219-1.08.615-1.23zM5.538 2.077H2.308v11.384h3.23V2.077zm2.077 0v11.384h5.077V2.077H7.615z"
      fill="currentColor"
    />{" "}
    {/* currentColor inherits color from parent */}
  </svg>
);

const SunIcon = () => (
  <svg width="19" height="19" viewBox="0 0 19 19" fill="none">
    <circle cx="9.5" cy="9.5" r="3.857" stroke="#828FA3" strokeWidth="1.5" />
    <path
      d="M9.5 1v2.143M9.5 15.857V18M1 9.5h2.143M15.857 9.5H18M3.515 3.515l1.515 1.515M13.97 13.97l1.515 1.515M3.515 15.485l1.515-1.515M13.97 5.03l1.515-1.515"
      stroke="#828FA3"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const MoonIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path
      d="M6.474.1a7.48 7.48 0 000 15.8c4.143 0 7.5-3.358 7.5-7.5A7.48 7.48 0 006.474.1zm5.263 10.263A5.978 5.978 0 016.474 14.4a5.978 5.978 0 01-5.974-5.9 5.978 5.978 0 014.2-5.698A8.975 8.975 0 0015.974 8.6a8.975 8.975 0 01-4.237 1.763z"
      fill="#828FA3"
    />
  </svg>
);

const HideSidebarIcon = () => (
  <svg width="18" height="16" viewBox="0 0 18 16" fill="none">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M17.333 2A1.667 1.667 0 0015.667.333H2.333A1.667 1.667 0 00.667 2v12c0 .92.746 1.667 1.666 1.667h13.334c.92 0 1.666-.747 1.666-1.667V2zM5.667 2H2.333v12h3.334V2zm1.666 0v12h8.334V2H7.333zM4 5.333a.667.667 0 000 1.334h1.333a.667.667 0 000-1.334H4zm-.667 4A.667.667 0 014 8.667h1.333a.667.667 0 010 1.333H4a.667.667 0 01-.667-.667z"
      fill="currentColor"
    />
  </svg>
);

const ShowSidebarIcon = () => (
  <svg width="16" height="11" viewBox="0 0 16 11" fill="none">
    <path
      d="M15.815 4.434A9.055 9.055 0 008 0 9.055 9.055 0 00.185 4.434a1.333 1.333 0 000 1.132A9.055 9.055 0 008 10a9.055 9.055 0 007.815-4.434 1.333 1.333 0 000-1.132zM8 8.667a5.333 5.333 0 110-10.667 5.333 5.333 0 010 10.667zM8 4a4 4 0 100 8 4 4 0 000-8z"
      fill="#635FC7"
    />
  </svg>
);

export default function Sidebar({
  boards,
  activeBoard,
  onSelectBoard,
  onNewBoard,
  sidebarVisible,
  setSidebarVisible,
}) {
  const { isDark, toggleTheme } = useTheme();

  if (!sidebarVisible) {
    return (
      <button
        className={styles.showSideBar}
        onClick={() => setSidebarVisible(true)}
      >
        <ShowSidebarIcon />
      </button>
    );
  }

  return (
    <aside className={styles.sidebar}>
      <div classsName={styles.logo}>
        <svg width="24" height="25" viewBox="0 0 24 25" fill="none">
          <rect width="6" height="25" rx="2" fill="#635FC7" />
          <rect x="9" width="6" height="16" rx="2" fill="#635FC7" />
          <rect x="18" width="6" height="20" rx="2" fill="#635FC7" />
        </svg>
        <span className={styles.logoText}>kanban</span>
      </div>

      <div className={styles.boardsSelection}>
        <p className={styles.selectionLabel}>ALL BOARDS ({boards.length})</p>
        <nav classsName={styles.boardlist}>
          {boards.map((board) => (
            <button
              key={board.id}
              className={`${styles.boardItem} ${activeBoard?.id === board.id ? styles.active : ""}`}
              onClick={() => onSelectBoard(board)}
            >
              <BoardIcon />
              <span>{board.name}</span>
            </button>
          ))}

          <button
            className={`${styles.boardItem} ${styles.newBoard}`}
            onClick={onNewBoard}
          >
            <BoardIcon />
            <span>+ Create New Board</span>
          </button>
        </nav>
      </div>

      <div className={styles.bottom}>
        <div className={styles.themeToggle}>
          <SunIcon />
          <button
            className={`${styles.toggleTrack} ${isDark ? styles.toggleOn : ""}`}
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            <span className={styles.toggleThumb} />
          </button>
          <MoonIcon />
        </div>

        <button
          className={styles.HideSidebar}
          onClick={() => setSidebarVisible(false)}
        >
          <HideSidebarIcon />
          <span>Hide Sidebar</span>
        </button>
      </div>
    </aside>
  );
}

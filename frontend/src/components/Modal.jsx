import { useEffect } from "react";
import styles from "./Modal.module.css";

export default function Modal({ children, onClose }) {
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);

    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.module} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

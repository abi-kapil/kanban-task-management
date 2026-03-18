import { useState } from "react";
import Modal from "./Modal";
import f from "./FormStyles.module.css";

const COLUMN_COLORS = [
  "#49C4E5",
  "#8471F2",
  "#67E2AE",
  "#FF6B6B",
  "#FFB946",
  "#4CAF50",
  "#FF8C69",
  "#A29BFE",
];

export default function BoardFormModal({ board, onClose, onSubmit }) {
  const isEdit = !!board;

  const [name, setBoardName] = useState(board?.name || "");
  const [columns, setColumns] = useState(
    board?.columns?.length > 0
      ? board.columns.map((c, i) => ({
          id: c.id,
          name: c.name,
          color: c.color || COLUMN_COLORS[i % COLUMN_COLORS.length],
        }))
      : [
          { id: null, name: "Todo", color: COLUMN_COLORS[0] },
          { id: null, name: "Doing", color: COLUMN_COLORS[1] },
        ],
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const addColumn = () => {
    setColumns((prev) => [
      ...prev,
      {
        id: null,
        name: "",
        color: COLUMN_COLORS[prev.length % COLUMN_COLORS.length],
      },
    ]);
  };

  const removeColumn = (index) => {
    setColumns((prev) => prev.filter((_, i) => i !== index));
  };

  const updateColumn = (index, field, value) => {
    setColumns((prev) =>
      prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)),
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Board name is required");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await onSubmit({
        name,
        columns: columns.filter((c) => c.name.trim()),
      });
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal onClose={onClose}>
      <h2 className={f.title}>{isEdit ? "Edit Board" : "Add New Board"}</h2>

      {error && <div className={f.errorMsg}>{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className={f.field}>
          <label className={f.label}>Board Name</label>
          <input
            className={f.input}
            value={name}
            onChange={(e) => setBoardName(e.target.value)}
            placeholder="e.g. Web Design"
          />
        </div>

        <div className={f.field}>
          <label className={f.label}>Board Columns</label>
          {columns.map((col, index) => (
            <div key={index} className={f.fieldRow} style={{ marginBottom: 8 }}>
              <div
                className={f.colorDot}
                style={{ backgroundColor: col.color }}
              />
              <input
                className={f.input}
                value={col.name}
                onChange={(e) => updateColumn(index, "name", e.target.value)}
                placeholder="e.g. Todo"
              />
              <button
                type="button"
                className={f.removeBtn}
                onClick={() => removeColumn(index)}
              >
                ✕
              </button>
            </div>
          ))}
          <button type="button" className={f.addBtn} onClick={addColumn}>
            + Add New Column
          </button>
        </div>

        <button type="submit" className={f.submitBtn} disabled={loading}>
          {loading ? "Saving..." : isEdit ? "Save Changes" : "Create New Board"}
        </button>
      </form>
    </Modal>
  );
}

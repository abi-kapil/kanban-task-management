// Central route file — maps every API endpoint to its controller function.
// All routes here are mounted under /api in index.js (e.g. POST /api/auth/register).
// Protected routes require a valid JWT via the authenticateToken middleware.

import { Router } from "express";
import { register, login, getMe } from "../controllers/auth.js";
import {
  getBoards,
  getBoardWithColumns,
  createBoard,
  updateBoard,
  deleteBoard,
} from "../controllers/boards.js";
import {
  getTask,
  createTask,
  updateTask,
  deleteTask,
  toggleSubtask,
  moveTask,
} from "../controllers/tasks.js";
import { authenticateToken } from "../middleware/auth.js";

const router = Router();

// --- Auth routes ---
// Public endpoints — no token required
router.post("/auth/register", register);           // Create a new account
router.post("/auth/login", login);                 // Login and receive a JWT
router.get("/auth/me", authenticateToken, getMe);  // Get the currently logged-in user (protected)

// --- Board routes (all protected) ---
router.get("/boards", authenticateToken, getBoards);                      // List all boards for the user
router.get("/boards/:id", authenticateToken, getBoardWithColumns);        // Get one board with its columns + tasks
router.post("/boards", authenticateToken, createBoard);                   // Create a new board
router.put("/boards/:id", authenticateToken, updateBoard);                // Update board name / columns
router.delete("/boards/:id", authenticateToken, deleteBoard);             // Delete a board (cascades to columns/tasks)

// --- Task routes (all protected) ---
router.get("/tasks/:id", authenticateToken, getTask);                     // Get a single task with subtasks
router.post("/tasks", authenticateToken, createTask);                     // Create a new task in a column
router.put("/tasks/:id", authenticateToken, updateTask);                  // Edit task title, description, subtasks, or column
router.delete("/tasks/:id", authenticateToken, deleteTask);               // Delete a task
router.post(
  "/tasks/:taskId/subtasks/:subTaskId/toggle",
  authenticateToken,
  toggleSubtask,   // Flip a subtask's is_completed flag
);
router.post("/tasks/:id/move", authenticateToken, moveTask);              // Drag-and-drop: move task to a different column/position

export default router;

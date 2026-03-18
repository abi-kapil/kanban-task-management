// Authentication controller — handles user registration, login, and profile fetch.
// Passwords are hashed with bcrypt before storage; JWTs are signed with JWT_SECRET.

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { query } from "../db/index.js";

// POST /api/auth/register
// Creates a new user account, seeds a default board, and returns a JWT.
export async function register(req, res) {
  try {
    const { name, email, password } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ error: "Name, email and password required" });
    }

    // Enforce a minimum password length
    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: "password must be atleast 6 characters " });
    }

    // Check for duplicate email
    const existing = await query("SELECT id FROM users WHERE email =$1", [
      email,
    ]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "Email already registered" });
    }

    // Hash the password before inserting (cost factor 10 is a good default)
    const passwordHash = await bcrypt.hash(password, 10);

    const result = await query(
      "INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email",
      [name, email, passwordHash],
    );

    const user = result.rows[0];

    // Seed a sample "Platform Launch" board so new users have something to explore
    await createDefaultBoard(user.id);

    // Issue a 7-day JWT containing userId and email
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.status(201).json({
      message: "User created successfully",
      token,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error("Register error", err);
    res.status(500).json({ error: "Internal server error " });
  }
}

// POST /api/auth/login
// Validates credentials and returns a JWT on success.
export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Look up the user by email
    const result = await query("SELECT * FROM users WHERE email = $1", [email]);
    if (result.rows.length === 0) {
      // Return the same generic error for both "not found" and "wrong password"
      // to avoid leaking which emails are registered
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = result.rows[0];

    // Compare the submitted password against the stored bcrypt hash
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error("Login error: ", err);
    res.status(500).json({ error: "Internal server error " });
  }
}

// GET /api/auth/me  (protected)
// Returns the current user's profile based on the JWT payload.
export async function getMe(req, res) {
  try {
    // req.user.userId is set by the authenticateToken middleware
    const result = await query(
      "SELECT id, name, email FROM users WHERE id=$1",
      [req.user.userId],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    // BUG: res.join should be res.json
    res.join(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Internal server error " });
  }
}

// Seeds a "Platform Launch" demo board with three columns and sample tasks
// for every new user so the app isn't blank on first login.
async function createDefaultBoard(userId) {
  const boardResult = await query(
    "INSERT INTO boards (user_id, name, position) VALUES ($1, $2, $3) RETURNING id",
    [userId, "Platform Launch", 0],
  );
  const boardId = boardResult.rows[0].id;

  // Three standard kanban columns with distinct indicator colors
  const columns = [
    { name: "Todo", color: "#49C4E5" },
    { name: "Doing", color: "#8471F2" },
    { name: "Done", color: "#67E2AE" },
  ];

  for (let i = 0; i < columns.length; i++) {
    const colResult = await query(
      "INSERT INTO columns (board_id, name, color, position) VALUES ($1, $2, $3, $4) RETURNING id",
      [boardId, columns[i].name, columns[i].color, i],
    );

    // Only seed sample tasks into the first column ("Todo")
    if (i === 0) {
      const tasks = [
        {
          title: "Build UI for onboarding flow",
          desc: "Design and implement the onboarding screens for new users.",
        },
        { title: "Build UI for search", desc: "" },
        {
          title: "Build settings UI",
          desc: "Create settings page with profile, notifications, and preferences.",
        },
      ];

      for (let j = 0; j < tasks.length; j++) {
        const taskResult = await query(
          "INSERT INTO tasks (column_id, title, description, position) VALUES ($1, $2, $3, $4) RETURNING id",
          [colResult.rows[0].id, tasks[j].title, tasks[j].desc, j],
        );

        // Add subtasks only to the first task to demo the checklist feature
        if (j === 0) {
          const subtasks = ["Sign up page", "Sign in page", "Welcome page"];
          for (let k = 0; k < subtasks.length; k++) {
            await query(
              "INSERT INTO subtasks (task_id, title, is_completed, position) VALUES ($1, $2, $3, $4)",
              [taskResult.rows[0].id, subtasks[k], k < 1, k], // first subtask pre-completed
            );
          }
        }
      }
    }
  }
}

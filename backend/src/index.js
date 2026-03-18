// Entry point for the Express backend server.
// Responsibilities: configure middleware, mount routes, initialize the DB, start listening.

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { initDB } from "./db/index.js";
import routes from "./routes/index.js";

dotenv.config(); // Load environment variables from .env file

const app = express();
const PORT = process.env.PORT || 5000;

// --- Middleware (runs on every incoming request) ---

// CORS: only allow requests from our React dev server (or the deployed frontend URL)
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173", // Allow requests from our React app
    credentials: true, // needed if we ever send cookies / auth headers
  }),
);

// Parse incoming JSON request bodies (e.g. req.body in controllers)
app.use(express.json()); // Allow the server to read JSON from requests

// --- Routes ---

// All API routes are prefixed with /api (e.g. GET /api/boards)
app.use("/api", routes);

// Simple health-check endpoint — useful for Docker/Railway uptime monitoring
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// --- Server startup ---

// We run initDB before listening so the schema exists before any request arrives.
// If DB init fails, we bail out rather than serving a broken API.
async function start() {
  try {
    await initDB(); // Set up database tables first
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

start();

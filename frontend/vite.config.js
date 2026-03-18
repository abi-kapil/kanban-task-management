// Vite configuration for the React frontend.
// During development, Vite runs on port 5173 and the Express API runs on port 5000.
// The proxy below forwards any request starting with /api to the backend,
// so the React app can call `api.get('/boards')` without hardcoding the backend URL
// and without running into CORS issues in development.

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Requests to /api/* are forwarded to the Express server
      "/api": {
        target: "http://localhost:5001",
        changeOrigin: true, // rewrites the Host header to match the target
      },
    },
  },
});

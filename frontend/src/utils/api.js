import axios from "axios";

// Create a pre-configured axios instance
// Every api call in the app uses this instead of plain axios
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api", // all requests atomatically start with /api
  headers: {
    "Content-type": "application/json", //tells the server we are sending JSON
  },
});

// Check if the user was previously logged in (token saved in localStorage)
// If yes, attach the token to every request automatically
const token = localStorage.getItem("kanban_token");

if (token) {
  api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
}

export default api;

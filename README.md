# 📋 Kanban Task Management App

A full-stack Kanban task management web application built with React, Node.js/Express, and PostgreSQL. Inspired by the Frontend Mentor Kanban Task Management challenge.

![Tech Stack](https://img.shields.io/badge/Frontend-React_+_Vite-61DAFB?logo=react)
![Backend](https://img.shields.io/badge/Backend-Node.js_+_Express-339933?logo=node.js)
![Database](https://img.shields.io/badge/Database-PostgreSQL-4169E1?logo=postgresql)

## ✨ Features

- **Authentication** – Register/login with JWT-based sessions
- **Multiple Boards** – Create and manage multiple Kanban boards
- **Columns & Tasks** – Fully customizable columns with task management
- **Subtasks** – Break tasks into subtasks with completion tracking
- **Drag & Drop** – Intuitive drag-and-drop task reordering (via @dnd-kit)
- **Dark/Light Mode** – Persistent theme toggle
- **Responsive** – Works across desktop and tablet
- **CRUD** – Full create, read, update, delete for boards, columns, tasks, and subtasks

## 🛠️ Tech Stack

### Frontend
- React 18 with Vite
- CSS Modules for scoped styling
- @dnd-kit for drag and drop
- React Router v6
- Axios for API calls
- Plus Jakarta Sans font

### Backend
- Node.js + Express
- PostgreSQL with native `pg` driver
- JWT authentication
- bcryptjs password hashing
- UUID for IDs

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+

### 1. Clone and install

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Database setup

Create a PostgreSQL database:

```sql
CREATE DATABASE kanban_db;
```

### 3. Backend configuration

```bash
cd backend
cp .env.example .env
```

Edit `.env`:
```env
PORT=5000
DATABASE_URL=postgresql://your_user:your_password@localhost:5432/kanban_db
JWT_SECRET=your-secret-key-min-32-chars
NODE_ENV=development
```

### 4. Initialize database schema

```bash
cd backend
npm run db:init
```

### 5. Start the servers

**Backend** (terminal 1):
```bash
cd backend
npm run dev
```

**Frontend** (terminal 2):
```bash
cd frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## 📁 Project Structure

```
kanban/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── auth.js        # Register, login, getMe
│   │   │   ├── boards.js      # Board CRUD
│   │   │   └── tasks.js       # Task CRUD + subtask toggle
│   │   ├── db/
│   │   │   ├── index.js       # DB connection & init
│   │   │   └── schema.sql     # Database schema
│   │   ├── middleware/
│   │   │   └── auth.js        # JWT middleware
│   │   ├── routes/
│   │   │   └── index.js       # All API routes
│   │   └── index.js           # Express app entry
│   ├── .env.example
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Board.jsx          # Drag-and-drop board
    │   │   ├── Column.jsx         # Droppable column
    │   │   ├── TaskCard.jsx       # Sortable task card
    │   │   ├── Sidebar.jsx        # Board navigation + theme
    │   │   ├── Header.jsx         # Top nav bar
    │   │   ├── Modal.jsx          # Base modal wrapper
    │   │   ├── TaskViewModal.jsx  # View task details
    │   │   ├── TaskFormModal.jsx  # Create/edit task
    │   │   ├── BoardFormModal.jsx # Create/edit board
    │   │   └── DeleteModal.jsx    # Confirm deletion
    │   ├── contexts/
    │   │   ├── AuthContext.jsx    # Auth state + API
    │   │   └── ThemeContext.jsx   # Dark/light mode
    │   ├── pages/
    │   │   ├── AuthPage.jsx       # Login/Register
    │   │   └── KanbanApp.jsx      # Main app
    │   ├── utils/
    │   │   └── api.js             # Axios instance
    │   └── App.jsx
    └── package.json
```

## 🔌 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |

### Boards
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/boards` | Get all user boards |
| GET | `/api/boards/:id` | Get board with columns and tasks |
| POST | `/api/boards` | Create board |
| PUT | `/api/boards/:id` | Update board (name + columns) |
| DELETE | `/api/boards/:id` | Delete board |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks/:id` | Get task with subtasks |
| POST | `/api/tasks` | Create task |
| PUT | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task |
| PATCH | `/api/tasks/:id/move` | Move task to column |
| PATCH | `/api/tasks/:taskId/subtasks/:subtaskId/toggle` | Toggle subtask |

## 🚢 Deployment

### Frontend (Vercel)
1. Push to GitHub
2. Import in Vercel
3. Set build command: `npm run build`
4. Set output directory: `dist`
5. Add env var: `VITE_API_URL=https://your-backend.railway.app/api`

### Backend (Railway)
1. Connect GitHub repo
2. Set root directory to `backend/`
3. Add environment variables from `.env`
4. Add `DATABASE_URL` from Railway's PostgreSQL plugin

## 📸 Design

Follows the [Frontend Mentor Kanban Task Management](https://www.frontendmentor.io/challenges/kanban-task-management-web-app-wgQLt-HlbB) design spec with:
- Dual dark/light themes
- Plus Jakarta Sans typography
- Purple (#635FC7) as primary accent
- Smooth modal animations
- Drag & drop with visual feedback

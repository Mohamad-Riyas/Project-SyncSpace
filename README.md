# SyncSpace

A real-time collaborative workspace that combines a **shared whiteboard** and a **code editor** in one web app. Built for interviews, pair programming, and team brainstorming.

## Features

- **Real-time collaboration** – live code editing (Monaco + Yjs) and whiteboard drawing (Konva) over Socket.IO
- **Workspaces** – create, edit, join (via invite link) and manage workspaces
- **Authentication** – email/password (JWT) and Google Sign-In
- **Code execution** – run code in the editor via the JDoodle API (Python also runs in-browser through a web worker)
- **Interviews & recordings** – schedule interviews, upload and review session recordings
- **Admin & audit logs** – user management and a full audit trail
- **Email notifications** – SMTP (Nodemailer) invites and alerts
- **Guide chatbox & onboarding** for new users

## Tech Stack

| Layer | Technologies |
|-------|--------------|
| Frontend | React 19, Vite, Tailwind CSS 4, React Router, Monaco Editor, Konva, Three.js, Yjs, Socket.IO client |
| Backend | Node.js, Express 5, Socket.IO, Mongoose (MongoDB), JWT, bcryptjs, Nodemailer, Google Auth Library, y-socket.io |
| Tooling | Oxlint, TypeScript config, Concurrently, Nodemon |

## Project Structure

```
.
├── backend/
│   ├── socket.js            # Socket / Yjs realtime layer
│   └── server/              # Express API
│       ├── server.js
│       ├── routes/          # auth, workspaces, files, interviews, recordings, admin, audit
│       ├── models/          # Mongoose models
│       ├── middleware/      # auth middleware
│       ├── utils/           # email, audit helpers
│       └── scripts/         # DB migration scripts
├── frontend/                # React + Vite app (src/pages, components, context, services)
├── video-production/        # Scripts/tools used to produce the demo video
├── demo-output/             # Demo assets
└── CHANGE_REPORT.md
```

## Prerequisites

- Node.js 18+ and npm
- A MongoDB instance (local or MongoDB Atlas)
- (Optional) JDoodle, SMTP and Google OAuth credentials

## Getting Started

### 1. Clone

```bash
git clone https://github.com/Mohamad-Riyas/Project-SyncSpace.git
cd Project-SyncSpace
```

### 2. Backend

```bash
cd backend/server
npm install
```

Create `backend/server/.env`:

```env
PORT=8787
MONGO_URI=mongodb://localhost:27017/syncspace
JWT_SECRET=change_me
JDOODLE_CLIENT_ID=
JDOODLE_CLIENT_SECRET=
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:8787
GOOGLE_CLIENT_ID=
```

Run it:

```bash
npm run dev     # development (nodemon)
npm start       # production
```

### 3. Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:8787
VITE_AUTH_API_URL=http://localhost:8787
VITE_SOCKET_URL=http://localhost:8787
VITE_GOOGLE_CLIENT_ID=
```

Run it:

```bash
npm run dev     # http://localhost:5173
npm run build   # production build
npm run lint
```

> Never commit `.env` files – they are git-ignored.

## Scripts

| Location | Command | Description |
|----------|---------|-------------|
| backend/server | `npm run dev` | Start API with nodemon |
| backend/server | `npm run migrate:workspace-indexes` | Fix legacy workspace indexes |
| frontend | `npm run dev` | Start Vite dev server |
| frontend | `npm run build` | Build for production |
| frontend | `npm run preview` | Preview production build |

## Author

**Mohamad Riyas** – [GitHub](https://github.com/Mohamad-Riyas)

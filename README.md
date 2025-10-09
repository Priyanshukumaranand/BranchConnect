# CE Bootcamp Monorepo

A refreshed codebase for the CE Bootcamp portal. The project is now split into a React SPA front-end and an Express/MongoDB back-end. Both applications live side by side in this repository so you can develop, test, and deploy them independently.

## Project layout

```text
.
├── Frontend/    # React 18 single-page application
├── backend/     # Express API (migrated from the legacy EJS app)
└── .gitignore   # Shared ignore rules for both apps
```

### Prerequisites

- Node.js 18 or newer (the backend enforces this via `engines.node`)
- npm 9+ (ships with Node 18)
- A running MongoDB instance for the API (local or hosted)

## Documentation

- [`docs/realtime-chat.md`](docs/realtime-chat.md): End-to-end guide for the Redis-backed Socket.IO chat rollout, including env setup, verification steps, and deployment checklist.

## Quick start

### 1. Install dependencies

```bash
cd Frontend && npm install
cd ../backend && npm install
```

### 2. Configure environment variables

| App      | File to copy | Notes |
|----------|--------------|-------|
| Backend  | `backend/.env.example` → `backend/.env` | Update `MONGO_URI`, session secrets, mail credentials, and optional Google OAuth keys. |
| Frontend | (optional) create `Frontend/.env` | Set `REACT_APP_API_BASE_URL` if the API is not running on `http://localhost:8080`. |

> The backend will refuse to boot if `MONGO_URI`, `SESSION_SECRET`, or `JWT_SECRET` are missing.

### 3. Run the apps

In separate terminals:

```bash
# Frontend: CRA dev server (http://localhost:3000 by default)
cd Frontend
npm start
```

```bash
# Backend: Nodemon-powered development server
cd backend
npm run dev
```

The React app expects the API at `http://localhost:8080`. Adjust the `REACT_APP_API_BASE_URL` if you proxy through a different origin.

## Authentication & protected routes

- The backend issues HTTP-only JWT cookies on sign-in and supports Google OAuth just like the legacy EJS app.
- The React app keeps the session in sync via a global `AuthProvider`. Refreshing the browser will automatically refresh the current user state.
- `/batches` and `/profile` are protected routes; users are redirected to `auth/sign-in` if they are not authenticated.
- Once signed in, the navbar reveals quick links to **Batches**, **Edit Profile**, and a sign-out button. Profile updates (bio, socials, avatar) are available from the new `/profile` page.

## Available scripts

### Frontend

- `npm start`: Launches the CRA development server on port 3000.
- `npm run build`: Produces an optimized production bundle in `Frontend/build`.
- `npm test`: Runs the default Jest test suite.

### Backend

- `npm run dev`: Starts the API with `nodemon` (hot reloads on file changes).
- `npm start`: Runs the API with Node once compiled (no hot reload).

## Deployment notes

- Build the React application with `npm run build` and deploy the `Frontend/build` folder to your static host.
- Deploy the backend to your Node host (Docker, PM2, etc.) after supplying the production `.env` file. Make sure your MongoDB instance and mail/OAuth providers are reachable from the host environment.
- When deploying behind HTTPS, remember to update `FRONTEND_URL` and OAuth callback URLs inside the backend `.env` file.

## Troubleshooting

- **`MONGO_URI` errors at startup**: Confirm MongoDB is running and accessible from the backend container/host. The default points to `mongodb://127.0.0.1:27017/ce-bootcamp`.
- **CORS or cookie issues**: Ensure `FRONTEND_URL` in the backend `.env` matches the origin you use in the browser, including the correct port and protocol.
- **Outdated assets**: Delete `Frontend/build` before rebuilding if you see stale files being served by your static host.

## Next steps

- Configure CI to run `npm run build` (Frontend) and `npm test` or smoke checks for the backend on pull requests.
- Add a root-level task runner (e.g. `npm-run-all` or `turbo`) if you want single commands to orchestrate both apps. For now, each app is managed independently.

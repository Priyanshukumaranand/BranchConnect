# Branch Connect Backend

Express + MongoDB API that powers the CE Bootcamp frontend. The codebase mirrors the legacy EJS application while exposing REST endpoints that the React SPA can consume.

## Prerequisites

- Node.js 18+
- npm 9+
- MongoDB instance (local Docker container, Atlas cluster, etc.)

## Setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` with your secrets before running the server.

### Required environment values

| Key | Description |
|-----|-------------|
| `PORT` | Port the server listens on (defaults to 8080). |
| `MONGO_URI` | Connection string for your MongoDB database. **Required**. |
| `SESSION_SECRET` | Session signing secret for Express sessions. |
| `JWT_SECRET` | Secret used when issuing JWT reset tokens. |
| `FRONTEND_URL` | Allowed origin for cookies and CORS (e.g., `http://localhost:3000`). |
| `MAIL_HOST`, `MAIL_USER`, `MAIL_PASS` | SMTP settings for OTP and password-reset emails. |
| `CLIENT_ID`, `CLIENT_SECRET`, `CALLBACK_URL` | Google OAuth credentials (optional). |
| `REDIS_URL` **or** (`REDIS_HOST`, `REDIS_PORT`, `REDIS_USERNAME`, `REDIS_PASSWORD`, `REDIS_TLS`) | Redis connection used for realtime messaging and caching. Leave unset to disable Redis in local development. |

### Development server

```bash
npm run dev
```

Starts Nodemon with live reload. The server will not start until `MONGO_URI`, `SESSION_SECRET`, and `JWT_SECRET` are defined.

### Production server

```bash
npm start
```

Runs the build with plain Node.js. Recommended for deployment behind a process manager such as PM2 or Docker.

## Project structure

```text
backend/
├── src/
│   ├── app.js           # Express app setup, middleware, routes
│   ├── index.js         # Entry point (bootstraps DB + server)
│   ├── config/          # Database, session, passport configuration
│   ├── controllers/     # Route handlers (auth, users, chat, resources, etc.)
│   ├── middleware/      # Auth helpers, error handler, etc.
│   ├── models/          # Mongoose schemas (User, OTP, Conversation, Message)
│   ├── routes/          # Express routers mirroring legacy endpoints
│   └── utils/           # Mailer, JWT helpers, templated emails
└── .env.example         # Template for environment variables
```

## Competitive programming leaderboard

The `GET /resources/dsa-leaderboard` endpoint now assembles two live leaderboards sourced from member profiles:

- **Codeforces** — Calls the public `user.info` API in batches to retrieve the latest rating and title for every stored handle.
- **LeetCode** — Uses the public GraphQL endpoint to fetch contest ratings, contest count, and total problems solved per username.

Only users who add their Codeforces/LeetCode links in the Branch Connect profile page are considered. Results are cached in-memory for ten minutes to avoid hammering the upstream services; expect the first request after the cache expires to take a little longer while the data refreshes.

If either upstream service is unreachable, that provider's leaderboard gracefully falls back to an empty list while leaving the other provider untouched.

## Troubleshooting

- **`MONGO_URI is not defined`**: Copy `.env.example` to `.env` and fill in the values before starting the server.
- **Mongo connection failures**: Verify the database is reachable from the container/host and the connection string includes the correct credentials.
- **OAuth errors**: Leave the Google OAuth fields blank for local development; the server skips Google strategy registration when the values are missing.

## Chat API quick reference

All chat endpoints require authentication and live under the `/chat` prefix:

| Method & Path | Description |
|---------------|-------------|
| `GET /chat/conversations` | Lists every conversation the signed-in user participates in with unread counts and latest message metadata. |
| `GET /chat/with/:userId` | Fetches (and auto-creates if missing) the direct conversation with the specified user. Supports `before` + `limit` for backwards pagination. |
| `POST /chat/with/:userId/messages` | Sends a new message to the user. Automatically updates unread counts and last message details. |
| `GET /chat/conversations/:conversationId/messages` | Fetches paginated messages for a specific conversation. |
| `POST /chat/conversations/:conversationId/read` | Marks all unread messages in the conversation as read for the current user. |

Responses include denormalised participant details (name, email, avatar metadata) so the frontend can render chat threads without additional lookups.

## Running the backend locally with Docker Compose

These steps will start the backend together with a local MongoDB and Redis container using the provided `docker-compose.yml` at the repository root.

1. Copy the example env and edit secrets:

```powershell
cd C:\Users\priya\Downloads\BranchBase
Copy-Item .\backend\.env.example .\backend\.env -Force
notepad .\backend\.env
```

2. Start the stack (build and run detached):

```powershell
docker compose up --build -d
```

3. Check running services and health:

```powershell
docker compose ps
docker compose logs -f backend
```

4. Verify the app is healthy (health endpoint):

```powershell
Invoke-WebRequest -Uri http://localhost:8080/socket/ping -UseBasicParsing | Select-Object -ExpandProperty Content | ConvertFrom-Json
```

5. Stop and remove containers and volumes when finished:

```powershell
docker compose down -v
```

Notes
- The repo `docker-compose.yml` includes healthchecks for `backend`, `mongo`, and `redis` to ensure readiness before downstream services connect.
- If you run into connection errors, check `docker compose logs backend` and ensure `backend/.env` contains the correct `MONGO_URI` and Redis configuration (the example uses the compose service names `mongo` and `redis`).

## Deployment & CI/CD

This project is intended to be deployed as a containerized service. Below are three common deployment workflows with diagrams showing how each flow works.

### 1) Local developer flow (Docker Compose)

```mermaid
flowchart LR
	A[Developer laptop] -->|docker compose up| B[Backend container]
	B --> C[MongoDB (local)]
	B --> D[Redis (local)]
	B --> E[Browser / Frontend]
```

When developing locally you typically run `docker compose up --build` which starts `backend`, `mongo` and `redis`. Edit `backend/.env` to point the service at the compose service hostnames (e.g., `MONGO_URI=mongodb://mongo:27017/branchbase`).

### 2) Production flow (ACR -> App Service)

```mermaid
flowchart LR
	A[GitHub / Local build] -->|docker build| B[Developer Machine]
	B -->|docker push| C[Azure Container Registry (ACR)]
	C -->|Pull image| D[Azure App Service (Web App for Containers)]
	D --> E[Managed Identity / ACR AcrPull]
	D --> F[Azure Monitor / Autoscale]
	D --> G[Users / Frontend]
```

Typical steps:
- Build the Docker image locally or with `az acr build`.
- Push to ACR (or use server-side ACR build).
- Create an App Service that pulls the image from ACR. Grant the Web App `AcrPull` permissions using a system-assigned managed identity or use ACR admin credentials for initial setup.
- Configure app settings (secrets, `WEBSITES_PORT=8080`, enable WebSockets) and set a health-check path (`/socket/ping`).
- Use Azure Monitor autoscale rules targeting the App Service plan to scale 1–3 instances on CPU.

### 3) CI-backed image publishing (GHCR) and manual App Service deploy

```mermaid
flowchart LR
	repo[GitHub repo] -->|push branch| actions[GitHub Actions]
	actions -->|build & push| ghcr[GHCR (ghcr.io)]
	ghcr -->|pull| app[Azure App Service]
	app --> users[Users / Frontend]
```

Use the provided GitHub Actions workflow (in the repository) to publish images to GHCR. If GHCR is private, configure Web App container registry credentials (either set as app settings or use a Personal Access Token); otherwise make the package public so the Web App can pull without credentials.

## How to update environment variables on Azure

You can either use the Azure CLI or the Portal. Example CLI to set multiple settings in one call:

```powershell
az webapp config appsettings set \
	--resource-group rg-branchbase-sea \
	--name branchbase-backend \
	--settings MONGO_URI="<value>" REDIS_HOST="<value>" SESSION_SECRET="<value>" JWT_SECRET="<value>"
```

Or manually: Portal -> App Services -> `branchbase-backend` -> Configuration -> Application settings -> + New application setting -> Save (this will restart the app).

## Verification & health checks

- Health endpoint: `GET /socket/ping` (returns a small JSON payload). Configure App Service health-check path to this endpoint so Azure can perform liveness checks.
- Logs: Use `az webapp log tail --resource-group rg-branchbase-sea --name branchbase-backend` or the Portal's Log stream.

## Notes

- Prefer managed identity for ACR pulls in production (role: AcrPull). When switching, disable ACR admin user for better security.
- Store secrets in Key Vault and reference them from App Service later if you need rotation or central management.



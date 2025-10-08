# CE Bootcamp Backend

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

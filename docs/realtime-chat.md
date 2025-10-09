# Realtime chat rollout

This note summarises the Socket.IO integration across the BranchBase stack and how to operate it in each environment.

## Backend

- **Dependencies:** `socket.io`, `@socket.io/redis-adapter`, and `ioredis` are installed in `backend/package.json`.
- **Entry point:** `src/index.js` boots the HTTP server, initialises Redis, and mounts the socket server. Shutdown now drains both the socket adapter and the Redis connection gracefully.
- **Redis configuration:**
  - Provide either a single `REDIS_URL` or the host/port credential pair (`REDIS_HOST`, `REDIS_PORT`, `REDIS_USERNAME`, `REDIS_PASSWORD`, `REDIS_TLS`).
  - `/health` returns the Redis status, and `/socket/ping` reports whether the Socket.IO layer is live.
- **Chat controller hooks:** `sendMessageToUser` and `markConversationRead` broadcast `message:new` and `conversation:update` events so clients receive new messages and unread-count changes instantly.

## Frontend

- **Socket client:** `src/api/socket.js` centralises the Socket.IO client with token refresh, reconnection handling, and a tiny publish/subscribe helper.
- **Auth integration:** `AuthContext` now refreshes socket credentials after sign-in/sign-out and disconnects the socket on logout.
- **Chat thread:** `ChatThread.jsx` connects to the socket when a conversation opens, merges live messages into the React Query cache, and displays a realtime-status indicator. When the socket is offline, the query falls back to an 8-second polling interval.
- **UI:** `ChatThread.css` styles a small badge that shows `Live updates enabled`, `Reconnecting…`, or fallback status so users know whether realtime is active.

## Local verification

1. **Backend:**
   - Add your Redis credentials to `backend/.env` and start the API: `npm start`.
   - Hit `http://localhost:8080/health` to confirm `{ services: { redis: { status: "ready" } } }`.
2. **Frontend:**
   - Run `npm start` inside `Frontend/`.
   - Open two browser windows on the same conversation. Sending a message in one tab should appear in the other immediately with the "Live updates enabled" indicator.
3. **Fallback:**
   - Stop the backend socket process (or block the port) and observe the indicator flip to the fallback text. Messages will still arrive, but with the slower polling cadence.

## Deployment checklist

- Ensure the Redis URL/password is stored in your production secret manager.
- Expose port `8080` (or your chosen API port) for both HTTP and WebSocket traffic.
- If you run multiple API replicas, keep the Redis adapter enabled so socket events broadcast across instances.
- Monitor the `/health` output in your observability stack to alert on Redis or socket errors.

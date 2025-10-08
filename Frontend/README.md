# CE Bootcamp Frontend

This package contains the React single-page application for the CE Bootcamp portal. It was bootstrapped with Create React App and talks to the Express API in `../backend`.

## Prerequisites

- Node.js 18+
- npm 9+
- Backend API running locally at `http://localhost:8080` (or provide `REACT_APP_API_BASE_URL`)

## Setup

```bash
cd Frontend
npm install
```

### Environment variables

Create a `.env` file if you need to override defaults:

```
REACT_APP_API_BASE_URL=http://localhost:8080
```

If this value is omitted, the app will fall back to `http://localhost:8080`.

## Development

```bash
npm start
```

This launches the CRA dev server at <http://localhost:3000>. API requests are sent to the URL defined by `REACT_APP_API_BASE_URL`.

## Production build

```bash
npm run build
```

Outputs an optimized bundle in `Frontend/build`. Deploy those static files to your hosting provider.

### Member chat

- From the Batches directory, choose **Message** on any profile card to open their member page at `/members/:userId`.
- Member pages surface their public details plus a React Query–powered chat panel that polls the backend every 5 seconds (and refetches on focus) for new messages.
- Messages are persisted through the `/chat` API; conversations are created automatically and unread counts reset as soon as you view the thread.

### Batch directory performance

- The batches page now streams profiles with lazy loading and caching via React Query. Profiles load in small chunks (12 at a time) and additional entries are fetched on demand when you scroll or tap **Load more**.
- React Query is configured globally in `src/index.js`; if you add new data hooks, reuse the shared client to benefit from caching and request deduplication.

## Testing

```bash
npm test
```

Runs the default Jest test runner that ships with Create React App.

## Useful links

- [Backend quickstart](../backend/README.md) – configure and run the Express API
- [Root project README](../README.md) – full monorepo overview
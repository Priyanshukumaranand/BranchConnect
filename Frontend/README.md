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

## Testing

```bash
npm test
```

Runs the default Jest test runner that ships with Create React App.

## Useful links

- [Backend quickstart](../backend/README.md) – configure and run the Express API
- [Root project README](../README.md) – full monorepo overview
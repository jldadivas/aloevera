# Vera Frontend

Minimal React + Vite frontend for the Vera backend.

Quick start:

1. cd frontend
2. npm install
3. npm run dev

Environment:
- You can set `VITE_API_BASE` to the backend base URL (default: `http://localhost:8000/api/v1`).

Notes:
- Auth token is stored in `localStorage.token` after login.
- Uploads use the `image` multipart field to `/scans`.

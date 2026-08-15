# Fairshare — Trip Splitter (frontend)

A React app for splitting trip expenses with friends: create a trip, add people, log expenses (equal / exact / percentage splits), and see a simplified settle-up plan.

Talks to the Split Smart API over HTTP — set `VITE_API_URL` to point at it.

## Stack
- React 19 + Vite
- react-router-dom
- Plain CSS (design tokens in `src/styles/global.css`), no UI framework

## Local development

```bash
npm install
cp .env.example .env      # set VITE_API_URL to your backend, e.g. http://localhost:5000
npm run dev                # http://localhost:5173
```

Make sure your backend has `FRONTEND_URL=http://localhost:5173` in its `.env` so CORS allows the request (or leave it unset locally — the backend defaults to allowing any origin).

## Deploying to Vercel

1. Push this folder to a GitHub repo (or a `frontend/` subfolder of your existing repo).
2. In Vercel: New Project -> import the repo. Framework preset auto-detects Vite.
3. Add an environment variable: `VITE_API_URL` = your deployed backend URL (e.g. `https://split-smart-backend.onrender.com`).
4. Deploy. Vercel builds with `npm run build` and serves the `dist/` folder automatically.
5. Back on your backend host (Render/Railway), set `FRONTEND_URL` to your new Vercel URL (e.g. `https://fairshare.vercel.app`) so CORS allows it, then redeploy the backend.

## How it maps to the API

The UI calls it "trips" everywhere, but under the hood a trip is just a `Group` in the API — no backend changes were needed for the rename.

| UI action                  | API call                                     |
|-----------------------------|------------------------------------------------|
| Sign up / log in            | `POST /api/auth/register` / `/login`           |
| Create a trip                | `POST /api/groups`                             |
| View your trips              | `GET /api/groups`                              |
| Add a member by email        | `POST /api/groups/:id/members`                 |
| Log an expense                | `POST /api/expenses`                           |
| View expenses                  | `GET /api/expenses/group/:groupId`             |
| View balances & settle-up       | `GET /api/expenses/group/:groupId/balances`    |

## Notes

- Auth token is stored in `localStorage` (`fairshare_token` / `fairshare_user`) — fine for this app since there's no sensitive session cookie to protect, but if you productionize further, consider httpOnly cookies instead.
- Adding a member requires that person to already have a Fairshare account (this matches how the backend's `addMember` looks users up by email). If you want to invite people who haven't signed up yet, that'd need a small backend addition (pending invites) — happy to build that next if useful.

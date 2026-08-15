# Split Smart / Fairshare

A trip-expense-splitting app: create a trip, add people, log expenses (equal / exact / percentage splits), and see a simplified settle-up plan showing who owes whom.

This repo is a monorepo containing both halves of the project:

## Stack

**Backend:** Node.js, Express 5, MongoDB (Mongoose), JWT auth, bcrypt
**Frontend:** React 19, Vite, react-router-dom, plain CSS (no UI framework)

## Local development

**Backend** (from the repo root):
\`\`\`bash
npm install
cp .env.example .env    # fill in MONGO_URI, JWT_SECRET, etc.
npm run dev              # http://localhost:5000
\`\`\`

**Frontend** (from `fairshare_frontend/`):
\`\`\`bash
cd fairshare_frontend
npm install
cp .env.example .env    # set VITE_API_URL to http://localhost:5000
npm run dev              # http://localhost:5173
\`\`\`

## Deployment

- **Backend** → Render (Web Service, root directory blank, build `npm install`, start `npm start`)
- **Database** → MongoDB Atlas (free M0 cluster)
- **Frontend** → Vercel (root directory set to `fairshare_frontend`)

Environment variables needed:

| Where | Variable | Example |
|---|---|---|
| Render | `MONGO_URI` | `mongodb+srv://user:pass@cluster.mongodb.net/split_smart` |
| Render | `JWT_SECRET` | any long random string |
| Render | `JWT_EXPIRES_IN` | `7d` |
| Render | `NODE_ENV` | `production` |
| Render | `FRONTEND_URL` | your live Vercel URL, for CORS |
| Vercel | `VITE_API_URL` | your live Render URL |

## API overview

| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/register` | Create an account |
| POST | `/api/auth/login` | Log in, get a JWT |
| GET | `/api/auth/me` | Current user profile |
| POST | `/api/groups` | Create a trip |
| GET | `/api/groups` | List your trips |
| GET | `/api/groups/:id` | Get one trip |
| POST | `/api/groups/:id/members` | Add a member by email |
| POST | `/api/expenses` | Add an expense (equal/exact/percentage split) |
| GET | `/api/expenses/group/:groupId` | List a trip's expenses |
| GET | `/api/expenses/group/:groupId/balances` | Net balances + settle-up plan |
| DELETE | `/api/expenses/:id` | Delete an expense |



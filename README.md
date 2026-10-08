# TaskFlow – Employee Task Management Dashboard

An internal admin dashboard for managing employees and the tasks assigned to them.
Built with the **MERN** stack: **M**ongoDB · **E**xpress · **R**eact (Vite) · **N**ode.js.

![Dashboard](docs/screenshots/02-dashboard.png)

<p><img src="docs/screenshots/01-login.png" width="49%" alt="Login"> <img src="docs/screenshots/04-tasks.png" width="49%" alt="Tasks"></p>

## Features

| Area | What the admin can do |
| --- | --- |
| **Auth** | Log in with email + password (JWT, bcrypt-hashed passwords, rate-limited login). Session survives refresh; expired tokens redirect to login. |
| **Employees** | Add, edit, delete, list, search. Deleting an employee also removes their tasks (with a warning). |
| **Tasks** | Create, edit, delete. Fields: title, description, assigned employee, priority, due date, status. |
| **Status** | Change status inline from the table (Pending / In Progress / Completed) — optimistic update. |
| **Filtering** | Status tabs, filter by employee, filter by priority. Filters live in the URL, so they are shareable and the dashboard cards link straight to filtered views. |
| **Dashboard** | Totals (employees, tasks, per-status, overdue), progress bar, priority breakdown, busiest employees, upcoming deadlines. |
| **UX** | Collapsible sidebar with live count badges, breadcrumb top bar and account menu; responsive (drawer on tablets and phones, tables become cards on phones), toasts, confirm dialogs, loading/empty states. |

## Tech stack

- **Frontend:** React 18, React Router 6, Axios, Vite, hand-written CSS (no UI framework), self-hosted Bricolage Grotesque + Instrument Sans fonts
- **Backend:** Node.js, Express 4, Mongoose 8, JWT, bcryptjs, helmet, cors, express-rate-limit, morgan
- **Database:** MongoDB
- **Tests:** `node:test` API integration tests

## Project structure

```
employee-task-dashboard/
├── server/
│   ├── src/
│   │   ├── config/db.js             # Mongo connection
│   │   ├── models/                  # Admin, Employee, Task (Mongoose schemas + validation)
│   │   ├── controllers/             # auth, employee, task, stats – request handling
│   │   ├── routes/index.js          # all API routes; auth middleware guards everything but login
│   │   ├── middleware/              # auth (JWT), error handling
│   │   ├── utils/                   # asyncHandler, HttpError
│   │   ├── app.js                   # Express app (testable, no listen)
│   │   ├── index.js                 # entry point: connect DB + listen
│   │   └── seed.js                  # creates admin (+ demo data with --demo)
│   ├── test/api.test.js
│   └── .env.example
├── client/
│   └── src/
│       ├── api/client.js            # axios instance, token handling, API functions
│       ├── context/AuthContext.jsx
│       ├── components/              # Layout, Modal, ConfirmDialog, Toast, Badges
│       ├── pages/                   # Login, Dashboard, Employees, Tasks
│       ├── utils/format.js
│       └── styles.css
└── docs/screenshots/
```

## Getting started

**Prerequisites:** Node.js 18+ and a running MongoDB (local install, Docker, or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster).

```bash
# 1. install dependencies
npm run install:all

# 2. configure the server
cp server/.env.example server/.env        # then edit MONGODB_URI / JWT_SECRET if needed

# 3. create the admin account (+ sample employees and tasks)
npm run seed

# 4. run both apps (two terminals)
npm run dev:server     # API  -> http://localhost:5000
npm run dev:client     # App  -> http://localhost:5173
```

Open http://localhost:5173 and sign in with:

```
Email:    admin@example.com
Password: Admin@123
```
(Change these via `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `server/.env` before seeding.)

Quick MongoDB with Docker: `docker run -d -p 27017:27017 --name mongo mongo:7`

In development Vite proxies `/api` to the Express server, so there is no CORS setup to do.

## API reference

All routes are prefixed with `/api`. Everything except `/auth/login` and `/health` needs `Authorization: Bearer <token>`.

| Method | Route | Description |
| --- | --- | --- |
| POST | `/auth/login` | `{ email, password }` → `{ token, admin }` |
| GET | `/auth/me` | Current admin |
| GET | `/stats` | Dashboard summary |
| GET | `/employees?search=` | List employees (with `taskCount`) |
| POST | `/employees` | Create `{ name, email, phone?, department?, position? }` |
| GET / PUT / DELETE | `/employees/:id` | Read / update / delete (cascades to their tasks) |
| GET | `/tasks?status=&employee=&priority=&search=` | List / filter tasks |
| POST | `/tasks` | Create `{ title, description?, assignedTo, priority?, dueDate, status? }` |
| GET / PUT / DELETE | `/tasks/:id` | Read / update / delete |
| PATCH | `/tasks/:id/status` | `{ status: "pending" \| "in-progress" \| "completed" }` |

Errors return `{ message }` with a suitable status (400 validation, 401 auth, 404, 409 duplicate email).

## Tests

```bash
npm test
```
Spins up an in-memory MongoDB and exercises auth, employee/task CRUD, validation, filtering, status change, stats and cascade delete. If your network blocks the MongoDB binary download, point the tests at any running MongoDB instead:
`TEST_MONGODB_URI=mongodb://127.0.0.1:27017/test_run npm test` (the database is dropped afterwards).

## Design decisions

- **Single admin role, seeded via script.** The brief only asks for an admin login, so there is no public registration endpoint, which would be a security hole in an internal tool.
- **JWT in an `Authorization` header** keeps the API stateless and simple to host separately from the frontend.
- **Controllers + thin routes + central error handler**: validation lives in the Mongoose schemas, and one error middleware maps Mongoose/duplicate-key errors to clean HTTP responses.
- **Cascade delete** avoids orphaned tasks pointing to removed employees; the UI warns beforehand.
- **Filters in the URL query string** make views linkable and survive refresh.
- **No UI library:** a small hand-written stylesheet keeps the bundle light (small gzipped JS bundle).

## Deployment on Vercel (live demo)

You deploy **two Vercel projects** from the same GitHub repo (one for the API, one for the frontend) plus a free MongoDB Atlas database.

**1. Database (MongoDB Atlas)**
Create a free cluster, add a database user, and under *Network Access* allow `0.0.0.0/0` (Vercel's IPs change). Copy the connection string, e.g. `mongodb+srv://user:pass@cluster.mongodb.net/task_dashboard`.

**2. Create the admin user (run once from your computer)**
```bash
cd server
MONGODB_URI="<atlas connection string>" npm run seed -- --demo
```

**3. API project**
Vercel → *Add New → Project* → import the repo → **Root Directory: `server`** → Framework: *Other*. Environment variables:

| Name | Value |
| --- | --- |
| `MONGODB_URI` | your Atlas connection string |
| `JWT_SECRET` | a long random string |
| `CLIENT_ORIGIN` | the frontend URL (add after step 4, then redeploy) |

Deploy, then open `https://<api-project>.vercel.app/api/health`. It should return `{"status":"ok"}`.

**4. Frontend project**
Vercel → *Add New → Project* → same repo → **Root Directory: `client`** → Framework: *Vite* (build `npm run build`, output `dist`). Environment variables:

| Name | Value |
| --- | --- |
| `VITE_API_URL` | `https://<api-project>.vercel.app` (no trailing slash) |
| `VITE_DEMO_LOGIN` | `true` (optional, shows the "Fill demo login" button) |

Deploy. Then go back to the API project, set `CLIENT_ORIGIN` to the frontend URL, and redeploy it.

`client/vercel.json` makes page refreshes on `/tasks` or `/employees` work, and `server/vercel.json` plus `server/api/index.js` run the Express app as a serverless function.

## Demo login button

The login page shows a "Fill demo login" shortcut in development. For a deployed demo, set `VITE_DEMO_LOGIN=true` in the frontend's environment to keep it; leave it unset to hide it.

## Possible next steps

Pagination, task comments, role-based access (admin vs. employee login), email notifications, drag-and-drop kanban board.

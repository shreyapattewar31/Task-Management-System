# Task Management System

A full-stack task management application with role-based access, admin controls, email notifications, and a modern responsive UI.

**Live demo:** [task-management-system-roan-one.vercel.app](https://task-management-system-roan-one.vercel.app)

---

## Features

### Authentication & Users
- Sign up / Log in with JWT-based authentication (1-day token)
- Passwords hashed with bcrypt (10 rounds)
- Forgot password flow — reset link sent via email, valid 1 hour
- User profile page — edit name, change password
- Two roles: **User** and **Admin**
- Inactive accounts are blocked from login

### User Dashboard
- Create, view, edit, and delete your own tasks
- Task fields: title, description, status, priority, due date
- Search tasks by title
- Filter by status (Pending / In Progress / Done / On Hold) and priority (Low / Medium / High)
- Sort by created date, due date, priority, or title
- Pagination (6 tasks per page)
- Overdue task badges
- Tasks assigned by an admin are visible with assignee name

### Admin Dashboard
- Tabbed layout: Overview · Assign Task · All Tasks · Users
- **Overview** — stat cards for users, total/completed/pending/in-progress tasks
- **Assign Task** — assign tasks to users with priority, due date, and email notification
- **All Tasks** — search, filter, sort, paginate all tasks; edit or delete any task
- **Users** — search, paginate users; edit role (User ↔ Admin), activate/deactivate, delete user + their tasks
- Email notifications on task assignment using SMTP (Gmail App Password)
- Own profile page (same as users)

### UX & Accessibility
- Fully responsive — works on mobile, tablet, and desktop
- Sticky topbar with avatar/profile button
- Modal dialogs for create/edit operations
- Password show/hide toggle
- Debounced search inputs
- Loading, empty, and error states throughout
- Semantic HTML with ARIA labels

---

## Tech Stack

| Layer      | Technology                                  |
|------------|---------------------------------------------|
| Frontend   | React 19, Vite, lucide-react                |
| Backend    | Node.js, Express 5                          |
| Database   | MongoDB Atlas via Mongoose                  |
| Auth       | JSON Web Tokens (jsonwebtoken), bcryptjs    |
| Email      | Nodemailer (Gmail SMTP)                     |
| Deploy     | Vercel (frontend), Render (backend)         |

---

## Project Structure

```
task_management/
├── backend/
│   ├── middleware/
│   │   ├── auth.js          # JWT protect middleware
│   │   └── admin.js         # requireAdmin middleware
│   ├── models/
│   │   ├── Task.js          # Mongoose Task schema
│   │   └── Users.js         # Mongoose User schema (with reset token fields)
│   ├── routes/
│   │   ├── authRoutes.js    # signup, login, forgot/reset password, profile
│   │   └── adminroutes.js   # admin user + task management
│   ├── utils/
│   │   └── sendEmail.js     # task-assigned + password-reset emails
│   ├── server.js            # Express app, user task CRUD routes
│   ├── package.json
│   └── .env                 # Local environment variables (not committed)
└── frontend/
    ├── src/
    │   ├── components/
    │   │   └── PasswordInput.jsx
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Signup.jsx
    │   │   ├── ForgotPassword.jsx
    │   │   ├── ResetPassword.jsx
    │   │   └── UserProfile.jsx
    │   ├── AdminDashboard.jsx
    │   ├── AdminDashboard.css
    │   ├── App.jsx
    │   ├── App.css
    │   ├── index.css
    │   └── main.jsx
    ├── index.html
    ├── vite.config.js
    └── package.json
```

---

## Prerequisites

- Node.js ≥ 18 and npm
- MongoDB Atlas connection string (or local MongoDB)
- A Gmail account with an [App Password](https://myaccount.google.com/apppasswords) for SMTP

---

## Setup and Run Locally

### 1. Clone the repository

```bash
git clone https://github.com/shreyapattewar31/Task-Management-System
cd Task-Management-System
```

### 2. Configure and start the backend

```bash
cd backend
npm install
```

Create a `.env` file inside `backend/`:

```env
PORT=5000
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_very_long_random_secret
SMTP_EMAIL=your_gmail@gmail.com
SMTP_APP_PASSWORD=your_gmail_app_password
FRONTEND_URL=http://localhost:5173
```

Start the backend:

```bash
npm run dev
```

API runs at `http://localhost:5000`.

### 3. Configure and start the frontend

```bash
cd ../frontend
npm install
npm run dev
```

Open the URL shown by Vite — usually `http://localhost:5173`.

### 4. Create the first Admin

Sign up normally, then update the role directly in MongoDB Atlas:

```js
db.users.updateOne({ email: "admin@example.com" }, { $set: { role: "Admin" } })
```

---

## REST API Endpoints

Base URL: `http://localhost:5000`

### Auth (`/api/auth`)

| Method | Endpoint                         | Description                       | Auth |
|--------|----------------------------------|-----------------------------------|------|
| POST   | `/auth/signup`                   | Register a new user               | —    |
| POST   | `/auth/login`                    | Login, receive JWT                | —    |
| POST   | `/auth/forgot-password`          | Send password reset email         | —    |
| POST   | `/auth/reset-password/:token`    | Reset password with token         | —    |
| GET    | `/auth/profile`                  | Get own profile                   | JWT  |
| PUT    | `/auth/profile`                  | Update name                       | JWT  |
| PUT    | `/auth/change-password`          | Change own password               | JWT  |

### User Tasks (`/api/tasks`) — JWT required

| Method | Endpoint          | Description                                 |
|--------|-------------------|---------------------------------------------|
| GET    | `/tasks`          | List own tasks (search/filter/sort/paginate)|
| POST   | `/tasks`          | Create a task                               |
| PUT    | `/tasks/:id`      | Update own task                             |
| DELETE | `/tasks/:id`      | Delete own task                             |

**Query params for GET `/tasks`:**  
`search`, `status`, `priority`, `sortBy`, `sortOrder`, `page`, `limit`

### Admin (`/api/admin`) — JWT + Admin role required

| Method | Endpoint               | Description                                  |
|--------|------------------------|----------------------------------------------|
| GET    | `/admin/users`         | List users (search/paginate)                 |
| PATCH  | `/admin/users/:id`     | Edit user role or active status              |
| DELETE | `/admin/users/:id`     | Delete user + their tasks                    |
| GET    | `/admin/tasks`         | List all tasks (search/filter/sort/paginate) |
| POST   | `/admin/assign-task`   | Assign task to a user (sends email)          |
| PUT    | `/admin/tasks/:id`     | Edit any task                                |
| DELETE | `/admin/tasks/:id`     | Delete any task                              |

---

## Environment Variables Reference

| Variable           | Required | Description                                      |
|--------------------|----------|--------------------------------------------------|
| `PORT`             | No       | Server port (default: 5000)                      |
| `MONGO_URI`        | Yes      | MongoDB connection string                        |
| `JWT_SECRET`       | Yes      | Secret for signing JWTs (use a long random value)|
| `SMTP_EMAIL`       | Yes      | Gmail address for sending emails                 |
| `SMTP_APP_PASSWORD`| Yes      | Gmail App Password (not your account password)   |
| `FRONTEND_URL`     | Yes      | Frontend base URL for password reset links       |

---

## Notes

- Never commit `.env` files or credentials.
- The Gmail App Password is different from your Google account password — generate one at [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords).
- For production, set all environment variables in your Render dashboard.
- The `FRONTEND_URL` env var must point to your deployed Vercel URL in production.

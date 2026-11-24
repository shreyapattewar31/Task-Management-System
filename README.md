# Task Management System

A full-stack task management application with role-based access, admin controls, email notifications, WhatsApp notifications, Google Sign-In, profile pictures, dark mode, and a modern responsive UI.

**Live demo:** [task-management-system-roan-one.vercel.app](https://task-management-system-roan-one.vercel.app)

---

## Features

### Authentication & Users
- Sign up / Log in with JWT-based authentication (1-day token)
- **Google Sign-In** (OAuth 2.0 / Google Identity Services)
- Passwords hashed with bcrypt (10 rounds)
- Forgot password flow — reset link sent via email, valid 1 hour
- User profile page — edit name, change password, **upload/profile picture (file or URL)**
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
- **Collapsible sidebar** (icon-only or expanded)
- **Date/time widget** (bottom-right, live updating)
- **Profile picture** displayed in sidebar and topbar

### Admin Dashboard
- **Tabbed layout**: Overview · Assign Task · All Tasks · Users · Calendar · Activity · Reports
- **Overview** — stat cards + **Charts** (Pie: tasks by status, Bar: tasks by priority, Line: completion trend 7 days)
- **Assign Task** — assign tasks to users with priority, due date, and email notification
- **All Tasks** — search, filter, sort, paginate all tasks; **bulk actions** (select multiple → bulk delete, bulk status change)
- **Users** — search, paginate users; **bulk actions** (select multiple → bulk deactivate, bulk role change); edit role (User ↔ Admin), activate/deactivate, delete user + their tasks
- **Calendar View** — monthly grid with task due dates, color-coded by status
- **Activity Log** — timeline of user registrations, task creations, updates, completions
- **Reports** — user & admin reports with aggregations
- Email notifications on task assignment using SMTP (Gmail App Password)
- **WhatsApp notifications** (via Jalpi WhatsApp Business API) when task marked Done
- Own profile page (same as users)
- **Dark mode toggle** (persisted in localStorage)
- **Collapsible sidebar** with toggle button
- **Date/time widget** (bottom-right, live updating)

### WhatsApp Integration (Jalpi)
- Admin receives WhatsApp notification when any user marks a task as **Done**
- Template-based messaging via Jalpi WhatsApp Business API
- Requires: `JALPI_API_URL`, `JALPI_ACCESS_TOKEN`, `JALPI_TEMPLATE_NAME`, `ADMIN_WHATSAPP_NUMBER`
- Recipient must message the business number first to opt-in (WhatsApp policy)

### UX & Accessibility
- Fully responsive — works on mobile, tablet, and desktop
- Sticky topbar with avatar/profile button (mobile)
- Modal dialogs for create/edit operations
- Password show/hide toggle
- Debounced search inputs
- Loading, empty, and error states throughout
- Semantic HTML with ARIA labels
- **Dark mode** (system or manual toggle, persisted)
- **Profile picture** support (upload file or paste URL)

---

## Tech Stack

| Layer      | Technology                                  |
|------------|---------------------------------------------|
| Frontend   | React 19, Vite, vanilla CSS (CSS variables) |
| Backend    | Node.js, Express 5                          |
| Database   | MongoDB Atlas via Mongoose                  |
| Auth       | JSON Web Tokens (jsonwebtoken), bcryptjs    |
| Email      | Nodemailer (Gmail SMTP)                     |
| WhatsApp   | Jalpi WhatsApp Business API (REST)          |
| OAuth      | Google Identity Services (Google Sign-In)   |
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
│   │   └── Users.js         # Mongoose User schema (with reset token, avatarUrl fields)
│   ├── routes/
│   │   ├── authRoutes.js    # signup, login, forgot/reset password, profile, avatar
│   │   ├── adminroutes.js   # admin user + task management
│   │   └── googleAuthRoutes.js  # Google Sign-In endpoint
│   ├── utils/
│   │   ├── sendEmail.js     # task-assigned + password-reset emails
│   │   └── sendWhatsApp.js  # Jalpi WhatsApp notification
│   ├── server.js            # Express app, user task CRUD routes
│   ├── package.json
│   └── .env                 # Local environment variables (not committed)
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── PasswordInput.jsx
    │   │   └── GoogleSignIn.jsx
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
- **Google Cloud Console** project with OAuth 2.0 Client ID (Web application)
- **Jalpi** account for WhatsApp Business API (optional)

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
MONGO_URI=mongodb://localhost:27017/taskmanagement
# Or MongoDB Atlas: mongodb+srv://user:pass@cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
JWT_SECRET=your_very_long_random_secret
SMTP_EMAIL=your_gmail@gmail.com
SMTP_APP_PASSWORD=your_gmail_app_password
FRONTEND_URL=http://localhost:5173

# Google Sign-In
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com

# Jalpi WhatsApp (optional)
JALPI_API_URL=https://app.jalpi.com/api/v1/sendTemplateMessage
JALPI_ACCESS_TOKEN=your_jalpi_api_key
JALPI_TEMPLATE_NAME=task_completed_notify
ADMIN_WHATSAPP_NUMBER=91XXXXXXXXXX
JALPI_LANGUAGE_CODE=en_US
```

Start the backend:

```bash
npm run dev
```

API runs at `http://localhost:5000`. Swagger docs at `http://localhost:5000/api-docs`.

### 3. Configure and start the frontend

```bash
cd ../frontend
npm install
```

Create a `.env` file inside `frontend/`:

```env
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
```

Start the frontend:

```bash
npm run dev
```

Open the URL shown by Vite — usually `http://localhost:5173`.

### 4. Create the first Admin

Sign up normally, then update the role directly in MongoDB:

```js
db.users.updateOne({ email: "admin@example.com" }, { $set: { role: "Admin" } })
```

Or use MongoDB Atlas UI: find the user document and set `role: "Admin"`.

---

## REST API Endpoints

Base URL: `http://localhost:5000`

### Auth (`/api/auth`)

| Method | Endpoint                         | Description                       | Auth |
|--------|----------------------------------|-----------------------------------|------|
| POST   | `/auth/signup`                   | Register a new user               | —    |
| POST   | `/auth/login`                    | Login, receive JWT                | —    |
| POST   | `/auth/google`                   | Google Sign-In (send ID token)    | —    |
| POST   | `/auth/forgot-password`          | Send password reset email         | —    |
| POST   | `/auth/reset-password/:token`    | Reset password with token         | —    |
| GET    | `/auth/profile`                  | Get own profile                   | JWT  |
| PUT    | `/auth/profile`                  | Update name                       | JWT  |
| PUT    | `/auth/change-password`          | Change own password               | JWT  |
| POST   | `/auth/avatar`                   | Upload avatar (multipart/form-data)| JWT |
| PUT    | `/auth/avatar-url`               | Set avatar URL                    | JWT  |
| DELETE | `/auth/avatar`                   | Remove avatar                     | JWT  |

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
| `GOOGLE_CLIENT_ID` | Yes      | Google OAuth 2.0 Client ID (Web application)     |
| `JALPI_API_URL`    | No       | Jalpi WhatsApp API base URL                      |
| `JALPI_ACCESS_TOKEN`| No      | Jalpi API key (Bearer token)                     |
| `JALPI_TEMPLATE_NAME`| No     | Approved WhatsApp template name                  |
| `ADMIN_WHATSAPP_NUMBER`| No    | Admin's WhatsApp number (E.164, no +)            |
| `JALPI_LANGUAGE_CODE`| No     | Template language code (default: en_US)          |

**Frontend (`.env`):**

| Variable           | Required | Description                                      |
|--------------------|----------|--------------------------------------------------|
| `VITE_API_URL`     | Yes      | Backend API base URL (e.g., `http://localhost:5000/api`) |
| `VITE_GOOGLE_CLIENT_ID`| Yes   | Google OAuth 2.0 Client ID                       |

---

## Deployment

### Backend (Render)
1. Connect GitHub repo to Render
2. Web Service → Node.js
3. Build: `npm install`
4. Start: `npm start`
5. Add all backend environment variables in Render dashboard
6. Deploy → get URL (e.g., `https://your-backend.onrender.com`)

### Frontend (Vercel)
1. Connect GitHub repo to Vercel
2. Framework: Vite
3. Root directory: `frontend`
4. Add frontend environment variables:
   - `VITE_API_URL` = your Render backend URL + `/api`
   - `VITE_GOOGLE_CLIENT_ID` = your Google Client ID
5. Deploy

### Google OAuth Configuration
1. Google Cloud Console → APIs & Services → Credentials
2. Create OAuth 2.0 Client ID (Web application)
3. **Authorized JavaScript origins**: add your Vercel URL and `http://localhost:5173`
4. Copy Client ID to both `.env` files

### Jalpi WhatsApp Setup
1. Sign up at [jalpi.com](https://jalpi.com) or contact `hello@jalpi.com`
2. Get: API URL, Access Token, Phone Number ID
3. Create template `task_completed_notify` (Utility category)
4. Wait for Meta approval (status: **APPROVED**)
5. Add credentials to Render environment variables
6. Recipient must message your business number first (opt-in)

---

## Notes

- Never commit `.env` files or credentials.
- The Gmail App Password is different from your Google account password — generate one at [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords).
- For production, set all environment variables in your Render/Vercel dashboards.
- The `FRONTEND_URL` env var must point to your deployed Vercel URL in production.
- **Google Sign-In** requires the `GOOGLE_CLIENT_ID` on both backend and frontend.
- **WhatsApp notifications** require template approval by Meta before messages are delivered.

---

## License

MIT
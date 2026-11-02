# Task Management System

A simple full-stack Task Management application built as a CRUD practice assignment. Users can create, view, update, and delete tasks through a React interface backed by an Express REST API and MongoDB.

## Features

- Create a task with a required title
- Add an optional description
- Set task status: `Pending`, `In Progress`, or `Done`
- Creation date stored automatically by the backend
- View all tasks on the home page
- Edit task title, description, and status
- Delete tasks (with a confirmation prompt)
- Client-side validation preventing an empty title
- Basic API error handling so the UI does not crash on failed requests
- Loading and empty states in the UI

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React (functional components + hooks), Vite, CSS |
| Backend | Node.js, Express.js |
| Database | MongoDB with Mongoose |
| HTTP client | Fetch API |
| Backend config | dotenv |

## Project Structure

```
task_management/
├── backend/
│   ├── models/
│   │   └── Task.js          # Mongoose Task schema
│   ├── server.js            # Express app and REST routes
│   ├── package.json
│   └── .env                 # Local environment variables (not committed)
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Task form, list, edit and delete logic
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
└── README.md
```

## Prerequisites

- Node.js and npm
- MongoDB running locally **or** a MongoDB Atlas connection string

## Setup and Run

### 1. Clone the repository

```
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd task_management
```

Replace `<YOUR_GITHUB_REPOSITORY_URL>` with the actual repository URL.

### 2. Configure and start the backend

```
cd backend
npm install
```

Create a `.env` file inside the `backend` folder:

```
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/taskmanager
```

If you use MongoDB Atlas, replace `MONGO_URI` with your Atlas connection string.

Make sure MongoDB is running, then start the API:

```
npm run dev
```

The API runs at `http://localhost:5000`.

> Do not commit the `.env` file. It contains database credentials.

### 3. Configure and start the frontend

Open a second terminal from the project root:

```bash
cd frontend
npm install
npm run dev
```

Open the URL shown by Vite, usually `http://localhost:5173`.

Keep both terminals running while using the application.

## REST API Endpoints

Base URL: `http://localhost:5000`

| Method | Endpoint | Description | Success | Errors |
| --- | --- | --- | --- | --- |
| GET | `/api/tasks` | Retrieve all tasks (newest first) | `200` | `500` |
| POST | `/api/tasks` | Create a task | `201` | `400`, `500` |
| PUT | `/api/tasks/:id` | Update a task | `200` | `404`, `500` |
| DELETE | `/api/tasks/:id` | Delete a task | `200` | `404`, `500` |

`GET` /api/tasks/:id' (single task) is not implemented; the frontend loads the full list.

### Task fields

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `title` | String | Yes | Trimmed; empty titles rejected |
| `description` | String | No | Defaults to empty string |
| `status` | String | No | One of `Pending`, `In Progress`, `Done`; defaults to `Pending` |
| `createdAt` | Date | Auto | Set by Mongoose timestamps |
| `updatedAt` | Date | Auto | Set by Mongoose timestamps |

### Example requests

Create a task:

```http
POST /api/tasks
Content-Type: application/json
```

```json
{
  "title": "Complete assignment",
  "description": "Test the task management application",
  "status": "Pending"
}
```

Update a task:

```http
PUT /api/tasks/<TASK_ID>
Content-Type: application/json
```

```json
{
  "title": "Complete assignment",
  "description": "Verified CRUD end to end",
  "status": "Done"
}
```

Example error response (missing title):

```json
{ "message": "Task title is required" }
```

## Testing

1. Create a task with a valid title and confirm it appears in the list.
2. Refresh the page and confirm the task persists.
3. Edit the task and confirm the updated values are shown.
4. Delete the task and confirm it is removed.
5. Submit an empty title and confirm it is rejected.
6. Stop the backend and confirm the frontend does not crash on failed requests.
7. Restart the backend and refresh the page.

## Notes

- Add a `.gitignore` at the repository root excluding `node_modules/`, `.env`, and build output before publishing.
- Do not commit `.env` files or database credentials.
- This project focuses on the required CRUD functionality; optional features such as search, filtering, sorting, and pagination are not included.

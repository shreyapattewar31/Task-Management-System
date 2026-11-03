import AdminDashboard from "./AdminDashboard";
import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "http://localhost:5000/api";

function App() {
  // Authentication state
  const [token, setToken] = useState(
    () => localStorage.getItem("token") || ""
  );

  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");

    try {
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [authMode, setAuthMode] = useState("login");
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // Task state
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("Pending");

  // Edit task state
  const [editingTask, setEditingTask] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState("Pending");

  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");

  // Authentication: Signup or Login
  const handleAuth = async (event) => {
    event.preventDefault();
    setAuthError("");
    setAuthLoading(true);

    const endpoint =
      authMode === "signup" ? "/auth/signup" : "/auth/login";

    const requestBody =
      authMode === "signup"
        ? {
            name: authName.trim(),
            email: authEmail.trim(),
            password: authPassword,
          }
        : {
            email: authEmail.trim(),
            password: authPassword,
          };

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Authentication failed");
      }

      // Signup response may not contain a token.
      // After signup, switch to Login.
      if (authMode === "signup") {
        setAuthMode("login");
        setAuthName("");
        setAuthPassword("");
        setAuthError("Account created successfully. Please log in.");
        return;
      }

      // Login response contains token and user.
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      setToken(data.token);
      setUser(data.user);
      setAuthPassword("");
    } catch (error) {
      setAuthError(error.message || "Could not connect to the backend.");
    } finally {
      setAuthLoading(false);
    }
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setToken("");
    setUser(null);
    setTasks([]);
    setEditingTask(null);
    setFetchError("");
  };

  // Fetch tasks using JWT token
  const fetchTasks = async () => {
    if (!token) return;

    setLoading(true);
    setFetchError("");

    try {
      const response = await fetch(`${API_URL}/tasks`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.status === 401 || response.status === 403) {
        handleLogout();
        throw new Error("Your session has expired. Please log in again.");
      }

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch tasks");
      }

      setTasks(data);
    } catch (error) {
      console.error("Fetch tasks error:", error);
      setFetchError(error.message || "Could not load tasks.");
    } finally {
      setLoading(false);
    }
  };

  // Load tasks after login
  useEffect(() => {
    if (token && user?.role === "User") {
    fetchTasks();
    }
  }, [token, user]);

  // Create task
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!title.trim()) {
      alert("Please enter a task title");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          description,
          status,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create task");
      }

      setTitle("");
      setDescription("");
      setStatus("Pending");

      await fetchTasks();
    } catch (error) {
      console.error("Create task error:", error);
      alert(error.message || "Could not create task.");
    }
  };

  // Open edit form
  const handleEdit = (task) => {
    setEditingTask(task);
    setEditTitle(task.title);
    setEditDescription(task.description || "");
    setEditStatus(task.status);
  };

  // Update task
  const handleUpdate = async (event) => {
    event.preventDefault();

    if (!editTitle.trim()) {
      alert("Please enter a task title");
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/tasks/${editingTask._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: editTitle.trim(),
            description: editDescription,
            status: editStatus,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update task");
      }

      setEditingTask(null);
      await fetchTasks();
    } catch (error) {
      console.error("Update task error:", error);
      alert(error.message || "Could not update task.");
    }
  };

  // Delete task
  const handleDelete = async (taskId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this task?"
    );

    if (!confirmDelete) return;

    try {
      const response = await fetch(`${API_URL}/tasks/${taskId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete task");
      }

      await fetchTasks();
    } catch (error) {
      console.error("Delete task error:", error);
      alert(error.message || "Could not delete task.");
    }
  };

  const handleCancelEdit = () => {
    setEditingTask(null);
  };

  // Signup/Login screen
  if (!token || !user) {
    return (
      <div className="app">
        <h1>Task Management System</h1>

        <div className="auth-container">
          <h2>
            {authMode === "login" ? "Login" : "Create Account"}
          </h2>

          <form onSubmit={handleAuth}>
            {authMode === "signup" && (
              <>
                <label>Name *</label>
                <input
                  type="text"
                  placeholder="Enter your name"
                  value={authName}
                  onChange={(event) => setAuthName(event.target.value)}
                  required
                />
              </>
            )}

            <label>Email *</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={authEmail}
              onChange={(event) => setAuthEmail(event.target.value)}
              required
            />

            <label>Password *</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={authPassword}
              onChange={(event) => setAuthPassword(event.target.value)}
              required
            />

            {authError && (
              <p className="auth-message" role="alert">
                {authError}
              </p>
            )}

            <button type="submit" disabled={authLoading}>
              {authLoading
                ? "Please wait..."
                : authMode === "login"
                ? "Login"
                : "Sign Up"}
            </button>
          </form>

          <p>
            {authMode === "login"
              ? "Don't have an account? "
              : "Already have an account? "}

            <button
              type="button"
              className="link-button"
              onClick={() => {
                setAuthMode(
                  authMode === "login" ? "signup" : "login"
                );
                setAuthError("");
              }}
            >
              {authMode === "login" ? "Sign Up" : "Login"}
            </button>
          </p>
        </div>
      </div>
    );
  }
  if (user.role === "Admin") {
  return (
    <AdminDashboard
      token={token}
      onLogout={handleLogout}
    />
  );
}

  // User task dashboard
  return (
    <div className="app">
      <div className="dashboard-header">
        <div>
          <h1>Task Management System</h1>
          <p>Welcome, {user.name}</p>
          <p>Role: {user.role}</p>
        </div>

        <button type="button" onClick={handleLogout}>
          Logout
        </button>
      </div>

      {/* Create Task Form */}
      <form onSubmit={handleSubmit}>
        <h2>Add New Task</h2>

        <label>Task Title *</label>
        <input
          type="text"
          placeholder="Enter task title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
        />

        <label>Description</label>
        <textarea
          placeholder="Enter task description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />

        <label>Status</label>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option value="Pending">Pending</option>
          <option value="In Progress">In Progress</option>
          <option value="Done">Done</option>
        </select>

        <button type="submit">Add Task</button>
      </form>

      {/* Edit Task Form */}
      {editingTask && (
        <form onSubmit={handleUpdate}>
          <h2>Edit Task</h2>

          <label>Task Title *</label>
          <input
            type="text"
            value={editTitle}
            onChange={(event) => setEditTitle(event.target.value)}
            required
          />

          <label>Description</label>
          <textarea
            value={editDescription}
            onChange={(event) => setEditDescription(event.target.value)}
          />

          <label>Status</label>
          <select
            value={editStatus}
            onChange={(event) => setEditStatus(event.target.value)}
          >
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Done">Done</option>
          </select>

          <button type="submit">Save Changes</button>

          <button type="button" onClick={handleCancelEdit}>
            Cancel
          </button>
        </form>
      )}

      {/* Task List */}
      <h2>Tasks</h2>

      {loading ? (
        <p>Loading tasks...</p>
      ) : fetchError ? (
        <div>
          <p role="alert">{fetchError}</p>
          <button type="button" onClick={fetchTasks}>
            Retry
          </button>
        </div>
      ) : tasks.length === 0 ? (
        <p>No tasks found. Add your first task!</p>
      ) : (
        <ul>
          {tasks.map((task) => (
            <li key={task._id}>
              <strong>{task.title}</strong>

              <p>{task.description || "No description provided"}</p>
              <p>Status: {task.status}</p>

              <p>
                Created Date:{" "}
                {task.createdAt
                  ? new Date(task.createdAt).toLocaleDateString()
                  : "Date unavailable"}
              </p>

              <button type="button" onClick={() => handleEdit(task)}>
                Edit
              </button>

              <button
                type="button"
                onClick={() => handleDelete(task._id)}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default App;
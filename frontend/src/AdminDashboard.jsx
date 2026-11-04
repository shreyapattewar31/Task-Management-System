
import { useCallback, useEffect, useState } from "react";
import "./AdminDashboard.css";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const initialForm = {
  title: "",
  description: "",
  userId: "",
  priority: "Medium",
  dueDate: "",
};

function AdminDashboard({ token, onLogout }) {
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState(initialForm);
  const [assigning, setAssigning] = useState(false);

  // Fetch dashboard data
  const fetchAdminData = useCallback(async () => {
    if (!token) {
      setError("No authentication token found. Please log in again.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [usersResponse, tasksResponse] = await Promise.all([
        fetch(`${API_URL}/admin/users`, { headers }),
        fetch(`${API_URL}/admin/tasks`, { headers }),
      ]);

      if (
        usersResponse.status === 401 ||
        tasksResponse.status === 401
      ) {
        throw new Error("Session expired. Please log in again.");
      }

      if (
        usersResponse.status === 403 ||
        tasksResponse.status === 403
      ) {
        throw new Error("Admin privileges are required.");
      }

      if (!usersResponse.ok || !tasksResponse.ok) {
        throw new Error("Could not load dashboard data.");
      }

      const usersData = await usersResponse.json();
      const tasksData = await tasksResponse.json();

      setUsers(usersData);
      setTasks(tasksData);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  // Handle form input changes
  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // Assign task to selected user
  
  // Assign task to selected user
  const handleAssignTask = async (event) => {
    event.preventDefault();

    setFormError("");
    setSuccess("");

    if (!form.title.trim()) {
      setFormError("Task title is required.");
      return;
    }

    if (!form.userId) {
      setFormError("Please select a user.");
      return;
    }

    try {
      setAssigning(true);

      const response = await fetch(`${API_URL}/admin/assign-task`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim(),
          userId: form.userId,
          priority: form.priority,
          dueDate: form.dueDate || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to assign task.");
      }

      // Show task assignment and email status
      if (data.emailSent) {
        setSuccess(
          "Task assigned successfully. Email notification sent."
        );
      } else {
        setSuccess(
          "Task assigned successfully, but the email notification could not be sent."
        );
      }

      // Reset form after successful assignment
      setForm(initialForm);

      // Refresh users and tasks in the dashboard
      await fetchAdminData();
    } catch (err) {
      setFormError(err.message || "Failed to assign task.");
    } finally {
      setAssigning(false);
    }
  };

  const getUser = (userId) => {
    const id =
      typeof userId === "object" && userId !== null
        ? userId._id
        : userId;

    return users.find((user) => user._id === id);
  };

  const getUserName = (userId) => {
    if (typeof userId === "object" && userId !== null) {
      return userId.name || "Unknown user";
    }

    return getUser(userId)?.name || "Unknown user";
  };

  const getUserEmail = (userId) => {
    if (typeof userId === "object" && userId !== null) {
      return userId.email || "Unknown email";
    }

    return getUser(userId)?.email || "Unknown email";
  };

  const completedTasks = tasks.filter(
    (task) => task.status === "Done"
  ).length;

  const pendingTasks = tasks.filter(
    (task) => task.status === "Pending"
  ).length;

  const inProgressTasks = tasks.filter(
    (task) => task.status === "In Progress"
  ).length;

  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="admin-state">
        <div className="admin-spinner" />
        <p>Loading dashboard data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-state">
        <div className="admin-error">
          <h2>Unable to load dashboard</h2>
          <p role="alert">{error}</p>

          <button
            className="admin-logout-button"
            type="button"
            onClick={onLogout}
          >
            Logout
          </button>

          <button
            type="button"
            onClick={fetchAdminData}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="admin-dashboard">
      {/* Dashboard Header */}
      <header className="admin-header">
        <div>
          <span className="admin-eyebrow">
            ADMINISTRATION
          </span>

          <h1>Admin Dashboard</h1>

          <p>
            Monitor users and manage tasks across your system.
          </p>
        </div>

        <button
          className="admin-logout-button"
          type="button"
          onClick={onLogout}
        >
          Logout
        </button>
      </header>

      {/* Dashboard Statistics */}
      <section
        className="admin-summary"
        aria-label="Dashboard statistics"
      >
        <article className="admin-stat-card">
          <div className="admin-stat-icon users-icon">U</div>
          <div>
            <p>Registered Users</p>
            <h2>{users.length}</h2>
          </div>
        </article>

        <article className="admin-stat-card">
          <div className="admin-stat-icon tasks-icon">T</div>
          <div>
            <p>Total Tasks</p>
            <h2>{tasks.length}</h2>
          </div>
        </article>

        <article className="admin-stat-card">
          <div className="admin-stat-icon completed-icon">✓</div>
          <div>
            <p>Completed Tasks</p>
            <h2>{completedTasks}</h2>
          </div>
        </article>

        <article className="admin-stat-card">
          <div className="admin-stat-icon pending-icon">◷</div>
          <div>
            <p>Pending Tasks</p>
            <h2>{pendingTasks}</h2>
          </div>
        </article>

        <article className="admin-stat-card">
          <div className="admin-stat-icon progress-icon">↻</div>
          <div>
            <p>In Progress Tasks</p>
            <h2>{inProgressTasks}</h2>
          </div>
        </article>
      </section>

      {/* Assign Task Form */}
      <section className="admin-panel">
        <div className="admin-panel-header">
          <div>
            <h2>Assign a Task</h2>
            <p>
              Create a task and assign it to a registered user.
            </p>
          </div>
        </div>

        <form
          className="admin-assignment-form"
          onSubmit={handleAssignTask}
        >
          <div className="admin-form-grid">
            <div className="admin-form-group">
              <label htmlFor="task-title">
                Task Title *
              </label>

              <input
                id="task-title"
                name="title"
                type="text"
                value={form.title}
                onChange={handleChange}
                placeholder="Enter task title"
                required
                maxLength={150}
              />
            </div>

            <div className="admin-form-group">
              <label htmlFor="assign-user">
                Assign To *
              </label>

              <select
                id="assign-user"
                name="userId"
                value={form.userId}
                onChange={handleChange}
                required
              >
                <option value="">
                  Select a user
                </option>

                {users
                  .filter((user) => user.role === "User")
                  .map((user) => (
                    <option
                      key={user._id}
                      value={user._id}
                    >
                      {user.name} ({user.email})
                    </option>
                  ))}
              </select>
            </div>

            <div className="admin-form-group">
              <label htmlFor="task-priority">
                Priority
              </label>

              <select
                id="task-priority"
                name="priority"
                value={form.priority}
                onChange={handleChange}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>

            <div className="admin-form-group">
              <label htmlFor="task-due-date">
                Due Date
              </label>

              <input
                id="task-due-date"
                name="dueDate"
                type="date"
                value={form.dueDate}
                onChange={handleChange}
              />
            </div>

            <div className="admin-form-group admin-form-full">
              <label htmlFor="task-description">
                Description
              </label>

              <textarea
                id="task-description"
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Enter task description"
                rows={4}
                maxLength={2000}
              />
            </div>
          </div>

          {formError && (
            <p className="admin-form-error" role="alert">
              {formError}
            </p>
          )}

          {success && (
            <p
              className="admin-form-success"
              role="status"
            >
              {success}
            </p>
          )}

          <button
            className="admin-assign-button"
            type="submit"
            disabled={assigning || users.length === 0}
          >
            {assigning
              ? "Assigning Task..."
              : "Assign Task"}
          </button>

          {users.length === 0 && (
            <p className="admin-form-error">
              No registered users are available.
            </p>
          )}
        </form>
      </section>

      {/* Registered Users */}
      <section className="admin-panel">
        <div className="admin-panel-header">
          <div>
            <h2>Registered Users</h2>
            <p>
              Users who have accounts in the system.
            </p>
          </div>

          <span className="admin-count">
            {users.length} users
          </span>
        </div>

        {users.length === 0 ? (
          <div className="admin-empty-state">
            <div className="admin-empty-icon">U</div>
            <h3>No registered users</h3>
            <p>Registered accounts will appear here.</p>
          </div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Registered</th>
                </tr>
              </thead>

              <tbody>
                {users.map((user) => (
                  <tr key={user._id}>
                    <td className="admin-name-cell">
                      {user.name}
                    </td>

                    <td>{user.email}</td>

                    <td>
                      <span
                        className={`admin-role-badge ${
                          user.role === "Admin"
                            ? "role-admin"
                            : "role-user"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>

                    <td>{formatDate(user.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* All Tasks */}
      <section className="admin-panel">
        <div className="admin-panel-header">
          <div>
            <h2>All Tasks</h2>
            <p>
              Tasks created by users and assigned by admins.
            </p>
          </div>

          <span className="admin-count">
            {tasks.length}{" "}
            {tasks.length === 1 ? "task" : "tasks"}
          </span>
        </div>

        {tasks.length === 0 ? (
          <div className="admin-empty-state">
            <div className="admin-empty-icon">T</div>
            <h3>No tasks yet</h3>
            <p>Assigned and created tasks will appear here.</p>
          </div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Assigned User</th>
                  <th>Email</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Due Date</th>
                  <th>Created</th>
                </tr>
              </thead>

              <tbody>
                {tasks.map((task) => (
                  <tr key={task._id}>
                    <td className="admin-name-cell">
                      {task.title}
                    </td>

                    <td>{getUserName(task.userId)}</td>

                    <td>{getUserEmail(task.userId)}</td>

                    <td>
                      <span
                        className={`admin-priority-badge priority-${(
                          task.priority || "Medium"
                        ).toLowerCase()}`}
                      >
                        {task.priority || "Medium"}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`admin-status-badge status-${(
                          task.status || "Pending"
                        )
                          .toLowerCase()
                          .replace(/\s+/g, "-")}`}
                      >
                        {task.status || "Pending"}
                      </span>
                    </td>

                    <td>{formatDate(task.dueDate)}</td>

                    <td>{formatDate(task.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <footer className="admin-footer">
        Task Management System · Admin Panel
      </footer>
    </main>
  );
}

export default AdminDashboard;

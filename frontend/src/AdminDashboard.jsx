import { useEffect, useState } from "react";
import "./AdminDashboard.css";

// Local development fallback. On Vercel, VITE_API_URL should be set
// to your deployed backend API URL, ending in /api.
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function AdminDashboard({ token, onLogout }) {
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAdminData = async () => {
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
          throw new Error("Access denied. Admin privileges are required.");
        }

        if (!usersResponse.ok || !tasksResponse.ok) {
          throw new Error("Could not load Admin dashboard data.");
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
    };

    if (token) {
      fetchAdminData();
    } else {
      setError("No authentication token found. Please log in again.");
      setLoading(false);
    }
  }, [token]);

  const getUser = (userId) => {
    const id =
      typeof userId === "object" && userId !== null
        ? userId._id
        : userId;

    return users.find((user) => user._id === id);
  };

  const getUserName = (userId) => {
    return getUser(userId)?.name || "Unknown user";
  };

  const getUserEmail = (userId) => {
    return getUser(userId)?.email || "Unknown email";
  };

  const completedTasks = tasks.filter(
    (task) => task.status === "Done"
  ).length;

  const pendingTasks = tasks.filter(
    (task) => task.status === "Pending"
  ).length;

  const inProgressTasks = tasks.filter(
    (task) => task.status === "In Progress").length;

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
        </div>
      </div>
    );
  }

  return (
    <main className="admin-dashboard">
      <header className="admin-header">
        <div>
          <span className="admin-eyebrow">ADMINISTRATION</span>
          <h1>Admin Dashboard</h1>
          <p>Monitor users and tasks across your system.</p>
        </div>

        <button
          className="admin-logout-button"
          type="button"
          onClick={onLogout}
        >
          Logout
        </button>
      </header>

      <section className="admin-summary" aria-label="Dashboard statistics">
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

      <section className="admin-panel">
        <div className="admin-panel-header">
          <div>
            <h2>Registered Users</h2>
            <p>Users who have accounts in the system</p>
          </div>
          <span className="admin-count">{users.length} users</span>
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
                    <td className="admin-name-cell">{user.name}</td>
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

      <section className="admin-panel">
        <div className="admin-panel-header">
          <div>
            <h2>All Tasks</h2>
            <p>Tasks created by users across the system</p>
          </div>
          <span className="admin-count">
            {tasks.length} {tasks.length === 1 ? "task" : "tasks"}
          </span>
        </div>

        {tasks.length === 0 ? (
          <div className="admin-empty-state">
            <div className="admin-empty-icon">T</div>
            <h3>No tasks yet</h3>
            <p>Tasks created by users will appear here.</p>
          </div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Owner</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>

              <tbody>
                {tasks.map((task) => (
                  <tr key={task._id}>
                    <td className="admin-name-cell">{task.title}</td>
                    <td>{getUserName(task.userId)}</td>
                    <td>{getUserEmail(task.userId)}</td>
                    <td>
                      <span
                        className={`admin-status-badge status-${(
                          task.status || "pending"
                        )
                          .toLowerCase()
                          .replace(/\s+/g, "-")}`}
                      >
                        {task.status || "Pending"}
                      </span>
                    </td>
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
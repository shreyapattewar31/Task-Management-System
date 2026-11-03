import { useEffect, useState } from "react";

const API_URL = "http://localhost:5000";

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
          fetch(`${API_URL}/api/admin/users`, { headers }),
          fetch(`${API_URL}/api/admin/tasks`, { headers }),
        ]);

        if (usersResponse.status === 401 || tasksResponse.status === 401) {
          throw new Error("Session expired. Please log in again.");
        }

        if (usersResponse.status === 403 || tasksResponse.status === 403) {
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
        setError(err.message);
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

  const getUserName = (userId) => {
    const user = users.find((item) => item._id === userId);
    return user ? user.name : "Unknown user";
  };

  const getUserEmail = (userId) => {
    const user = users.find((item) => item._id === userId);
    return user ? user.email : "Unknown email";
  };

  if (loading) {
    return <p>Loading Admin dashboard...</p>;
  }

  if (error) {
    return (
      <div>
        <p role="alert">{error}</p>
        <button type="button" onClick={onLogout}>
          Logout
        </button>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <header>
        <h1>Admin Dashboard</h1>
        <p>Monitor users and tasks across the system.</p>
        <button type="button" onClick={onLogout}>
          Logout
        </button>
      </header>

      <section className="admin-summary">
        <div>
          <h2>{users.length}</h2>
          <p>Registered Users</p>
        </div>

        <div>
          <h2>{tasks.length}</h2>
          <p>Total Tasks</p>
        </div>

        <div>
          <h2>{tasks.filter((task) => task.status === "Done").length}</h2>
          <p>Completed Tasks</p>
        </div>

        <div>
          <h2>
            {tasks.filter((task) => task.status === "Pending").length}
          </h2>
          <p>Pending Tasks</p>
        </div>
      </section>

      <section>
        <h2>Registered Users</h2>

        {users.length === 0 ? (
          <p>No registered users found.</p>
        ) : (
          <div className="admin-table-wrapper">
            <table>
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
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{user.role}</td>
                    <td>
                      {user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString()
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2>All Tasks</h2>

        {tasks.length === 0 ? (
          <p>No tasks found.</p>
        ) : (
          <div className="admin-table-wrapper">
            <table>
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
                    <td>{task.title}</td>
                    <td>{getUserName(task.userId)}</td>
                    <td>{getUserEmail(task.userId)}</td>
                    <td>{task.status}</td>
                    <td>
                      {task.createdAt
                        ? new Date(task.createdAt).toLocaleDateString()
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default AdminDashboard;
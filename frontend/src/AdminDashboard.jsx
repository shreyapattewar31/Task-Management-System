import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import UserProfile from "./pages/UserProfile";
import Reports from "./pages/Reports";
import "./AdminDashboard.css";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const ITEMS_PER_PAGE = 8;
const STATUS_OPTIONS = ["Pending", "In Progress", "Done", "On Hold"];
const PRIORITY_OPTIONS = ["Low", "Medium", "High"];

const initialTaskForm = {
  title: "",
  description: "",
  userId: "",
  priority: "Medium",
  dueDate: "",
};

const initialEditForm = {
  title: "",
  description: "",
  status: "Pending",
  priority: "Medium",
  dueDate: "",
};

const STATUS_COLORS = {
  "Pending": "#f59e0b",
  "In Progress": "#3b82f6",
  "Done": "#22c55e",
  "On Hold": "#a855f7",
};

const PRIORITY_COLORS = {
  "Low": "#22c55e",
  "Medium": "#f59e0b",
  "High": "#ef4444",
};

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function AdminDashboard({ token, user, onLogout, onUserUpdate }) {
  const [users, setUsers] = useState([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersTotalPages, setUsersTotalPages] = useState(1);
  const [usersPage, setUsersPage] = useState(1);
  const [usersSearch, setUsersSearch] = useState("");

  const [tasks, setTasks] = useState([]);
  const [tasksTotal, setTasksTotal] = useState(0);
  const [tasksTotalPages, setTasksTotalPages] = useState(1);
  const [tasksPage, setTasksPage] = useState(1);
  const [tasksSearch, setTasksSearch] = useState("");
  const [tasksFilterStatus, setTasksFilterStatus] = useState("");
  const [tasksFilterPriority, setTasksFilterPriority] = useState("");
  const [tasksSortBy, setTasksSortBy] = useState("createdAt");
  const [tasksSortOrder, setTasksSortOrder] = useState("desc");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [assignForm, setAssignForm] = useState(initialTaskForm);
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState("");
  const [assignSuccess, setAssignSuccess] = useState("");

  const [editingTask, setEditingTask] = useState(null);
  const [editForm, setEditForm] = useState(initialEditForm);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");

  const [editingUser, setEditingUser] = useState(null);
  const [userEditRole, setUserEditRole] = useState("User");
  const [userEditActive, setUserEditActive] = useState(true);
  const [userEditSaving, setUserEditSaving] = useState(false);
  const [userEditError, setUserEditError] = useState("");

  const [showProfile, setShowProfile] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Dark mode
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  // Bulk selection
  const [selectedTasks, setSelectedTasks] = useState(new Set());
  const [selectedUsers, setSelectedUsers] = useState(new Set());

  // Calendar
  const [calendarDate, setCalendarDate] = useState(new Date());

  const userSearchTimer = useRef(null);
  const taskSearchTimer = useRef(null);

  // Apply dark mode
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", darkMode ? "dark" : "light");
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  // Fetch functions
  const fetchUsers = useCallback(
    async (opts = {}) => {
      const params = new URLSearchParams({
        search: opts.search ?? usersSearch,
        page: String(opts.page ?? usersPage),
        limit: String(ITEMS_PER_PAGE),
      });
      const res = await fetch(`${API_URL}/admin/users?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      setUsers(data.users || []);
      setUsersTotal(data.total || 0);
      setUsersTotalPages(data.totalPages || 1);
    },
    [token, usersSearch, usersPage]
  );

  const fetchTasks = useCallback(
    async (opts = {}) => {
      const params = new URLSearchParams({
        search: opts.search ?? tasksSearch,
        status: opts.status ?? tasksFilterStatus,
        priority: opts.priority ?? tasksFilterPriority,
        sortBy: opts.sortBy ?? tasksSortBy,
        sortOrder: opts.sortOrder ?? tasksSortOrder,
        page: String(opts.page ?? tasksPage),
        limit: String(ITEMS_PER_PAGE),
      });
      const res = await fetch(`${API_URL}/admin/tasks?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch tasks");
      const data = await res.json();
      setTasks(data.tasks || []);
      setTasksTotal(data.total || 0);
      setTasksTotalPages(data.totalPages || 1);
    },
    [token, tasksSearch, tasksFilterStatus, tasksFilterPriority, tasksSortBy, tasksSortOrder, tasksPage]
  );

  const fetchAll = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      await Promise.all([fetchUsers(), fetchTasks()]);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, [token, fetchUsers, fetchTasks]);

  useEffect(() => {
    (async () => { await fetchAll(); })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Assign task
  const handleAssignTask = async (e) => {
    e.preventDefault();
    setAssignError("");
    setAssignSuccess("");
    if (!assignForm.title.trim()) { setAssignError("Task title is required."); return; }
    if (!assignForm.userId) { setAssignError("Please select a user."); return; }

    setAssigning(true);
    try {
      const res = await fetch(`${API_URL}/admin/assign-task`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: assignForm.title.trim(),
          description: assignForm.description.trim(),
          userId: assignForm.userId,
          priority: assignForm.priority,
          dueDate: assignForm.dueDate || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to assign task.");
      setAssignSuccess(
        data.emailSent
          ? "Task assigned and email sent."
          : "Task assigned. Email could not be sent."
      );
      setAssignForm(initialTaskForm);
      await fetchTasks({ page: 1 });
      setTasksPage(1);
    } catch (err) {
      setAssignError(err.message || "Failed to assign task.");
    } finally {
      setAssigning(false);
    }
  };

  // Task edit
  const openTaskEdit = (task) => {
    setEditingTask(task);
    setEditForm({
      title: task.title,
      description: task.description || "",
      status: task.status,
      priority: task.priority || "Medium",
      dueDate: task.dueDate ? task.dueDate.slice(0, 10) : "",
    });
    setEditError("");
  };

  const handleTaskEditSave = async (e) => {
    e.preventDefault();
    setEditError("");
    if (!editForm.title.trim()) { setEditError("Title is required"); return; }
    setEditSaving(true);
    try {
      const res = await fetch(`${API_URL}/admin/tasks/${editingTask._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: editForm.title.trim(),
          description: editForm.description,
          status: editForm.status,
          priority: editForm.priority,
          dueDate: editForm.dueDate || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Update failed");
      setEditingTask(null);
      await fetchTasks();
    } catch (err) {
      setEditError(err.message);
    } finally {
      setEditSaving(false);
    }
  };

  const handleTaskDelete = async (taskId) => {
    if (!window.confirm("Delete this task permanently?")) return;
    try {
      const res = await fetch(`${API_URL}/admin/tasks/${taskId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Delete failed");
      await fetchTasks();
      setSelectedTasks((prev) => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
    } catch (err) {
      alert(err.message || "Could not delete task");
    }
  };

  // Bulk task actions
  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedTasks.size} selected tasks?`)) return;
    try {
      await Promise.all(
        Array.from(selectedTasks).map((id) =>
          fetch(`${API_URL}/admin/tasks/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          })
        )
      );
      setSelectedTasks(new Set());
      await fetchTasks();
    } catch (err) {
      alert("Some tasks could not be deleted");
    }
  };

  const handleBulkStatusChange = async (status) => {
    try {
      await Promise.all(
        Array.from(selectedTasks).map((id) =>
          fetch(`${API_URL}/admin/tasks/${id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ status }),
          })
        )
      );
      setSelectedTasks(new Set());
      await fetchTasks();
    } catch (err) {
      alert("Some tasks could not be updated");
    }
  };

  // User management
  const openUserEdit = (u) => {
    setEditingUser(u);
    setUserEditRole(u.role);
    setUserEditActive(u.isActive !== false);
    setUserEditError("");
  };

  const handleUserEditSave = async (e) => {
    e.preventDefault();
    setUserEditError("");
    setUserEditSaving(true);
    try {
      const res = await fetch(`${API_URL}/admin/users/${editingUser._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: userEditRole, isActive: userEditActive }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Update failed");
      setEditingUser(null);
      await fetchUsers();
    } catch (err) {
      setUserEditError(err.message);
    } finally {
      setUserEditSaving(false);
    }
  };

  const handleUserDelete = async (userId) => {
    if (!window.confirm("Permanently delete this user and all their tasks?")) return;
    try {
      const res = await fetch(`${API_URL}/admin/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Delete failed");
      await fetchUsers();
      await fetchTasks();
      setSelectedUsers((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    } catch (err) {
      alert(err.message || "Could not delete user");
    }
  };

  // Bulk user actions
  const handleBulkDeactivateUsers = async () => {
    if (!window.confirm(`Deactivate ${selectedUsers.size} selected users?`)) return;
    try {
      await Promise.all(
        Array.from(selectedUsers).map((id) =>
          fetch(`${API_URL}/admin/users/${id}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ isActive: false }),
          })
        )
      );
      setSelectedUsers(new Set());
      await fetchUsers();
    } catch (err) {
      alert("Some users could not be deactivated");
    }
  };

  const handleBulkRoleChange = async (role) => {
    try {
      await Promise.all(
        Array.from(selectedUsers).map((id) =>
          fetch(`${API_URL}/admin/users/${id}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ role }),
          })
        )
      );
      setSelectedUsers(new Set());
      await fetchUsers();
    } catch (err) {
      alert("Some users could not be updated");
    }
  };

  // Search debounce
  const handleUsersSearch = (val) => {
    setUsersSearch(val);
    setUsersPage(1);
    clearTimeout(userSearchTimer.current);
    userSearchTimer.current = setTimeout(() => fetchUsers({ search: val, page: 1 }), 400);
  };

  const handleTasksSearch = (val) => {
    setTasksSearch(val);
    setTasksPage(1);
    clearTimeout(taskSearchTimer.current);
    taskSearchTimer.current = setTimeout(() => fetchTasks({ search: val, page: 1 }), 400);
  };

  // Filter helpers
  const handleTaskFilterChange = (key, val) => {
    const next = {
      search: tasksSearch,
      status: tasksFilterStatus,
      priority: tasksFilterPriority,
      sortBy: tasksSortBy,
      sortOrder: tasksSortOrder,
      page: 1,
    };
    next[key] = val;
    if (key === "status") setTasksFilterStatus(val);
    if (key === "priority") setTasksFilterPriority(val);
    setTasksPage(1);
    fetchTasks({ ...next });
  };

  // Derived stats
  const completedCount = tasks.filter((t) => t.status === "Done").length;
  const pendingCount = tasks.filter((t) => t.status === "Pending").length;
  const inProgressCount = tasks.filter((t) => t.status === "In Progress").length;

  // Status breakdown for pie chart
  const statusBreakdown = useMemo(() => {
    const counts = {};
    tasks.forEach((t) => {
      counts[t.status] = (counts[t.status] || 0) + 1;
    });
    return counts;
  }, [tasks]);

  // Priority breakdown for bar chart
  const priorityBreakdown = useMemo(() => {
    const counts = {};
    tasks.forEach((t) => {
      const p = t.priority || "Medium";
      counts[p] = (counts[p] || 0) + 1;
    });
    return counts;
  }, [tasks]);

  // Task completion trend (last 7 days)
  const completionTrend = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStr = d.toISOString().slice(0, 10);
      const count = tasks.filter(
        (t) => t.status === "Done" && t.updatedAt && t.updatedAt.slice(0, 10) === dayStr
      ).length;
      days.push({ date: d.toLocaleDateString("en-IN", { weekday: "short" }), count });
    }
    return days;
  }, [tasks]);

  // Loading / error
  if (loading) {
    return (
      <div className="admin-state">
        <div className="admin-spinner" />
        <p>Loading dashboard…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-state">
        <div className="admin-error">
          <h2>Unable to load dashboard</h2>
          <p role="alert">{error}</p>
          <button className="admin-logout-button" onClick={onLogout}>Logout</button>
          <button onClick={fetchAll} style={{ marginTop: 8 }}>Retry</button>
        </div>
      </div>
    );
  }

  const NAV_ITEMS = [
    { key: "overview", icon: "📊", label: "Overview" },
    { key: "assign", icon: "➕", label: "Assign Task" },
    { key: "tasks", icon: "📋", label: `Tasks`, count: tasksTotal },
    { key: "users", icon: "👥", label: `Users`, count: usersTotal },
    { key: "calendar", icon: "📅", label: "Calendar" },
    { key: "activity", icon: "📝", label: "Activity" },
    { key: "reports", icon: "📈", label: "Reports" },
  ];

  return (
    <div className="admin-root">
      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? "admin-sidebar--open" : ""}`} aria-label="Admin navigation">
        <div className="admin-sidebar-brand">
          <span className="admin-brand-icon">✓</span>
          <span className="admin-brand-name">Task Manager</span>
          <span className="admin-brand-tag">Admin</span>
        </div>

        <nav className="admin-sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              className={`admin-nav-item ${activeTab === item.key ? "admin-nav-item--active" : ""}`}
              onClick={() => { setActiveTab(item.key); setSidebarOpen(false); }}
            >
              <span className="admin-nav-icon">{item.icon}</span>
              <span className="admin-nav-label">{item.label}</span>
              {item.count !== undefined && item.count > 0 && (
                <span className="admin-nav-badge">{item.count}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-sidebar-user">
            <span className="admin-avatar">{(user?.name || "A")[0].toUpperCase()}</span>
            <div className="admin-sidebar-user-info">
              <span className="admin-sidebar-user-name">{user?.name}</span>
              <span className="admin-sidebar-user-role">Admin</span>
            </div>
          </div>
          <button className="admin-theme-toggle" onClick={toggleDarkMode} title={darkMode ? "Light mode" : "Dark mode"}>
            {darkMode ? "☀️" : "🌙"}
          </button>
          <button className="admin-sidebar-logout" onClick={onLogout} title="Logout">⏻</button>
        </div>
      </aside>

      {sidebarOpen && <div className="admin-sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      <div className="admin-layout">
        {/* Mobile topbar */}
        <header className="admin-topbar">
          <button className="admin-hamburger" onClick={() => setSidebarOpen(true)} aria-label="Open menu">☰</button>
          <div className="admin-topbar-brand">
            <span className="admin-brand-icon">✓</span>
            <span>Task Manager</span>
            <span className="admin-brand-tag">Admin</span>
          </div>
          <div className="admin-topbar-right">
            <button className="admin-theme-toggle" onClick={toggleDarkMode} title={darkMode ? "Light mode" : "Dark mode"}>
              {darkMode ? "☀️" : "🌙"}
            </button>
            <button className="admin-avatar-btn" onClick={() => setShowProfile(true)} title="My Profile">
              <span className="admin-avatar">{(user?.name || "A")[0].toUpperCase()}</span>
              <span className="admin-username">{user?.name}</span>
            </button>
            <button className="admin-logout-button" onClick={onLogout}>Logout</button>
          </div>
        </header>

        <main className="admin-main">
        {/* ══ OVERVIEW ══════════════════════════════════════════════════════════ */}
        {activeTab === "overview" && (
          <div className="admin-overview">
            <div className="admin-summary">
              {[
                { icon: "👥", label: "Registered Users", value: usersTotal, cls: "users-icon" },
                { icon: "📋", label: "Total Tasks", value: tasksTotal, cls: "tasks-icon" },
                { icon: "✅", label: "Completed", value: completedCount, cls: "completed-icon" },
                { icon: "⏳", label: "Pending", value: pendingCount, cls: "pending-icon" },
                { icon: "🔄", label: "In Progress", value: inProgressCount, cls: "progress-icon" },
              ].map((s) => (
                <article key={s.label} className="admin-stat-card">
                  <div className={`admin-stat-icon ${s.cls}`}>{s.icon}</div>
                  <div>
                    <p>{s.label}</p>
                    <h2>{s.value}</h2>
                  </div>
                </article>
              ))}
            </div>

            {/* Charts */}
            <div className="admin-charts-row">
              <div className="admin-chart-card">
                <h3>Tasks by Status</h3>
                <PieChart data={statusBreakdown} colors={STATUS_COLORS} />
              </div>
              <div className="admin-chart-card">
                <h3>Tasks by Priority</h3>
                <BarChart data={priorityBreakdown} colors={PRIORITY_COLORS} />
              </div>
            </div>

            <div className="admin-chart-card admin-chart-card-full">
              <h3>Task Completion Trend (Last 7 Days)</h3>
              <LineChart data={completionTrend} />
            </div>

            {/* Recent tasks */}
            <div className="admin-panel">
              <div className="admin-panel-header">
                <div><h2>Recent Tasks</h2><p>Latest 5 tasks in the system.</p></div>
                <button className="admin-view-all" onClick={() => setActiveTab("tasks")}>View all →</button>
              </div>
              <RecentTasksTable tasks={tasks.slice(0, 5)} formatDate={formatDate} />
            </div>
          </div>
        )}

        {/* ══ ASSIGN TASK ═══════════════════════════════════════════════════════ */}
        {activeTab === "assign" && (
          <div className="admin-panel">
            <div className="admin-panel-header">
              <div><h2>Assign a Task</h2><p>Create a task and assign it to a user.</p></div>
            </div>

            <form className="admin-assignment-form" onSubmit={handleAssignTask}>
              <div className="admin-form-grid">
                <div className="admin-form-group">
                  <label htmlFor="at-title">Task Title *</label>
                  <input
                    id="at-title" name="title" type="text"
                    value={assignForm.title}
                    onChange={(e) => setAssignForm((p) => ({ ...p, title: e.target.value }))}
                    placeholder="Enter task title" required maxLength={150}
                  />
                </div>

                <div className="admin-form-group">
                  <label htmlFor="at-user">Assign To *</label>
                  <select
                    id="at-user" name="userId"
                    value={assignForm.userId}
                    onChange={(e) => setAssignForm((p) => ({ ...p, userId: e.target.value }))}
                    required
                  >
                    <option value="">Select a user</option>
                    {users.filter((u) => u.role === "User" && u.isActive !== false).map((u) => (
                      <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
                    ))}
                  </select>
                </div>

                <div className="admin-form-group">
                  <label htmlFor="at-priority">Priority</label>
                  <select
                    id="at-priority"
                    value={assignForm.priority}
                    onChange={(e) => setAssignForm((p) => ({ ...p, priority: e.target.value }))}
                  >
                    {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>

                <div className="admin-form-group">
                  <label htmlFor="at-due">Due Date</label>
                  <input
                    id="at-due" type="date"
                    value={assignForm.dueDate}
                    onChange={(e) => setAssignForm((p) => ({ ...p, dueDate: e.target.value }))}
                  />
                </div>

                <div className="admin-form-group admin-form-full">
                  <label htmlFor="at-desc">Description</label>
                  <textarea
                    id="at-desc"
                    value={assignForm.description}
                    onChange={(e) => setAssignForm((p) => ({ ...p, description: e.target.value }))}
                    placeholder="Optional description"
                    rows={4} maxLength={2000}
                  />
                </div>
              </div>

              {assignError && <p className="admin-form-error" role="alert">{assignError}</p>}
              {assignSuccess && <p className="admin-form-success" role="status">{assignSuccess}</p>}

              <button
                className="admin-assign-button" type="submit"
                disabled={assigning || users.filter((u) => u.role === "User").length === 0}
              >
                {assigning ? "Assigning…" : "Assign Task"}
              </button>

              {users.filter((u) => u.role === "User").length === 0 && (
                <p className="admin-form-error" style={{ marginTop: 8 }}>No active users available.</p>
              )}
            </form>
          </div>
        )}

        {/* ══ TASKS TAB ═════════════════════════════════════════════════════════ */}
        {activeTab === "tasks" && (
          <div className="admin-panel">
            <div className="admin-panel-header">
              <div><h2>All Tasks</h2><p>Manage every task in the system.</p></div>
              <span className="admin-count">{tasksTotal} task{tasksTotal !== 1 ? "s" : ""}</span>
            </div>

            {/* Filters */}
            <div className="admin-filters">
              <input
                className="admin-search" type="search" placeholder="Search tasks…"
                value={tasksSearch}
                onChange={(e) => handleTasksSearch(e.target.value)}
              />
              <select
                className="admin-filter-select" value={tasksFilterStatus}
                onChange={(e) => handleTaskFilterChange("status", e.target.value)}
              >
                <option value="">All Statuses</option>
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <select
                className="admin-filter-select" value={tasksFilterPriority}
                onChange={(e) => handleTaskFilterChange("priority", e.target.value)}
              >
                <option value="">All Priorities</option>
                {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
              <select
                className="admin-filter-select"
                value={`${tasksSortBy}:${tasksSortOrder}`}
                onChange={(e) => {
                  const [sb, so] = e.target.value.split(":");
                  setTasksSortBy(sb); setTasksSortOrder(so);
                  setTasksPage(1);
                  fetchTasks({ sortBy: sb, sortOrder: so, page: 1 });
                }}
              >
                <option value="createdAt:desc">Newest first</option>
                <option value="createdAt:asc">Oldest first</option>
                <option value="dueDate:asc">Due soon</option>
                <option value="priority:desc">Priority (high)</option>
                <option value="title:asc">Title A→Z</option>
              </select>
            </div>

            {/* Bulk actions bar */}
            {selectedTasks.size > 0 && (
              <div className="admin-bulk-bar">
                <span className="admin-bulk-bar-label">{selectedTasks.size} selected</span>
                <button className="admin-bulk-btn admin-bulk-btn--primary" onClick={() => handleBulkStatusChange("In Progress")}>→ In Progress</button>
                <button className="admin-bulk-btn admin-bulk-btn--primary" onClick={() => handleBulkStatusChange("Done")}>✓ Done</button>
                <button className="admin-bulk-btn admin-bulk-btn--primary" onClick={() => handleBulkStatusChange("On Hold")}>⏸ On Hold</button>
                <button className="admin-bulk-btn admin-bulk-btn--danger" onClick={handleBulkDelete}>🗑 Delete</button>
                <button className="admin-bulk-btn" onClick={() => setSelectedTasks(new Set())}>✕ Clear</button>
              </div>
            )}

            {tasks.length === 0 ? (
              <EmptyState icon="📋" title="No tasks found" sub="Try adjusting your filters." />
            ) : (
              <>
                <div className="admin-table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th className="admin-checkbox-cell">
                          <input type="checkbox" className="admin-checkbox"
                            checked={selectedTasks.size === tasks.length}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedTasks(new Set(tasks.map((t) => t._id)));
                              else setSelectedTasks(new Set());
                            }}
                          />
                        </th>
                        <th>Task</th>
                        <th>Assigned To</th>
                        <th>Priority</th>
                        <th>Status</th>
                        <th>Due Date</th>
                        <th>Created</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tasks.map((task) => (
                        <tr key={task._id}>
                          <td className="admin-checkbox-cell">
                            <input type="checkbox" className="admin-checkbox"
                              checked={selectedTasks.has(task._id)}
                              onChange={(e) => {
                                const next = new Set(selectedTasks);
                                if (e.target.checked) next.add(task._id);
                                else next.delete(task._id);
                                setSelectedTasks(next);
                              }}
                            />
                          </td>
                          <td className="admin-name-cell">{task.title}</td>
                          <td>
                            <div>{typeof task.userId === "object" ? task.userId?.name : "—"}</div>
                            <div className="admin-cell-sub">{typeof task.userId === "object" ? task.userId?.email : ""}</div>
                          </td>
                          <td>
                            <span className={`admin-priority-badge priority-${(task.priority || "medium").toLowerCase()}`}>
                              {task.priority || "Medium"}
                            </span>
                          </td>
                          <td>
                            <span className={`admin-status-badge status-${(task.status || "pending").toLowerCase().replace(/\s+/g, "-")}`}>
                              {task.status}
                            </span>
                          </td>
                          <td>{formatDate(task.dueDate)}</td>
                          <td>{formatDate(task.createdAt)}</td>
                          <td>
                            <div className="admin-action-btns">
                              <button className="admin-action-btn admin-action-btn--edit" onClick={() => openTaskEdit(task)} title="Edit">✏️</button>
                              <button className="admin-action-btn admin-action-btn--delete" onClick={() => handleTaskDelete(task._id)} title="Delete">🗑️</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination
                  page={tasksPage}
                  totalPages={tasksTotalPages}
                  onPrev={() => { const p = tasksPage - 1; setTasksPage(p); fetchTasks({ page: p }); }}
                  onNext={() => { const p = tasksPage + 1; setTasksPage(p); fetchTasks({ page: p }); }}
                  onPage={(p) => { setTasksPage(p); fetchTasks({ page: p }); }}
                />
              </>
            )}
          </div>
        )}

        {/* ══ USERS TAB ═════════════════════════════════════════════════════════ */}
        {activeTab === "users" && (
          <div className="admin-panel">
            <div className="admin-panel-header">
              <div><h2>Registered Users</h2><p>Manage user accounts and roles.</p></div>
              <span className="admin-count">{usersTotal} user{usersTotal !== 1 ? "s" : ""}</span>
            </div>

            <div className="admin-filters">
              <input
                className="admin-search" type="search" placeholder="Search users…"
                value={usersSearch}
                onChange={(e) => handleUsersSearch(e.target.value)}
              />
            </div>

            {selectedUsers.size > 0 && (
              <div className="admin-bulk-bar">
                <span className="admin-bulk-bar-label">{selectedUsers.size} selected</span>
                <button className="admin-bulk-btn admin-bulk-btn--danger" onClick={handleBulkDeactivateUsers}>⏸ Deactivate</button>
                <button className="admin-bulk-btn admin-bulk-btn--primary" onClick={() => handleBulkRoleChange("User")}>👤 → User</button>
                <button className="admin-bulk-btn admin-bulk-btn--primary" onClick={() => handleBulkRoleChange("Admin")}>👑 → Admin</button>
                <button className="admin-bulk-btn" onClick={() => setSelectedUsers(new Set())}>✕ Clear</button>
              </div>
            )}

            {users.length === 0 ? (
              <EmptyState icon="👥" title="No users found" sub="Registered accounts will appear here." />
            ) : (
              <>
                <div className="admin-table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th className="admin-checkbox-cell">
                          <input type="checkbox" className="admin-checkbox"
                            checked={selectedUsers.size === users.length}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedUsers(new Set(users.map((u) => u._id)));
                              else setSelectedUsers(new Set());
                            }}
                          />
                        </th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Registered</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u._id}>
                          <td className="admin-checkbox-cell">
                            <input type="checkbox" className="admin-checkbox"
                              checked={selectedUsers.has(u._id)}
                              onChange={(e) => {
                                const next = new Set(selectedUsers);
                                if (e.target.checked) next.add(u._id);
                                else next.delete(u._id);
                                setSelectedUsers(next);
                              }}
                            />
                          </td>
                          <td className="admin-name-cell">{u.name}</td>
                          <td>{u.email}</td>
                          <td>
                            <span className={`admin-role-badge ${u.role === "Admin" ? "role-admin" : "role-user"}`}>
                              {u.role}
                            </span>
                          </td>
                          <td>
                            <span className={`admin-status-badge ${u.isActive !== false ? "status-done" : "status-on-hold"}`}>
                              {u.isActive !== false ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td>{formatDate(u.createdAt)}</td>
                          <td>
                            <div className="admin-action-btns">
                              <button className="admin-action-btn admin-action-btn--edit" onClick={() => openUserEdit(u)} title="Edit">✏️</button>
                              <button className="admin-action-btn admin-action-btn--delete" onClick={() => handleUserDelete(u._id)} title="Delete">🗑️</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination
                  page={usersPage}
                  totalPages={usersTotalPages}
                  onPrev={() => { const p = usersPage - 1; setUsersPage(p); fetchUsers({ page: p }); }}
                  onNext={() => { const p = usersPage + 1; setUsersPage(p); fetchUsers({ page: p }); }}
                  onPage={(p) => { setUsersPage(p); fetchUsers({ page: p }); }}
                />
              </>
            )}
          </div>
        )}

        {/* ══ CALENDAR TAB ═════════════════════════════════════════════════════ */}
        {activeTab === "calendar" && (
          <div className="admin-panel">
            <div className="admin-panel-header">
              <div><h2>Calendar View</h2><p>View tasks by due date.</p></div>
            </div>
            <div className="admin-calendar">
              <CalendarView tasks={tasks} date={calendarDate} onDateChange={setCalendarDate} />
            </div>
          </div>
        )}

        {/* ══ ACTIVITY TAB ═════════════════════════════════════════════════════ */}
        {activeTab === "activity" && (
          <div className="admin-panel">
            <div className="admin-panel-header">
              <div><h2>Activity Log</h2><p>Recent user and task activity.</p></div>
            </div>
            <div className="admin-activity-list">
              <ActivityList tasks={tasks} users={users} />
            </div>
          </div>
        )}

        {/* ══ REPORTS TAB ══════════════════════════════════════════════════════ */}
        {activeTab === "reports" && (
          <Reports token={token} role="Admin" />
        )}

      </main>{/* admin-main */}
      </div>{/* admin-layout */}

      <footer className="admin-footer">Task Management System · Admin Panel</footer>

      {/* ══ Task Edit Modal ══════════════════════════════════════════════════ */}
      {editingTask && (
        <div className="modal-overlay" onClick={() => setEditingTask(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Edit task">
            <div className="modal-header">
              <h2 className="modal-title">Edit Task</h2>
              <button className="modal-close" onClick={() => setEditingTask(null)}>✕</button>
            </div>
            <form className="modal-form" onSubmit={handleTaskEditSave}>
              <div className="modal-field">
                <label className="modal-label">Title *</label>
                <input className="modal-input" value={editForm.title} onChange={(e) => setEditForm((p) => ({ ...p, title: e.target.value }))} required maxLength={150} />
              </div>
              <div className="modal-field">
                <label className="modal-label">Description</label>
                <textarea className="modal-input modal-textarea" value={editForm.description} onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))} rows={3} />
              </div>
              <div className="modal-row">
                <div className="modal-field">
                  <label className="modal-label">Status</label>
                  <select className="modal-input" value={editForm.status} onChange={(e) => setEditForm((p) => ({ ...p, status: e.target.value }))}>
                    {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="modal-field">
                  <label className="modal-label">Priority</label>
                  <select className="modal-input" value={editForm.priority} onChange={(e) => setEditForm((p) => ({ ...p, priority: e.target.value }))}>
                    {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div className="modal-field">
                <label className="modal-label">Due Date</label>
                <input className="modal-input" type="date" value={editForm.dueDate} onChange={(e) => setEditForm((p) => ({ ...p, dueDate: e.target.value }))} />
              </div>
              {editError && <p className="modal-error">{editError}</p>}
              <div className="modal-actions">
                <button type="button" className="modal-btn modal-btn--cancel" onClick={() => setEditingTask(null)}>Cancel</button>
                <button type="submit" className="modal-btn modal-btn--save" disabled={editSaving}>{editSaving ? "Saving…" : "Save Changes"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══ User Edit Modal ══════════════════════════════════════════════════ */}
      {editingUser && (
        <div className="modal-overlay" onClick={() => setEditingUser(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Edit user">
            <div className="modal-header">
              <h2 className="modal-title">Edit User: {editingUser.name}</h2>
              <button className="modal-close" onClick={() => setEditingUser(null)}>✕</button>
            </div>
            <form className="modal-form" onSubmit={handleUserEditSave}>
              <div className="modal-field">
                <label className="modal-label">Name</label>
                <input className="modal-input" value={editingUser.name} disabled />
              </div>
              <div className="modal-field">
                <label className="modal-label">Email</label>
                <input className="modal-input" value={editingUser.email} disabled />
              </div>
              <div className="modal-field">
                <label className="modal-label">Role</label>
                <select className="modal-input" value={userEditRole} onChange={(e) => setUserEditRole(e.target.value)}>
                  <option value="User">User</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
              <div className="modal-field">
                <label className="modal-label">Account Status</label>
                <select className="modal-input" value={userEditActive ? "active" : "inactive"} onChange={(e) => setUserEditActive(e.target.value === "active")}>
                  <option value="active">Active</option>
                  <option value="inactive">Deactivated</option>
                </select>
              </div>
              {userEditError && <p className="modal-error">{userEditError}</p>}
              <div className="modal-actions">
                <button type="button" className="modal-btn modal-btn--cancel" onClick={() => setEditingUser(null)}>Cancel</button>
                <button type="submit" className="modal-btn modal-btn--save" disabled={userEditSaving}>{userEditSaving ? "Saving…" : "Save Changes"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══ Profile Modal ════════════════════════════════════════════════════ */}
      {showProfile && user && (
        <UserProfile
          user={user}
          token={token}
          onClose={() => setShowProfile(false)}
          onUserUpdate={onUserUpdate}
        />
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function RecentTasksTable({ tasks, formatDate }) {
  if (!tasks.length) return <EmptyState icon="📋" title="No tasks yet" sub="Assigned tasks appear here." />;
  return (
    <div className="admin-table-wrapper">
      <table className="admin-table">
        <thead>
          <tr><th>Task</th><th>Assigned To</th><th>Priority</th><th>Status</th><th>Due</th></tr>
        </thead>
        <tbody>
          {tasks.map((t) => (
            <tr key={t._id}>
              <td className="admin-name-cell">{t.title}</td>
              <td>{typeof t.userId === "object" ? t.userId?.name : "—"}</td>
              <td><span className={`admin-priority-badge priority-${(t.priority || "medium").toLowerCase()}`}>{t.priority || "Medium"}</span></td>
              <td><span className={`admin-status-badge status-${(t.status || "pending").toLowerCase().replace(/\s+/g, "-")}`}>{t.status}</span></td>
              <td>{formatDate(t.dueDate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EmptyState({ icon, title, sub }) {
  return (
    <div className="admin-empty-state">
      <div className="admin-empty-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{sub}</p>
    </div>
  );
}

function Pagination({ page, totalPages, onPrev, onNext, onPage }) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter((n) => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
    .reduce((acc, n, idx, arr) => {
      if (idx > 0 && n - arr[idx - 1] > 1) acc.push("…");
      acc.push(n);
      return acc;
    }, []);

  return (
    <div className="admin-pagination">
      <button className="admin-page-btn" disabled={page <= 1} onClick={onPrev}>← Prev</button>
      {pages.map((n, i) =>
        n === "…" ? (
          <span key={`e${i}`} className="admin-page-ellipsis">…</span>
        ) : (
          <button
            key={n}
            className={`admin-page-btn ${n === page ? "admin-page-btn--active" : ""}`}
            onClick={() => onPage(n)}
          >
            {n}
          </button>
        )
      )}
      <button className="admin-page-btn" disabled={page >= totalPages} onClick={onNext}>Next →</button>
    </div>
  );
}

// ─── Pie Chart ────────────────────────────────────────────────────────────────
function PieChart({ data, colors }) {
  const entries = Object.entries(data);
  const total = entries.reduce((sum, [, val]) => sum + val, 0);
  if (total === 0) return <div className="admin-empty-state"><p>No data</p></div>;

  let offset = 0;
  const slices = entries.map(([label, value]) => {
    const percent = (value / total) * 100;
    const startAngle = (offset / total) * 360;
    const endAngle = ((offset + value) / total) * 360;
    offset += value;
    return { label, value, percent, startAngle, endAngle, color: colors[label] || "#94a3b8" };
  });

  const radius = 60;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="admin-pie-container">
      <svg className="admin-pie-chart" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={radius} fill="none" stroke="var(--admin-border)" strokeWidth="20" />
        {slices.map((s) => {
          const dashLength = (s.value / total) * circumference;
          const dashOffset = -((s.startAngle / 360) * circumference);
          return (
            <circle
              key={s.label}
              cx="70" cy="70" r={radius}
              fill="none"
              stroke={s.color}
              strokeWidth="20"
              strokeDasharray={`${dashLength} ${circumference - dashLength}`}
              strokeDashoffset={dashOffset}
              transform="rotate(-90 70 70)"
            />
          );
        })}
        <text x="70" y="65" textAnchor="middle" fontSize="20" fontWeight="800" fill="var(--admin-text)">{total}</text>
        <text x="70" y="85" textAnchor="middle" fontSize="10" fill="var(--admin-text-muted)">Total</text>
      </svg>
      <div className="admin-pie-legend">
        {slices.map((s) => (
          <div key={s.label} className="admin-legend-item">
            <span className="admin-legend-dot" style={{ background: s.color }} />
            <span className="admin-legend-label">{s.label}</span>
            <span className="admin-legend-value">{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Bar Chart ────────────────────────────────────────────────────────────────
function BarChart({ data, colors }) {
  const entries = Object.entries(data);
  const max = Math.max(...entries.map(([, v]) => v), 1);

  if (entries.length === 0) return <div className="admin-empty-state"><p>No data</p></div>;

  return (
    <div className="admin-bar-chart">
      {entries.map(([label, value]) => (
        <div key={label} className="admin-bar-item">
          <div
            className="admin-bar-fill"
            style={{
              height: `${(value / max) * 100}%`,
              background: colors[label] || "#94a3b8",
            }}
          />
          <span className="admin-bar-value">{value}</span>
          <span className="admin-bar-label">{label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Line Chart ───────────────────────────────────────────────────────────────
function LineChart({ data }) {
  if (data.length === 0) return <div className="admin-empty-state"><p>No data</p></div>;

  const max = Math.max(...data.map((d) => d.count), 1);
  const width = 600;
  const height = 140;
  const padding = 20;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const points = data.map((d, i) => {
    const x = padding + (i / (data.length - 1)) * chartWidth;
    const y = padding + chartHeight - (d.count / max) * chartHeight;
    return { x, y, ...d };
  });

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  return (
    <div className="admin-line-chart">
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <line x1={padding} y1={padding + chartHeight} x2={width - padding} y2={padding + chartHeight} stroke="var(--admin-border)" strokeWidth="1" />
        <path d={pathD} fill="none" stroke="var(--admin-primary)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p) => (
          <g key={p.date}>
            <circle cx={p.x} cy={p.y} r="4" fill="var(--admin-primary)" />
            <text x={p.x} y={height - 2} textAnchor="middle" fontSize="10" fill="var(--admin-text-muted)">{p.date}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

// ─── Calendar View ────────────────────────────────────────────────────────────
function CalendarView({ tasks, date, onDateChange }) {
  const year = date.getFullYear();
  const month = date.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDate = new Date(year, month, 1 - firstDay.getDay());
  const endDate = new Date(year, month, lastDay.getDate() + (6 - lastDay.getDay()));

  const days = [];
  const current = new Date(startDate);
  while (current <= endDate) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  const today = new Date();
  const isToday = (d) =>
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear();

  const tasksByDate = {};
  tasks.forEach((t) => {
    if (t.dueDate) {
      const dateStr = t.dueDate.slice(0, 10);
      if (!tasksByDate[dateStr]) tasksByDate[dateStr] = [];
      tasksByDate[dateStr].push(t);
    }
  });

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const navigate = (offset) => {
    onDateChange(new Date(year, month + offset, 1));
  };

  return (
    <div>
      <div className="admin-calendar-header">
        <div className="admin-calendar-title">
          {monthNames[month]} {year}
        </div>
        <div className="admin-calendar-nav">
          <button className="admin-calendar-nav-btn" onClick={() => navigate(-1)}>◀</button>
          <button className="admin-calendar-nav-btn" onClick={() => onDateChange(new Date())}>Today</button>
          <button className="admin-calendar-nav-btn" onClick={() => navigate(1)}>▶</button>
        </div>
      </div>
      <div className="admin-calendar-grid">
        {dayNames.map((d) => (
          <div key={d} className="admin-calendar-day-header">{d}</div>
        ))}
        {days.map((day) => {
          const dateStr = day.toISOString().slice(0, 10);
          const dayTasks = tasksByDate[dateStr] || [];
          const isOtherMonth = day.getMonth() !== month;

          return (
            <div
              key={dateStr}
              className={`admin-calendar-day ${isOtherMonth ? "admin-calendar-day--other-month" : ""} ${isToday(day) ? "admin-calendar-day--today" : ""}`}
            >
              <div className="admin-calendar-day-number">{day.getDate()}</div>
              {dayTasks.slice(0, 3).map((t) => (
                <div
                  key={t._id}
                  className={`admin-calendar-task admin-calendar-task--${t.status?.toLowerCase().replace(/\s+/g, "-") || "pending"}`}
                  title={t.title}
                >
                  {t.title}
                </div>
              ))}
              {dayTasks.length > 3 && (
                <div className="admin-calendar-task" style={{ fontSize: 9, color: "var(--admin-text-muted)" }}>
                  +{dayTasks.length - 3} more
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Activity List ────────────────────────────────────────────────────────────
function ActivityList({ tasks, users }) {
  const activities = [];

  tasks.forEach((t) => {
    activities.push({
      type: "task_created",
      icon: "📋",
      text: <><strong>{t.title}</strong> was created</>,
      time: t.createdAt,
      color: "#3b82f6",
    });
    if (t.updatedAt && t.updatedAt !== t.createdAt) {
      activities.push({
        type: "task_updated",
        icon: "✏️",
        text: <><strong>{t.title}</strong> was updated</>,
        time: t.updatedAt,
        color: "#f59e0b",
      });
    }
    if (t.status === "Done") {
      activities.push({
        type: "task_completed",
        icon: "✅",
        text: <><strong>{t.title}</strong> was completed</>,
        time: t.updatedAt || t.createdAt,
        color: "#22c55e",
      });
    }
  });

  users.forEach((u) => {
    activities.push({
      type: "user_registered",
      icon: "👤",
      text: <><strong>{u.name}</strong> registered</>,
      time: u.createdAt,
      color: "#a855f7",
    });
  });

  activities.sort((a, b) => new Date(b.time) - new Date(a.time));
  const recent = activities.slice(0, 30);

  if (recent.length === 0) {
    return <EmptyState icon="📝" title="No activity yet" sub="Activity will appear as users and tasks are created." />;
  }

  return (
    <div>
      {recent.map((a, i) => (
        <div key={i} className="admin-activity-item">
          <div className="admin-activity-icon" style={{ background: `${a.color}20`, color: a.color }}>
            {a.icon}
          </div>
          <div className="admin-activity-content">
            <div className="admin-activity-text">{a.text}</div>
            <div className="admin-activity-time">{formatDateTime(a.time)}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default AdminDashboard;
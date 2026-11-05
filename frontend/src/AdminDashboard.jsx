import { useCallback, useEffect, useRef, useState } from "react";
import UserProfile from "./pages/UserProfile";
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

// ─── Small helpers ────────────────────────────────────────────────────────────
function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function AdminDashboard({ token, user, onLogout, onUserUpdate }) {
  // ── data ────────────────────────────────────────────────────────────────────
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

  // ── assign form ─────────────────────────────────────────────────────────────
  const [assignForm, setAssignForm] = useState(initialTaskForm);
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState("");
  const [assignSuccess, setAssignSuccess] = useState("");

  // ── task edit modal ─────────────────────────────────────────────────────────
  const [editingTask, setEditingTask] = useState(null);
  const [editForm, setEditForm] = useState(initialEditForm);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");

  // ── user edit modal ─────────────────────────────────────────────────────────
  const [editingUser, setEditingUser] = useState(null);
  const [userEditRole, setUserEditRole] = useState("User");
  const [userEditActive, setUserEditActive] = useState(true);
  const [userEditSaving, setUserEditSaving] = useState(false);
  const [userEditError, setUserEditError] = useState("");

  // ── profile modal ────────────────────────────────────────────────────────────
  const [showProfile, setShowProfile] = useState(false);

  // ── active tab ───────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState("overview"); // overview | assign | tasks | users

  const userSearchTimer = useRef(null);
  const taskSearchTimer = useRef(null);

  // ── fetch functions ──────────────────────────────────────────────────────────
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

  // ── assign task ──────────────────────────────────────────────────────────────
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

  // ── task edit ────────────────────────────────────────────────────────────────
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
    } catch (err) {
      alert(err.message || "Could not delete task");
    }
  };

  // ── user management ──────────────────────────────────────────────────────────
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
    } catch (err) {
      alert(err.message || "Could not delete user");
    }
  };

  // ── search debounce ─────────────────────────────────────────────────────────
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

  // ── filter helpers ───────────────────────────────────────────────────────────
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

  // ── derived stats ────────────────────────────────────────────────────────────
  const completedCount = tasks.filter((t) => t.status === "Done").length;
  const pendingCount = tasks.filter((t) => t.status === "Pending").length;
  const inProgressCount = tasks.filter((t) => t.status === "In Progress").length;

  // ── loading / error ──────────────────────────────────────────────────────────
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

  return (
    <div className="admin-root">
      {/* ── Topbar ── */}
      <header className="admin-topbar">
        <div className="admin-brand">
          <span className="admin-brand-icon">✓</span>
          <span className="admin-brand-name">Task Management System</span>
          <span className="admin-brand-tag">Admin</span>
        </div>
        <div className="admin-topbar-right">
          <button
            className="admin-avatar-btn"
            onClick={() => setShowProfile(true)}
            title="My Profile"
          >
            <span className="admin-avatar">{(user?.name || "A")[0].toUpperCase()}</span>
            <span className="admin-username">{user?.name}</span>
          </button>
          <button className="admin-logout-button" onClick={onLogout}>Logout</button>
        </div>
      </header>

      {/* ── Tab nav ── */}
      <nav className="admin-tabs">
        {[
          { key: "overview", label: "Overview" },
          { key: "assign",   label: "Assign Task" },
          { key: "tasks",    label: `Tasks (${tasksTotal})` },
          { key: "users",    label: `Users (${usersTotal})` },
        ].map((tab) => (
          <button
            key={tab.key}
            className={`admin-tab ${activeTab === tab.key ? "admin-tab--active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <main className="admin-main">

        {/* ══ OVERVIEW ══════════════════════════════════════════════════════════ */}
        {activeTab === "overview" && (
          <div className="admin-overview">
            <div className="admin-summary">
              {[
                { icon: "👥", label: "Registered Users", value: usersTotal, cls: "users-icon" },
                { icon: "📋", label: "Total Tasks",       value: tasksTotal, cls: "tasks-icon" },
                { icon: "✅", label: "Completed",         value: completedCount, cls: "completed-icon" },
                { icon: "⏳", label: "Pending",           value: pendingCount, cls: "pending-icon" },
                { icon: "🔄", label: "In Progress",       value: inProgressCount, cls: "progress-icon" },
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

            {tasks.length === 0 ? (
              <EmptyState icon="📋" title="No tasks found" sub="Try adjusting your filters." />
            ) : (
              <>
                <div className="admin-table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
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

            {users.length === 0 ? (
              <EmptyState icon="👥" title="No users found" sub="Registered accounts will appear here." />
            ) : (
              <>
                <div className="admin-table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
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
      </main>

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

export default AdminDashboard;

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import AdminDashboard from "./AdminDashboard";
import UserProfile from "./pages/UserProfile";

import { useCallback, useEffect, useRef, useState } from "react";
import "./App.css";

const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV
    ? "http://localhost:5000/api"
    : "https://task-management-system-v5mx.onrender.com/api");

const ITEMS_PER_PAGE = 6;
const STATUS_OPTIONS = ["Pending", "In Progress", "Done", "On Hold"];
const PRIORITY_OPTIONS = ["Low", "Medium", "High"];
const initialTaskForm = { title: "", description: "", status: "Pending", priority: "Medium", dueDate: "" };

// ─── Badge helpers ────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = { Pending: "badge--pending", "In Progress": "badge--progress", Done: "badge--done", "On Hold": "badge--hold" };
  return <span className={`badge ${map[status] || "badge--pending"}`}>{status}</span>;
}
function PriorityBadge({ priority }) {
  const map = { Low: "badge--low", Medium: "badge--medium", High: "badge--high" };
  return <span className={`badge ${map[priority] || "badge--medium"}`}>{priority}</span>;
}
function formatDate(d) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
function isOverdue(dueDate, status) {
  if (!dueDate || status === "Done") return false;
  return new Date(dueDate) < new Date();
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  // auth
  const [token, setToken] = useState(() => localStorage.getItem("token") || "");
  const [user, setUser] = useState(() => { try { return JSON.parse(localStorage.getItem("user")); } catch { return null; } });

  const [route, setRoute] = useState(() => {
    const m = window.location.pathname.match(/^\/reset-password\/(.+)$/);
    return m ? `reset/${m[1]}` : "login";
  });
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // tasks
  const [tasks, setTasks] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");

  // filters
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [page, setPage] = useState(1);
  const searchTimer = useRef(null);

  // task form
  const [showForm, setShowForm] = useState(false);
  const [taskForm, setTaskForm] = useState(initialTaskForm);
  const [formError, setFormError] = useState("");
  const [formSaving, setFormSaving] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  // sidebar / nav
  const [activeSection, setActiveSection] = useState("tasks"); // tasks | profile
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // profile modal
  const [showProfile, setShowProfile] = useState(false);

  // ── auth ──────────────────────────────────────────────────────────────────
  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError("");
    setAuthLoading(true);
    const isSignup = route === "signup";
    const body = isSignup
      ? { name: authName.trim(), email: authEmail.trim(), password: authPassword }
      : { email: authEmail.trim(), password: authPassword };
    try {
      const res = await fetch(`${API_URL}/auth/${isSignup ? "signup" : "login"}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Authentication failed");
      if (isSignup) {
        setRoute("login"); setAuthName(""); setAuthPassword("");
        setAuthError("Account created! Please log in."); return;
      }
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setToken(data.token); setUser(data.user); setAuthPassword("");
    } catch (err) { setAuthError(err.message || "Could not connect."); }
    finally { setAuthLoading(false); }
  };

  const handleLogout = () => {
    localStorage.removeItem("token"); localStorage.removeItem("user");
    setToken(""); setUser(null); setTasks([]); setEditingTask(null);
    setFetchError(""); setRoute("login"); setSidebarOpen(false);
  };

  // ── fetch tasks ───────────────────────────────────────────────────────────
  const fetchTasks = useCallback(async (opts = {}) => {
    if (!token) return;
    setLoading(true); setFetchError("");
    const params = new URLSearchParams({
      search: opts.search ?? search, status: opts.status ?? filterStatus,
      priority: opts.priority ?? filterPriority, sortBy: opts.sortBy ?? sortBy,
      sortOrder: opts.sortOrder ?? sortOrder, page: String(opts.page ?? page),
      limit: String(ITEMS_PER_PAGE),
    });
    try {
      const res = await fetch(`${API_URL}/tasks?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.status === 401 || res.status === 403) { handleLogout(); return; }
      if (!res.ok) throw new Error(data.message || "Failed to fetch tasks");
      setTasks(data.tasks || []); setTotal(data.total || 0); setTotalPages(data.totalPages || 1);
    } catch (err) { setFetchError(err.message || "Could not load tasks."); }
    finally { setLoading(false); }
  }, [token, search, filterStatus, filterPriority, sortBy, sortOrder, page]);

  useEffect(() => {
    if (token && user?.role === "User") (async () => { await fetchTasks(); })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user?.role]);

  // ── search debounce ───────────────────────────────────────────────────────
  const handleSearchChange = (val) => {
    setSearch(val); setPage(1);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => fetchTasks({ search: val, page: 1 }), 400);
  };

  const handleFilterChange = (key, val) => {
    const next = { search, status: filterStatus, priority: filterPriority, sortBy, sortOrder, page: 1 };
    next[key] = val;
    if (key === "status") setFilterStatus(val);
    if (key === "priority") setFilterPriority(val);
    if (key === "sortBy") setSortBy(val);
    if (key === "sortOrder") setSortOrder(val);
    setPage(1); fetchTasks({ ...next, page: 1 });
  };

  // ── task CRUD ─────────────────────────────────────────────────────────────
  const openCreateForm = () => { setEditingTask(null); setTaskForm(initialTaskForm); setFormError(""); setShowForm(true); };
  const openEditForm = (task) => {
    setEditingTask(task);
    setTaskForm({ title: task.title, description: task.description || "", status: task.status, priority: task.priority || "Medium", dueDate: task.dueDate ? task.dueDate.slice(0, 10) : "" });
    setFormError(""); setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditingTask(null); };

  const handleSaveTask = async (e) => {
    e.preventDefault(); setFormError("");
    if (!taskForm.title.trim()) { setFormError("Task title is required"); return; }
    setFormSaving(true);
    try {
      const url = editingTask ? `${API_URL}/tasks/${editingTask._id}` : `${API_URL}/tasks`;
      const res = await fetch(url, {
        method: editingTask ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: taskForm.title.trim(), description: taskForm.description, status: taskForm.status, priority: taskForm.priority, dueDate: taskForm.dueDate || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to save task");
      closeForm(); fetchTasks();
    } catch (err) { setFormError(err.message || "Could not save task"); }
    finally { setFormSaving(false); }
  };

  const handleDelete = async (taskId) => {
    if (!window.confirm("Delete this task? This cannot be undone.")) return;
    try {
      const res = await fetch(`${API_URL}/tasks/${taskId}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to delete task");
      fetchTasks();
    } catch (err) { alert(err.message || "Could not delete task"); }
  };

  const handleUserUpdate = (u) => {
    const merged = { ...user, ...u };
    setUser(merged); localStorage.setItem("user", JSON.stringify(merged));
  };

  // ── nav helpers ───────────────────────────────────────────────────────────
  const navTo = (section) => { setActiveSection(section); setSidebarOpen(false); if (section === "profile") setShowProfile(true); };

  // ══════════════════════════════════════════════════════════════════════════
  // AUTH SCREENS
  // ══════════════════════════════════════════════════════════════════════════
  if (!token || !user) {
    const resetMatch = route.match(/^reset\/(.+)$/);
    if (resetMatch) return (
      <div className="auth-page">
        <div className="auth-brand"><span className="auth-brand-icon">✓</span> Task Management System</div>
        <ResetPassword token={resetMatch[1]} onSuccess={() => { window.history.pushState({}, "", "/"); setRoute("login"); }} />
      </div>
    );
    if (route === "forgot") return (
      <div className="auth-page">
        <div className="auth-brand"><span className="auth-brand-icon">✓</span> Task Management System</div>
        <ForgotPassword onBack={() => setRoute("login")} />
      </div>
    );
    return (
      <div className="auth-page">
        <div className="auth-brand"><span className="auth-brand-icon">✓</span> Task Management System</div>
        {route === "login" ? (
          <div className="auth-card">
            <h2 className="auth-title">Welcome back</h2>
            <p className="auth-subtitle">Sign in to your account</p>
            <Login email={authEmail} setEmail={setAuthEmail} password={authPassword} setPassword={setAuthPassword}
              onSubmit={handleAuth} loading={authLoading} error={authError}
              onSwitchToSignup={() => { setRoute("signup"); setAuthError(""); setAuthPassword(""); }}
              onForgotPassword={() => { setRoute("forgot"); setAuthError(""); }} />
          </div>
        ) : (
          <div className="auth-card">
            <h2 className="auth-title">Create account</h2>
            <p className="auth-subtitle">Join Task Management System today</p>
            <Signup name={authName} setName={setAuthName} email={authEmail} setEmail={setAuthEmail}
              password={authPassword} setPassword={setAuthPassword} onSubmit={handleAuth}
              loading={authLoading} error={authError}
              onSwitchToLogin={() => { setRoute("login"); setAuthError(""); setAuthPassword(""); }} />
          </div>
        )}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ADMIN
  // ══════════════════════════════════════════════════════════════════════════
  if (user.role === "Admin") return (
    <AdminDashboard token={token} user={user} onLogout={handleLogout} onUserUpdate={handleUserUpdate} />
  );

  // ══════════════════════════════════════════════════════════════════════════
  // USER DASHBOARD
  // ══════════════════════════════════════════════════════════════════════════
  const overdueCount = tasks.filter((t) => isOverdue(t.dueDate, t.status)).length;

  const NAV_ITEMS = [
    { key: "tasks",   icon: "📋", label: "My Tasks" },
    { key: "profile", icon: "👤", label: "Profile" },
  ];

  return (
    <div className="ud-shell">

      {/* ── Sidebar ── */}
      <aside className={`ud-sidebar ${sidebarOpen ? "ud-sidebar--open" : ""}`} aria-label="Sidebar navigation">
        <div className="ud-sidebar-brand">
          <span className="ud-brand-icon">✓</span>
          <span className="ud-brand-name">Task Manager</span>
        </div>

        <nav className="ud-sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              className={`ud-nav-item ${activeSection === item.key ? "ud-nav-item--active" : ""}`}
              onClick={() => navTo(item.key)}
            >
              <span className="ud-nav-icon">{item.icon}</span>
              <span className="ud-nav-label">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="ud-sidebar-footer">
          <div className="ud-sidebar-user">
            <span className="ud-avatar">{(user.name || "U")[0].toUpperCase()}</span>
            <div className="ud-sidebar-user-info">
              <span className="ud-sidebar-user-name">{user.name}</span>
              <span className="ud-sidebar-user-role">{user.role}</span>
            </div>
          </div>
          <button className="ud-sidebar-logout" onClick={handleLogout} title="Logout">⏻</button>
        </div>
      </aside>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && <div className="ud-sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* ── Main area ── */}
      <div className="ud-layout">
        {/* Topbar (mobile only) */}
        <header className="ud-topbar">
          <button className="ud-hamburger" onClick={() => setSidebarOpen(true)} aria-label="Open menu">☰</button>
          <div className="ud-topbar-brand">
            <span className="ud-brand-icon">✓</span>
            <span className="ud-brand-name">Task Manager</span>
          </div>
          <button className="ud-avatar-btn" onClick={() => setShowProfile(true)} title="My Profile">
            <span className="ud-avatar">{(user.name || "U")[0].toUpperCase()}</span>
          </button>
        </header>

        {/* ── Page: My Tasks ── */}
        {activeSection === "tasks" && (
          <main className="ud-main">
            <div className="ud-page-header">
              <div>
                <h1 className="ud-page-title">My Tasks</h1>
                <p className="ud-page-sub">
                  {total} task{total !== 1 ? "s" : ""}
                  {overdueCount > 0 && <span className="ud-overdue-badge"> · {overdueCount} overdue</span>}
                </p>
              </div>
              <button className="ud-create-btn" onClick={openCreateForm}>+ New Task</button>
            </div>

            {/* Filters */}
            <div className="ud-filters">
              <input className="ud-search" type="search" placeholder="Search tasks…"
                value={search} onChange={(e) => handleSearchChange(e.target.value)} />
              <select className="ud-filter-select" value={filterStatus}
                onChange={(e) => handleFilterChange("status", e.target.value)}>
                <option value="">All Statuses</option>
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <select className="ud-filter-select" value={filterPriority}
                onChange={(e) => handleFilterChange("priority", e.target.value)}>
                <option value="">All Priorities</option>
                {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
              <select className="ud-filter-select" value={`${sortBy}:${sortOrder}`}
                onChange={(e) => {
                  const [sb, so] = e.target.value.split(":");
                  setSortBy(sb); setSortOrder(so);
                  fetchTasks({ sortBy: sb, sortOrder: so, page: 1 });
                }}>
                <option value="createdAt:desc">Newest first</option>
                <option value="createdAt:asc">Oldest first</option>
                <option value="dueDate:asc">Due date (soon)</option>
                <option value="dueDate:desc">Due date (late)</option>
                <option value="priority:desc">Priority (high→low)</option>
                <option value="priority:asc">Priority (low→high)</option>
                <option value="title:asc">Title A→Z</option>
                <option value="title:desc">Title Z→A</option>
              </select>
            </div>

            {/* Task list */}
            {loading ? (
              <div className="ud-center-state"><div className="ud-spinner" /><p>Loading tasks…</p></div>
            ) : fetchError ? (
              <div className="ud-center-state">
                <p className="ud-error-text" role="alert">{fetchError}</p>
                <button className="ud-retry-btn" onClick={() => fetchTasks()}>Retry</button>
              </div>
            ) : tasks.length === 0 ? (
              <div className="ud-center-state">
                <div className="ud-empty-icon">📋</div>
                <h3 className="ud-empty-title">{search || filterStatus || filterPriority ? "No tasks match your filters" : "No tasks yet"}</h3>
                <p className="ud-empty-sub">{search || filterStatus || filterPriority ? "Try adjusting your search or filters." : "Create your first task to get started."}</p>
                {!search && !filterStatus && !filterPriority && <button className="ud-create-btn" onClick={openCreateForm}>+ New Task</button>}
              </div>
            ) : (
              <>
                <div className="ud-task-grid">
                  {tasks.map((task) => {
                    const overdue = isOverdue(task.dueDate, task.status);
                    return (
                      <article key={task._id} className={`ud-task-card ${overdue ? "ud-task-card--overdue" : ""}`}>
                        <div className="ud-task-card-top">
                          <div className="ud-task-badges">
                            <StatusBadge status={task.status} />
                            <PriorityBadge priority={task.priority || "Medium"} />
                            {overdue && <span className="badge badge--overdue">Overdue</span>}
                          </div>
                          <div className="ud-task-actions">
                            <button className="ud-icon-btn ud-icon-btn--edit" onClick={() => openEditForm(task)} title="Edit" aria-label="Edit task">✏️</button>
                            <button className="ud-icon-btn ud-icon-btn--delete" onClick={() => handleDelete(task._id)} title="Delete" aria-label="Delete task">🗑️</button>
                          </div>
                        </div>
                        <h3 className="ud-task-title">{task.title}</h3>
                        {task.description && <p className="ud-task-desc">{task.description}</p>}
                        <div className="ud-task-meta">
                          {task.dueDate && <span className={`ud-meta-item ${overdue ? "ud-meta-item--overdue" : ""}`}>📅 Due {formatDate(task.dueDate)}</span>}
                          {task.assignedBy?.name && <span className="ud-meta-item">👤 Assigned by {task.assignedBy.name}</span>}
                          <span className="ud-meta-item ud-meta-item--muted">Created {formatDate(task.createdAt)}</span>
                        </div>
                      </article>
                    );
                  })}
                </div>

                {totalPages > 1 && (
                  <div className="ud-pagination">
                    <button className="ud-page-btn" disabled={page <= 1} onClick={() => { const p = page - 1; setPage(p); fetchTasks({ page: p }); }}>← Prev</button>
                    <div className="ud-page-numbers">
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter((n) => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
                        .reduce((acc, n, idx, arr) => { if (idx > 0 && n - arr[idx - 1] > 1) acc.push("…"); acc.push(n); return acc; }, [])
                        .map((n, i) => n === "…"
                          ? <span key={`e${i}`} className="ud-page-ellipsis">…</span>
                          : <button key={n} className={`ud-page-btn ud-page-btn--num ${n === page ? "ud-page-btn--active" : ""}`} onClick={() => { setPage(n); fetchTasks({ page: n }); }}>{n}</button>
                        )}
                    </div>
                    <button className="ud-page-btn" disabled={page >= totalPages} onClick={() => { const p = page + 1; setPage(p); fetchTasks({ page: p }); }}>Next →</button>
                  </div>
                )}
              </>
            )}
          </main>
        )}
      </div>

      {/* ── Task Form Modal ── */}
      {showForm && (
        <div className="modal-overlay" onClick={closeForm}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={editingTask ? "Edit task" : "New task"}>
            <div className="modal-header">
              <h2 className="modal-title">{editingTask ? "Edit Task" : "New Task"}</h2>
              <button className="modal-close" onClick={closeForm} aria-label="Close">✕</button>
            </div>
            <form onSubmit={handleSaveTask} className="modal-form">
              <div className="modal-field">
                <label className="modal-label">Task Title *</label>
                <input className="modal-input" name="title" type="text" placeholder="Enter task title"
                  value={taskForm.title} onChange={(e) => setTaskForm(p => ({ ...p, title: e.target.value }))} maxLength={150} required />
              </div>
              <div className="modal-field">
                <label className="modal-label">Description</label>
                <textarea className="modal-input modal-textarea" name="description" placeholder="Optional description"
                  value={taskForm.description} onChange={(e) => setTaskForm(p => ({ ...p, description: e.target.value }))} rows={3} maxLength={2000} />
              </div>
              <div className="modal-row">
                <div className="modal-field">
                  <label className="modal-label">Status</label>
                  <select className="modal-input" value={taskForm.status} onChange={(e) => setTaskForm(p => ({ ...p, status: e.target.value }))}>
                    {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="modal-field">
                  <label className="modal-label">Priority</label>
                  <select className="modal-input" value={taskForm.priority} onChange={(e) => setTaskForm(p => ({ ...p, priority: e.target.value }))}>
                    {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div className="modal-field">
                <label className="modal-label">Due Date</label>
                <input className="modal-input" name="dueDate" type="date"
                  value={taskForm.dueDate} onChange={(e) => setTaskForm(p => ({ ...p, dueDate: e.target.value }))} />
              </div>
              {formError && <p className="modal-error" role="alert">{formError}</p>}
              <div className="modal-actions">
                <button type="button" className="modal-btn modal-btn--cancel" onClick={closeForm}>Cancel</button>
                <button type="submit" className="modal-btn modal-btn--save" disabled={formSaving}>
                  {formSaving ? "Saving…" : editingTask ? "Save Changes" : "Create Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Profile Modal ── */}
      {showProfile && (
        <UserProfile user={user} token={token} onClose={() => { setShowProfile(false); setActiveSection("tasks"); }} onUserUpdate={handleUserUpdate} />
      )}
    </div>
  );
}

import { useCallback, useEffect, useState } from "react";
import "./Reports.css";

const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV
    ? "http://localhost:5000/api"
    : "https://task-management-system-v5mx.onrender.com/api");

// ─── Colour maps ──────────────────────────────────────────────────────────────
const STATUS_COLORS = {
  Pending: "#f97316",
  "In Progress": "#3b82f6",
  Done: "#22c55e",
  "On Hold": "#a855f7",
};
const PRIORITY_COLORS = { Low: "#22c55e", Medium: "#f59e0b", High: "#ef4444" };

// ─── Pure-CSS donut chart ─────────────────────────────────────────────────────
function buildSegments(data, total) {
  let off = 25;
  return data.map((d) => {
    const pct = (d.value / total) * 100;
    const seg = { ...d, pct, offset: off };
    off += pct;
    return seg;
  });
}

function DonutChart({ data, colors, title }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (!total) return <div className="rp-chart-empty">No data</div>;

  const segments = buildSegments(data, total);

  const gradientStops = segments
    .map((s) => `${colors[s.label] || "#94a3b8"} ${s.offset}% ${s.offset + s.pct}%`)
    .join(", ");

  return (
    <div className="rp-donut-wrap">
      <div className="rp-donut-title">{title}</div>
      <div className="rp-donut-row">
        <div
          className="rp-donut"
          style={{ background: `conic-gradient(${gradientStops})` }}
          aria-label={title}
        >
          <div className="rp-donut-hole">
            <span className="rp-donut-total">{total}</span>
            <span className="rp-donut-sub">total</span>
          </div>
        </div>
        <ul className="rp-legend">
          {segments.map((s) => (
            <li key={s.label} className="rp-legend-item">
              <span className="rp-legend-dot" style={{ background: colors[s.label] || "#94a3b8" }} />
              <span className="rp-legend-label">{s.label}</span>
              <span className="rp-legend-val">{s.value}</span>
              <span className="rp-legend-pct">({Math.round(s.pct)}%)</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ─── Bar chart ────────────────────────────────────────────────────────────────
function BarChart({ data, title, color = "#3b82f6" }) {
  if (!data || !data.length) return <div className="rp-chart-empty">No data</div>;
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="rp-bar-wrap">
      <div className="rp-donut-title">{title}</div>
      <div className="rp-bar-chart">
        {data.map((d) => (
          <div key={d.label} className="rp-bar-col">
            <div className="rp-bar-track">
              <div
                className="rp-bar-fill"
                style={{ height: `${(d.count / max) * 100}%`, background: color }}
                title={`${d.label}: ${d.count}`}
              />
            </div>
            <span className="rp-bar-val">{d.count}</span>
            <span className="rp-bar-label">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, accent }) {
  return (
    <div className="rp-stat-card" style={{ "--accent": accent }}>
      <span className="rp-stat-icon">{icon}</span>
      <div>
        <div className="rp-stat-value">{value}</div>
        <div className="rp-stat-label">{label}</div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function Reports({ token, role }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const endpoint = role === "Admin" ? "/reports/admin" : "/reports/user";

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to load report");
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, endpoint]);

  useEffect(() => {
    (async () => { await fetchReport(); })();
  }, [fetchReport]);

  if (loading) return (
    <div className="rp-state">
      <div className="rp-spinner" />
      <p>Loading report…</p>
    </div>
  );

  if (error) return (
    <div className="rp-state">
      <p className="rp-error">{error}</p>
      <button className="rp-retry" onClick={fetchReport}>Retry</button>
    </div>
  );

  if (!data) return null;

  // ── Build chart data ──────────────────────────────────────────────────────
  const statusData = Object.entries(data.byStatus || {}).map(([label, value]) => ({ label, value }));
  const priorityData = Object.entries(data.byPriority || {}).map(([label, value]) => ({ label, value }));

  // ── Admin-specific ────────────────────────────────────────────────────────
  if (role === "Admin") {
    const completedCount = data.byStatus?.Done || 0;
    const completionRate = data.totalTasks
      ? Math.round((completedCount / data.totalTasks) * 100)
      : 0;

    return (
      <div className="rp-root">
        <div className="rp-page-header">
          <h1 className="rp-title">System Reports</h1>
          <p className="rp-subtitle">Overview of all tasks and users across the platform.</p>
          <button className="rp-refresh" onClick={fetchReport} title="Refresh">↻ Refresh</button>
        </div>

        {/* Stat cards */}
        <div className="rp-stats">
          <StatCard icon="👥" label="Total Users"      value={data.totalUsers}  accent="#6366f1" />
          <StatCard icon="📋" label="Total Tasks"      value={data.totalTasks}  accent="#3b82f6" />
          <StatCard icon="✅" label="Completed"        value={completedCount}   accent="#22c55e" />
          <StatCard icon="⏰" label="Overdue"          value={data.overdue}     accent="#ef4444" />
          <StatCard icon="📈" label="Completion Rate"  value={`${completionRate}%`} accent="#f59e0b" />
        </div>

        {/* Donut charts */}
        <div className="rp-charts-row">
          <div className="rp-chart-card">
            <DonutChart data={statusData} colors={STATUS_COLORS} title="Tasks by Status" />
          </div>
          <div className="rp-chart-card">
            <DonutChart data={priorityData} colors={PRIORITY_COLORS} title="Tasks by Priority" />
          </div>
        </div>

        {/* Bar chart — trend */}
        <div className="rp-chart-card rp-chart-card--wide">
          <BarChart data={data.trend} title="Tasks Created (Last 6 Months)" color="#3b82f6" />
        </div>

        {/* Top users table */}
        {data.topUsers?.length > 0 && (
          <div className="rp-chart-card rp-chart-card--wide">
            <div className="rp-donut-title">Top 5 Users by Task Count</div>
            <div className="rp-table-wrap">
              <table className="rp-table">
                <thead>
                  <tr><th>#</th><th>Name</th><th>Email</th><th>Tasks</th><th>Share</th></tr>
                </thead>
                <tbody>
                  {data.topUsers.map((u, i) => (
                    <tr key={u.email}>
                      <td className="rp-td-num">{i + 1}</td>
                      <td><strong>{u.name}</strong></td>
                      <td className="rp-td-muted">{u.email}</td>
                      <td><strong>{u.taskCount}</strong></td>
                      <td>
                        <div className="rp-inline-bar">
                          <div
                            className="rp-inline-fill"
                            style={{ width: `${Math.round((u.taskCount / data.totalTasks) * 100)}%` }}
                          />
                          <span>{Math.round((u.taskCount / data.totalTasks) * 100)}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── User report ───────────────────────────────────────────────────────────
  const doneCount = data.byStatus?.Done || 0;
  const completionRate = data.total ? Math.round((doneCount / data.total) * 100) : 0;

  return (
    <div className="rp-root">
      <div className="rp-page-header">
        <h1 className="rp-title">My Reports</h1>
        <p className="rp-subtitle">Your personal task statistics and activity.</p>
        <button className="rp-refresh" onClick={fetchReport} title="Refresh">↻ Refresh</button>
      </div>

      {/* Stat cards */}
      <div className="rp-stats">
        <StatCard icon="📋" label="Total Tasks"         value={data.total}            accent="#3b82f6" />
        <StatCard icon="✅" label="Completed"           value={doneCount}             accent="#22c55e" />
        <StatCard icon="⏰" label="Overdue"             value={data.overdue}          accent="#ef4444" />
        <StatCard icon="🗓️" label="Done This Month"    value={data.completedThisMonth} accent="#6366f1" />
        <StatCard icon="📈" label="Completion Rate"     value={`${completionRate}%`}  accent="#f59e0b" />
      </div>

      {/* Donut charts */}
      <div className="rp-charts-row">
        <div className="rp-chart-card">
          <DonutChart data={statusData} colors={STATUS_COLORS} title="Tasks by Status" />
        </div>
        <div className="rp-chart-card">
          <DonutChart data={priorityData} colors={PRIORITY_COLORS} title="Tasks by Priority" />
        </div>
      </div>

      {/* Bar chart — trend */}
      <div className="rp-chart-card rp-chart-card--wide">
        <BarChart data={data.trend} title="Tasks Created (Last 6 Months)" color="#6366f1" />
      </div>
    </div>
  );
}

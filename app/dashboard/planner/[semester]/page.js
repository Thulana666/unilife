"use client";
import { useState, use, useEffect } from "react";

// ── SVG Icon Components ───────────────────────────────────────────────────────
function IconEdit() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}
function IconTrash() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}
function IconPlus() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
function IconCheck() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
function IconCalendar() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}
function IconClock() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
function IconClose() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
function IconChevronLeft() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>;
}
function IconChevronRight() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>;
}
function IconAlert() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>;
}

// ── Priority config ───────────────────────────────────────────────────────────
const PRIORITY = {
  High: { color: "#EF4444", bg: "#FEF2F2", border: "#FECACA", label: "High", dot: "#EF4444", tasks: "Exam · Presentation · Viva", icon: "🔴" },
  Medium: { color: "#F59E0B", bg: "#FFFBEB", border: "#FDE68A", label: "Medium", dot: "#F59E0B", tasks: "Kuppi · Lab Test · Quiz", icon: "🟡" },
  Low: { color: "#10B981", bg: "#ECFDF5", border: "#A7F3D0", label: "Low", dot: "#10B981", tasks: "Self Study · Reading · Revision", icon: "🟢" },
};

// ── Relative time helper ──────────────────────────────────────────────────────
function relDate(iso) {
  const d = new Date(iso);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const diff = Math.round((d - today) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  if (diff < 0) return `${Math.abs(diff)}d ago`;
  return `In ${diff}d`;
}

// ── Tab Bar ───────────────────────────────────────────────────────────────────
const TABS = [
  { id: "list", label: "Milestones", icon: "📋" },
  { id: "calendar", label: "Calendar", icon: "📅" },
  { id: "timetable", label: "7-Day View", icon: "🕒" },
];

export default function StudyPlanner({ params }) {
  const resolvedParams = use(params);
  const semester = resolvedParams.semester;

  const semesterLabel = (() => {
    const match = semester?.match(/year(\d+)semester(\d+)/i);
    if (match) return { year: match[1], sem: match[2] };
    return { year: "?", sem: "?" };
  })();

  const [tasks, setTasks] = useState([]);
  const [view, setView] = useState("list");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [toasts, setToasts] = useState([]);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const [formData, setFormData] = useState({
    title: "", subject: "", time: "08:00", priority: "High",
    date: new Date().toISOString().split("T")[0],
  });

  const fetchTasks = async () => {
    try {
      const res = await fetch(`/api/planner?semester=${semester}`);
      const data = await res.json();
      if (Array.isArray(data)) setTasks(data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchTasks(); }, [semester]);

  const showToast = (msg, type = "success") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };
  const dismissToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  const handleToggle = async (id, current) => {
    const newStatus = current === "Completed" ? "Pending" : "Completed";
    await fetch("/api/planner", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: newStatus }),
    });
    fetchTasks();
    showToast(newStatus === "Completed" ? "Task completed! 🎉" : "Task reopened");
  };

  const handleDelete = async (id) => {
    await fetch(`/api/planner?id=${id}`, { method: "DELETE" });
    fetchTasks();
    setDeleteConfirm(null);
    showToast("Task deleted", "error");
  };

  const openCreate = () => {
    setEditingTask(null);
    setFormData({ title: "", subject: "", time: "08:00", priority: "High", date: new Date().toISOString().split("T")[0] });
    setIsModalOpen(true);
  };

  const openEdit = (t) => { setEditingTask(t); setFormData({ ...t }); setIsModalOpen(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dayOfWeek = days[new Date(formData.date).getDay()];
    const payload = { ...formData, semester, day: dayOfWeek };
    if (editingTask) payload.id = editingTask._id;
    const res = await fetch("/api/planner", {
      method: editingTask ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      setIsModalOpen(false); fetchTasks();
      showToast(editingTask ? "Task updated! ✏️" : "Task created! 🚀");
    }
  };

  const completed = tasks.filter(t => t.status === "Completed").length;
  const progress = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;

  // Calendar helpers
  const startDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const monthName = currentDate.toLocaleString("default", { month: "long", year: "numeric" });

  return (
    <div style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif", minHeight: "100vh", background: "#F8FAFC" }}>

      {/* ── Global Styles ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        .planner-btn { transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
        .planner-btn:hover { transform: translateY(-1px); }
        .planner-btn:active { transform: translateY(0); }
        .task-card { transition: all 0.2s ease; border: 1px solid #E2E8F0; }
        .task-card:hover { border-color: #CBD5E1; box-shadow: 0 4px 20px rgba(0,0,0,0.06); transform: translateY(-1px); }
        .action-btn { transition: all 0.15s ease; opacity: 1; }
        .tab-btn { transition: all 0.2s ease; }
        .sidebar-card { transition: all 0.25s cubic-bezier(0.4,0,0.2,1); }
        .sidebar-card:hover { transform: translateY(-3px) scale(1.01); }
        @keyframes slideIn { from { opacity:0; transform:translateY(-8px) scale(0.98); } to { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes fadeIn  { from { opacity:0; } to { opacity:1; } }
        @keyframes toastSlideIn { from { opacity:0; transform:translateX(140px) scale(0.88) rotateY(8deg); } to { opacity:1; transform:translateX(0) scale(1) rotateY(0deg); } }
        @keyframes toastProgress { from { width:100%; } to { width:0%; } }
        .modal-overlay { animation: fadeIn 0.2s ease; }
        .modal-box     { animation: slideIn 0.25s cubic-bezier(0.34,1.56,0.64,1); }
        .toast-card    { animation: toastSlideIn 0.5s cubic-bezier(0.34,1.56,0.64,1); }
        .toast-progress-bar { animation: toastProgress 4s linear forwards; }
        .progress-bar  { transition: width 1.2s cubic-bezier(0.4,0,0.2,1); }
        @keyframes shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(300%)} }
        .progress-shimmer { animation: shimmer 1.8s ease-in-out infinite; }
        @keyframes pglow {
          0%   { box-shadow: 0 0 8px 2px rgba(255,255,255,0.35), 0 0 20px 4px rgba(167,139,250,0.3); }
          50%  { box-shadow: 0 0 18px 6px rgba(255,255,255,0.7), 0 0 40px 12px rgba(167,139,250,0.55); }
          100% { box-shadow: 0 0 8px 2px rgba(255,255,255,0.35), 0 0 20px 4px rgba(167,139,250,0.3); }
        }
        .progress-glow { animation: pglow 2s ease-in-out infinite; }
        @keyframes toastRing {
          0%   { transform:scale(1);   opacity:0.7; }
          100% { transform:scale(2.2); opacity:0; }
        }
        @keyframes iconBounce { 0%,100%{transform:translateY(0);} 40%{transform:translateY(-5px);} 70%{transform:translateY(-2px);} }
        .toast-icon-bounce { animation: iconBounce 2s ease-in-out infinite; }
        @keyframes toastShimmer { 0%{left:-60%;} 100%{left:130%;} }
        .toast-shine { animation: toastShimmer 2.4s ease-in-out infinite; }
        input:focus, select:focus, textarea:focus { outline: none; border-color: #6366F1 !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.12); }
        .cal-day { transition: all 0.15s ease; }
        .cal-day:hover { background: #F1F5F9 !important; }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 99px; }
      `}</style>

      {/* ── WOW Live Notification Toasts — Bottom Right ── */}
      <div style={{ position: "fixed", bottom: "28px", right: "28px", zIndex: 9999, display: "flex", flexDirection: "column", gap: "14px", alignItems: "flex-end", pointerEvents: "none" }}>
        {toasts.map(toast => {
          const isErr = toast.type === "error";
          const isInfo = toast.type === "info";
          const cfg = isErr
            ? { grad: "linear-gradient(135deg,#FF416C,#FF4B2B)", glow: "rgba(255,65,108,0.45)", bg: "rgba(255,255,255,0.97)", border: "rgba(255,65,108,0.22)", iconBg: "linear-gradient(135deg,#FF6B6B,#FF416C)", ring: "rgba(255,65,108,0.3)", textColor: "#7F1D1D", subColor: "#991B1B", emoji: "🗑️", label: "Deleted" }
            : isInfo
              ? { grad: "linear-gradient(135deg,#6366F1,#4F46E5)", glow: "rgba(99,102,241,0.45)", bg: "rgba(255,255,255,0.97)", border: "rgba(99,102,241,0.22)", iconBg: "linear-gradient(135deg,#A5B4FC,#6366F1)", ring: "rgba(99,102,241,0.3)", textColor: "#1E1B4B", subColor: "#3730A3", emoji: "ℹ️", label: "Notice" }
              : { grad: "linear-gradient(135deg,#11998e,#38ef7d)", glow: "rgba(17,153,142,0.45)", bg: "rgba(255,255,255,0.97)", border: "rgba(17,153,142,0.22)", iconBg: "linear-gradient(135deg,#6EE7B7,#10B981)", ring: "rgba(17,153,142,0.3)", textColor: "#064E3B", subColor: "#065F46", emoji: toast.msg.includes("🎉") ? "🎉" : toast.msg.includes("✏️") ? "✏️" : "✅", label: "Success" };
          return (
            <div key={toast.id} className="toast-card" style={{ pointerEvents: "auto", width: "360px", borderRadius: "22px", overflow: "hidden", boxShadow: `0 30px 70px rgba(0,0,0,0.2), 0 0 0 1px ${cfg.border}, 0 0 40px ${cfg.glow}`, backdropFilter: "blur(24px)", background: cfg.bg, position: "relative" }}>
              {/* Gradient top stripe */}
              <div style={{ height: "5px", background: cfg.grad }} />

              {/* Shimmer sweep */}
              <div className="toast-shine" style={{ position: "absolute", top: 0, left: "-60%", width: "40%", height: "100%", background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.28),transparent)", pointerEvents: "none", zIndex: 2 }} />

              <div style={{ padding: "18px 20px", display: "flex", alignItems: "center", gap: "16px", position: "relative", zIndex: 3 }}>
                {/* Icon with pulsing ring */}
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <div style={{ position: "absolute", inset: "-8px", borderRadius: "50%", border: `2px solid ${cfg.ring}`, animation: "toastRing 1.8s ease-out infinite" }} />
                  <div style={{ position: "absolute", inset: "-4px", borderRadius: "50%", border: `2px solid ${cfg.ring}`, animation: "toastRing 1.8s ease-out 0.6s infinite" }} />
                  <div className="toast-icon-bounce" style={{ width: "54px", height: "54px", borderRadius: "16px", background: cfg.iconBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", boxShadow: `0 8px 24px ${cfg.glow}` }}>
                    {cfg.emoji}
                  </div>
                </div>

                {/* Text */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "14px", fontWeight: 900, color: cfg.textColor, letterSpacing: "-0.02em", marginBottom: "3px" }}>{cfg.label}!</div>
                  <div style={{ fontSize: "12px", fontWeight: 500, color: cfg.subColor, opacity: 0.85, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {toast.msg.replace(/[🎉✏️🚀✅]/g, "").trim()}
                  </div>
                </div>

                {/* Close */}
                <button onClick={() => dismissToast(toast.id)} style={{ width: "30px", height: "30px", borderRadius: "9px", border: `1.5px solid ${cfg.border}`, background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", color: cfg.subColor, fontWeight: 800, flexShrink: 0 }}>✕</button>
              </div>

              {/* Auto-dismiss bar */}
              <div style={{ height: "4px", background: `${cfg.border}` }}>
                <div className="toast-progress-bar" style={{ height: "100%", background: cfg.grad }} />
              </div>
            </div>
          );
        })}
      </div>


      {/* ── Header ── */}
      <div style={{
        background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)",
        padding: "18px 28px 28px", borderRadius: "0 0 28px 28px",
        boxShadow: "0 8px 32px rgba(79,70,229,0.3)",
        position: "relative", overflow: "hidden"
      }}>
        {/* decorative blobs */}
        <div style={{ position: "absolute", top: "-40px", right: "-40px", width: "160px", height: "160px", borderRadius: "50%", background: "rgba(255,255,255,0.06)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "-30px", left: "20%", width: "100px", height: "100px", borderRadius: "50%", background: "rgba(255,255,255,0.04)", pointerEvents: "none" }} />

        {/* Top row: title + button */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px" }}>
                <span style={{ background: "rgba(255,255,255,0.18)", borderRadius: "6px", padding: "3px 10px", fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.92)", letterSpacing: "0.06em" }}>
                  YEAR {semesterLabel.year} · SEM {semesterLabel.sem}
                </span>
              </div>
              <h1 style={{ margin: 0, fontSize: "26px", fontWeight: 900, color: "white", letterSpacing: "-0.02em", lineHeight: 1.2 }}>Study Planner</h1>
            </div>
          </div>
          <button onClick={openCreate} className="planner-btn" style={{
            display: "flex", alignItems: "center", gap: "7px",
            background: "white", color: "#4F46E5", border: "none",
            padding: "10px 18px", borderRadius: "10px", fontWeight: 700, fontSize: "13px",
            cursor: "pointer", boxShadow: "0 4px 16px rgba(0,0,0,0.15)", flexShrink: 0
          }}>
            <IconPlus /> New Task
          </button>
        </div>

        {/* ⭐ Progress Bar — hero feature */}
        <div style={{ marginTop: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.75)", letterSpacing: "0.06em", textTransform: "uppercase" }}>Weekly Progress</span>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "11px", fontWeight: 600, color: "rgba(255,255,255,0.6)" }}>{completed}/{tasks.length} done</span>
              <span style={{ fontSize: "20px", fontWeight: 900, color: "white", lineHeight: 1 }}>{progress}%</span>
            </div>
          </div>
          {/* Progress track */}
          <div style={{ height: "14px", background: "rgba(255,255,255,0.15)", borderRadius: "99px", overflow: "hidden", position: "relative" }}>
            <div className="progress-bar progress-glow" style={{
              width: `${progress}%`, height: "100%", borderRadius: "99px",
              background: "linear-gradient(90deg, rgba(255,255,255,0.9) 0%, white 60%, #C4B5FD 100%)",
              position: "relative", overflow: "hidden"
            }}>
              {progress > 5 && (
                <div className="progress-shimmer" style={{
                  position: "absolute", top: 0, left: 0, width: "40%", height: "100%",
                  background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)"
                }} />
              )}
            </div>
          </div>
        </div>

      </div>

      <div style={{ padding: "20px 28px" }}>

        <div style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}>

          {/* ── Right Sidebar ── */}
          <div style={{ width: "240px", flexShrink: 0, display: "flex", flexDirection: "column", gap: "16px", order: 2 }}>

            {/* Priority Guide — floating popup */}
            <div className="sidebar-card" style={{ background: "white", borderRadius: "20px", border: "1px solid rgba(99,102,241,0.15)", overflow: "hidden", boxShadow: "0 8px 32px rgba(99,102,241,0.13), 0 2px 8px rgba(0,0,0,0.06)" }}>
              <div style={{ padding: "12px 16px", background: "linear-gradient(135deg,#F5F3FF,#EEF2FF)", borderBottom: "1px solid rgba(99,102,241,0.12)" }}>
                <span style={{ fontSize: "10px", fontWeight: 900, color: "#6366F1", textTransform: "uppercase", letterSpacing: "0.12em" }}>📊 Priority Guide</span>
              </div>
              {Object.entries(PRIORITY).map(([key, val], idx, arr) => (
                <div key={key} style={{ padding: "11px 16px", borderBottom: idx < arr.length - 1 ? "1px solid #F8FAFC" : "none", display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ width: "9px", height: "9px", borderRadius: "50%", background: val.dot, flexShrink: 0, boxShadow: `0 0 8px ${val.dot}99` }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "12px", fontWeight: 800, color: "#0F172A" }}>{key}</div>
                    <div style={{ fontSize: "10px", fontWeight: 500, color: "#94A3B8", marginTop: "1px" }}>{val.tasks}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Next Up — floating popup */}
            {(() => {
              const nextTask = tasks.filter(t => t.status === "Pending").sort((a, b) => new Date(a.date + " " + a.time) - new Date(b.date + " " + b.time))[0];
              if (!nextTask) return null;
              const pri = PRIORITY[nextTask.priority] || PRIORITY.Low;
              return (
                <div className="sidebar-card" style={{ borderRadius: "20px", overflow: "hidden", boxShadow: `0 8px 32px ${pri.dot}30, 0 2px 8px rgba(0,0,0,0.06)`, border: `1px solid ${pri.border}` }}>
                  <div style={{ padding: "12px 16px", background: `linear-gradient(135deg,${pri.bg},white)`, borderBottom: `1px solid ${pri.border}`, display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "18px" }}>⏰</span>
                    <div>
                      <div style={{ fontSize: "10px", fontWeight: 900, color: pri.color, textTransform: "uppercase", letterSpacing: "0.1em" }}>Next Up</div>
                      <div style={{ fontSize: "11px", fontWeight: 700, color: "#0F172A", lineHeight: 1.2, marginTop: "1px" }}>{nextTask.subject}</div>
                    </div>
                  </div>
                  <div style={{ padding: "14px 16px", background: "white" }}>
                    <div style={{ fontWeight: 700, fontSize: "13px", color: "#1E293B", marginBottom: "8px", lineHeight: 1.3 }}>{nextTask.title}</div>
                    <span style={{ fontSize: "10px", fontWeight: 700, padding: "3px 9px", borderRadius: "20px", background: pri.bg, color: pri.color, border: `1px solid ${pri.border}`, display: "inline-block", marginBottom: "10px" }}>{nextTask.priority}</span>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginBottom: "12px" }}>
                      <div style={{ fontSize: "11px", color: "#64748B", display: "flex", alignItems: "center", gap: "5px", fontWeight: 500 }}><IconCalendar /> {nextTask.date} · {relDate(nextTask.date)}</div>
                      <div style={{ fontSize: "11px", color: "#64748B", display: "flex", alignItems: "center", gap: "5px", fontWeight: 500 }}><IconClock /> {nextTask.time}</div>
                    </div>
                    <button onClick={() => handleToggle(nextTask._id, "Pending")} className="planner-btn" style={{ width: "100%", padding: "10px", background: `linear-gradient(135deg,${pri.color},${pri.dot})`, color: "white", border: "none", borderRadius: "11px", fontWeight: 700, fontSize: "12px", cursor: "pointer", boxShadow: `0 4px 14px ${pri.dot}55` }}>✓ Mark Complete</button>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* ── Left: Tabs + Content ── */}
          <div style={{ flex: 1, minWidth: 0 }}>

            {/* Tab Bar */}
            <div style={{ display: "flex", gap: "4px", background: "#F1F5F9", borderRadius: "12px", padding: "4px", marginBottom: "20px", width: "fit-content" }}>
              {TABS.map(tab => (
                <button key={tab.id} onClick={() => setView(tab.id)} className="tab-btn" style={{
                  display: "flex", alignItems: "center", gap: "6px",
                  padding: "9px 18px", borderRadius: "9px", border: "none", cursor: "pointer",
                  fontWeight: 600, fontSize: "13px",
                  background: view === tab.id ? "white" : "transparent",
                  color: view === tab.id ? "#4F46E5" : "#64748B",
                  boxShadow: view === tab.id ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
                }}>
                  <span>{tab.icon}</span> {tab.label}
                </button>
              ))}
            </div>

            {/* ── LIST VIEW ── */}
            {view === "list" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {tasks.length === 0 ? (
                  <div style={{
                    background: "white", borderRadius: "16px", padding: "60px 40px",
                    textAlign: "center", border: "2px dashed #E2E8F0"
                  }}>
                    <div style={{ fontSize: "48px", marginBottom: "12px" }}>📭</div>
                    <p style={{ margin: 0, fontWeight: 700, color: "#1E293B", fontSize: "16px" }}>No tasks yet</p>
                    <p style={{ margin: "6px 0 20px", color: "#94A3B8", fontSize: "14px" }}>Add your first study task to get started</p>
                    <button onClick={openCreate} className="planner-btn" style={{
                      background: "#4F46E5", color: "white", border: "none",
                      padding: "10px 20px", borderRadius: "10px", fontWeight: 600, fontSize: "13px", cursor: "pointer"
                    }}>
                      + Add Task
                    </button>
                  </div>
                ) : tasks.map(t => (
                  <div key={t._id} className="task-card" style={{
                    background: "white", borderRadius: "14px", padding: "16px 20px",
                    display: "flex", alignItems: "center", gap: "14px",
                    borderLeft: `4px solid ${PRIORITY[t.priority]?.color || "#CBD5E1"}`,
                    opacity: t.status === "Completed" ? 0.7 : 1,
                  }}>
                    {/* Checkbox */}
                    <button onClick={() => handleToggle(t._id, t.status)} style={{
                      width: "24px", height: "24px", borderRadius: "7px", cursor: "pointer",
                      border: t.status === "Completed" ? "none" : "2px solid #CBD5E1",
                      background: t.status === "Completed" ? "#10B981" : "white",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0, transition: "all 0.2s ease", padding: 0,
                      color: "white"
                    }}>
                      {t.status === "Completed" && <IconCheck />}
                    </button>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "5px", flexWrap: "wrap" }}>
                        <span style={{
                          fontWeight: 700, fontSize: "14px",
                          textDecoration: t.status === "Completed" ? "line-through" : "none",
                          color: t.status === "Completed" ? "#94A3B8" : "#0F172A",
                        }}>
                          {t.subject}: {t.title}
                        </span>
                        <span style={{
                          fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "6px",
                          background: PRIORITY[t.priority]?.bg, color: PRIORITY[t.priority]?.color,
                          border: `1px solid ${PRIORITY[t.priority]?.border}`,
                        }}>
                          {t.priority}
                        </span>
                        {t.status === "Completed" && (
                          <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "6px", background: "#ECFDF5", color: "#16A34A", border: "1px solid #BBF7D0" }}>
                            Done
                          </span>
                        )}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "#64748B", fontWeight: 500 }}>
                          <IconCalendar /> {t.date} <span style={{ color: "#94A3B8" }}>·</span> {relDate(t.date)}
                        </span>
                        <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "#64748B", fontWeight: 500 }}>
                          <IconClock /> {t.time}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                      <button className="action-btn planner-btn" onClick={() => openEdit(t)} title="Edit" style={{
                        width: "34px", height: "34px", borderRadius: "9px", border: "1px solid #E2E8F0",
                        background: "white", color: "#4F46E5", cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center"
                      }}>
                        <IconEdit />
                      </button>
                      <button className="action-btn planner-btn" onClick={() => setDeleteConfirm(t._id)} title="Delete" style={{
                        width: "34px", height: "34px", borderRadius: "9px", border: "1px solid #E2E8F0",
                        background: "white", color: "#EF4444", cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center"
                      }}>
                        <IconTrash />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── CALENDAR VIEW ── */}
            {view === "calendar" && (
              <div style={{ background: "white", borderRadius: "16px", padding: "24px", border: "1px solid #E2E8F0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                  <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="planner-btn" style={{ width: "36px", height: "36px", border: "1px solid #E2E8F0", borderRadius: "9px", background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#374151" }}>
                    <IconChevronLeft />
                  </button>
                  <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 800, color: "#0F172A" }}>{monthName}</h3>
                  <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="planner-btn" style={{ width: "36px", height: "36px", border: "1px solid #E2E8F0", borderRadius: "9px", background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#374151" }}>
                    <IconChevronRight />
                  </button>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: "1px", background: "#F1F5F9", borderRadius: "12px", overflow: "hidden", border: "1px solid #E2E8F0" }}>
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
                    <div key={d} style={{ background: "#F8FAFC", padding: "10px 4px", textAlign: "center", fontSize: "11px", fontWeight: 700, color: "#94A3B8", letterSpacing: "0.05em" }}>{d}</div>
                  ))}
                  {Array.from({ length: startDay }).map((_, i) => (
                    <div key={`e${i}`} style={{ background: "white", minHeight: "90px" }} />
                  ))}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`;
                    const dayTasks = tasks.filter(t => t.date === dateStr);
                    const isToday = dateStr === new Date().toISOString().split("T")[0];
                    return (
                      <div key={i} className="cal-day" style={{
                        background: isToday ? "#EEF2FF" : "white",
                        minHeight: "90px", padding: "8px", position: "relative",
                        borderTop: isToday ? "2px solid #6366F1" : "none",
                      }}>
                        <span style={{ fontSize: "13px", fontWeight: isToday ? 800 : 500, color: isToday ? "#4F46E5" : "#374151", display: "block", marginBottom: "5px" }}>
                          {i + 1}
                        </span>
                        <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                          {dayTasks.slice(0, 3).map(dt => (
                            <div key={dt._id} title={`${dt.subject}: ${dt.title}`} style={{
                              fontSize: "10px", padding: "4px 6px", borderRadius: "6px",
                              background: PRIORITY[dt.priority]?.bg,
                              color: PRIORITY[dt.priority]?.color,
                              borderLeft: `2px solid ${PRIORITY[dt.priority]?.dot}`,
                              fontWeight: 600,
                            }}>
                              <div style={{ fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{dt.subject}: {dt.title}</div>
                              {dt.time && <div style={{ opacity: 0.75, marginTop: "1px", fontSize: "9px" }}>🕐 {dt.time}</div>}
                            </div>
                          ))}
                          {dayTasks.length > 3 && (
                            <span style={{ fontSize: "10px", color: "#94A3B8", fontWeight: 600 }}>+{dayTasks.length - 3} more</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── 7-DAY VIEW ── */}
            {view === "timetable" && (
              <div style={{ background: "white", borderRadius: "16px", padding: "24px", border: "1px solid #E2E8F0" }}>
                <h3 style={{ margin: "0 0 20px", fontSize: "16px", fontWeight: 800, color: "#0F172A" }}>Weekly Schedule</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: "10px" }}>
                  {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(day => {
                    const dayTasks = tasks.filter(t => t.day === day).sort((a, b) => a.time.localeCompare(b.time));
                    return (
                      <div key={day} style={{ background: "#F8FAFC", borderRadius: "12px", overflow: "hidden", border: "1px solid #E2E8F0" }}>
                        <div style={{ padding: "10px 8px", background: "#F1F5F9", textAlign: "center", borderBottom: "1px solid #E2E8F0" }}>
                          <span style={{ fontSize: "11px", fontWeight: 800, color: "#374151", textTransform: "uppercase", letterSpacing: "0.08em" }}>{day.slice(0, 3)}</span>
                        </div>
                        <div style={{ padding: "8px", display: "flex", flexDirection: "column", gap: "6px", minHeight: "120px" }}>
                          {dayTasks.length === 0 ? (
                            <p style={{ fontSize: "11px", color: "#CBD5E1", fontWeight: 600, textAlign: "center", marginTop: "20px" }}>Free</p>
                          ) : dayTasks.map(t => (
                            <div key={t._id} style={{
                              padding: "8px", borderRadius: "8px",
                              background: t.status === "Completed" ? "#F0FDF4" : "white",
                              borderLeft: `3px solid ${t.status === "Completed" ? "#10B981" : PRIORITY[t.priority]?.color}`,
                              boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                              position: "relative"
                            }}>
                              {t.status === "Completed" && (
                                <span style={{
                                  position: "absolute", top: "6px", right: "6px",
                                  width: "16px", height: "16px", borderRadius: "50%",
                                  background: "linear-gradient(135deg,#10B981,#059669)",
                                  color: "white", fontSize: "9px", fontWeight: 900,
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                  boxShadow: "0 2px 6px rgba(16,185,129,0.5)"
                                }}>✓</span>
                              )}
                              <div style={{ fontSize: "10px", fontWeight: 800, color: t.status === "Completed" ? "#6EE7B7" : "#4F46E5", marginBottom: "3px" }}>{t.time}</div>
                              <div style={{ fontSize: "11px", fontWeight: 700, color: t.status === "Completed" ? "#94A3B8" : "#1E293B", textDecoration: t.status === "Completed" ? "line-through" : "none" }}>{t.subject}</div>
                              <div style={{ fontSize: "10px", color: "#94A3B8", fontWeight: 500, marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ── Delete Confirmation Modal ── */}
      {
        deleteConfirm && (
          <div className="modal-overlay" onClick={() => setDeleteConfirm(null)} style={{
            position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)", backdropFilter: "blur(6px)",
            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9000
          }}>
            <div className="modal-box" onClick={e => e.stopPropagation()} style={{
              background: "white", borderRadius: "20px", padding: "32px", width: "360px",
              boxShadow: "0 24px 64px rgba(0,0,0,0.18)", textAlign: "center"
            }}>
              <div style={{ width: "56px", height: "56px", borderRadius: "16px", background: "#FEF2F2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", color: "#EF4444" }}>
                <IconTrash />
              </div>
              <h3 style={{ margin: "0 0 8px", fontSize: "18px", fontWeight: 800, color: "#0F172A" }}>Delete Task?</h3>
              <p style={{ margin: "0 0 24px", fontSize: "14px", color: "#64748B" }}>This action cannot be undone.</p>
              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={() => setDeleteConfirm(null)} className="planner-btn" style={{ flex: 1, padding: "12px", borderRadius: "10px", border: "1px solid #E2E8F0", background: "white", fontWeight: 600, fontSize: "14px", cursor: "pointer", color: "#374151" }}>
                  Cancel
                </button>
                <button onClick={() => handleDelete(deleteConfirm)} className="planner-btn" style={{ flex: 1, padding: "12px", borderRadius: "10px", border: "none", background: "#EF4444", color: "white", fontWeight: 700, fontSize: "14px", cursor: "pointer" }}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* ── Create / Edit Modal ── */}
      {
        isModalOpen && (
          <div className="modal-overlay" onClick={() => setIsModalOpen(false)} style={{
            position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)", backdropFilter: "blur(6px)",
            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9000
          }}>
            <div className="modal-box" onClick={e => e.stopPropagation()} style={{
              background: "white", borderRadius: "24px", padding: "32px", width: "480px",
              boxShadow: "0 24px 64px rgba(0,0,0,0.18)", maxHeight: "90vh", overflowY: "auto"
            }}>
              {/* Modal Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 800, color: "#0F172A" }}>
                    {editingTask ? "Edit Task" : "New Task"}
                  </h2>
                  <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#94A3B8" }}>
                    {editingTask ? "Update task details" : "Add a new study task"}
                  </p>
                </div>
                <button onClick={() => setIsModalOpen(false)} style={{
                  width: "36px", height: "36px", border: "1px solid #E2E8F0", borderRadius: "9px",
                  background: "white", cursor: "pointer", display: "flex", alignItems: "center",
                  justifyContent: "center", color: "#64748B"
                }}>
                  <IconClose />
                </button>
              </div>

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {/* Module + Date */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#374151", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Module Code</label>
                    <input
                      type="text" placeholder="e.g. ITPM" required
                      value={formData.subject}
                      onChange={e => setFormData({ ...formData, subject: e.target.value.toUpperCase() })}
                      style={{ width: "100%", padding: "11px 14px", borderRadius: "10px", border: "1.5px solid #E2E8F0", fontSize: "14px", fontWeight: 600, background: "#FAFAFA" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#374151", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Date</label>
                    <input
                      type="date" required value={formData.date}
                      onChange={e => setFormData({ ...formData, date: e.target.value })}
                      style={{ width: "100%", padding: "11px 14px", borderRadius: "10px", border: "1.5px solid #E2E8F0", fontSize: "14px", fontWeight: 600, background: "#FAFAFA" }}
                    />
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#374151", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Task Title</label>
                  <input
                    type="text" placeholder="e.g. Final Presentation" required
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    style={{ width: "100%", padding: "11px 14px", borderRadius: "10px", border: "1.5px solid #E2E8F0", fontSize: "14px", fontWeight: 600, background: "#FAFAFA" }}
                  />
                </div>

                {/* Time + Priority */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#374151", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Time</label>
                    <input
                      type="time" value={formData.time}
                      onChange={e => setFormData({ ...formData, time: e.target.value })}
                      style={{ width: "100%", padding: "11px 14px", borderRadius: "10px", border: "1.5px solid #E2E8F0", fontSize: "14px", fontWeight: 600, background: "#FAFAFA" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#374151", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Priority</label>
                    <select
                      value={formData.priority}
                      onChange={e => setFormData({ ...formData, priority: e.target.value })}
                      style={{ width: "100%", padding: "11px 14px", borderRadius: "10px", border: "1.5px solid #E2E8F0", fontSize: "14px", fontWeight: 600, background: "#FAFAFA", cursor: "pointer" }}
                    >
                      <option value="High">🔴 High</option>
                      <option value="Medium">🟠 Medium</option>
                      <option value="Low">🟢 Low</option>
                    </select>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="planner-btn" style={{
                    flex: 1, padding: "13px", borderRadius: "12px", border: "1px solid #E2E8F0",
                    background: "white", fontWeight: 600, fontSize: "14px", cursor: "pointer", color: "#374151"
                  }}>
                    Cancel
                  </button>
                  <button type="submit" className="planner-btn" style={{
                    flex: 2, padding: "13px", borderRadius: "12px", border: "none",
                    background: "linear-gradient(135deg, #4F46E5, #7C3AED)",
                    color: "white", fontWeight: 700, fontSize: "14px", cursor: "pointer",
                    boxShadow: "0 4px 16px rgba(79,70,229,0.3)"
                  }}>
                    {editingTask ? "Update Task" : "Create Task"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )
      }
    </div >
  );
}
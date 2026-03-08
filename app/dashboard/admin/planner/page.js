"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";

const PRIORITY_STYLES = {
    High: "bg-rose-100 text-rose-700 border-rose-200",
    Medium: "bg-amber-100 text-amber-700 border-amber-200",
    Low: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

const STATUS_STYLES = {
    Pending: "bg-slate-100 text-slate-600 border-slate-200",
    Done: "bg-indigo-100 text-indigo-700 border-indigo-200",
};

const DAY_ORDER = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

// Format date string or Date object into readable format
function formatDate(raw) {
    if (!raw) return "";
    try {
        const d = new Date(raw);
        if (isNaN(d.getTime())) return String(raw);
        return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
    } catch {
        return String(raw);
    }
}

export default function AdminPlanner() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [events, setEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterSemester, setFilterSemester] = useState("all");
    const [filterStatus, setFilterStatus] = useState("all");
    const [filterPriority, setFilterPriority] = useState("all");
    const [search, setSearch] = useState("");

    // Protect Route
    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        } else if (session?.user?.role !== "admin" && status === "authenticated") {
            router.push("/dashboard");
        } else if (status === "authenticated" && session?.user?.role === "admin") {
            fetchEvents();
        }
    }, [status, session, router]);

    const fetchEvents = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/planner?admin=true");
            if (res.ok) {
                const data = await res.json();
                setEvents(data);
            } else {
                setEvents([]);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to permanently delete this planner entry?")) return;
        try {
            const res = await fetch(`/api/planner?id=${id}`, { method: "DELETE" });
            if (res.ok) {
                setEvents(prev => prev.filter(e => e._id !== id));
            } else {
                alert("Failed to delete entry.");
            }
        } catch (error) {
            console.error(error);
        }
    };

    // Derived filter values
    const semesters = useMemo(() => [...new Set(events.map(e => e.semester).filter(Boolean))].sort(), [events]);

    const filtered = useMemo(() => {
        return events.filter(e => {
            if (filterSemester !== "all" && e.semester !== filterSemester) return false;
            if (filterStatus !== "all" && e.status !== filterStatus) return false;
            if (filterPriority !== "all" && e.priority !== filterPriority) return false;
            if (search) {
                const q = search.toLowerCase();
                if (
                    !e.title?.toLowerCase().includes(q) &&
                    !e.subject?.toLowerCase().includes(q)
                ) return false;
            }
            return true;
        });
    }, [events, filterSemester, filterStatus, filterPriority, search]);

    // Group by day
    const grouped = useMemo(() => {
        const map = {};
        filtered.forEach(e => {
            const day = e.day || "OTHER";
            if (!map[day]) map[day] = [];
            map[day].push(e);
        });
        // Sort by DAY_ORDER
        return Object.entries(map).sort(([a], [b]) => {
            const ai = DAY_ORDER.indexOf(a);
            const bi = DAY_ORDER.indexOf(b);
            return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
        });
    }, [filtered]);

    if (status === "loading" || !session || session.user.role !== "admin") return (
        <div className="min-h-[50vh] flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-600"></div>
        </div>
    );

    return (
        <div className="space-y-6 select-none font-sans">

            {/* Header */}
            <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600 shadow-sm border border-orange-100/50">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Study Planner Data</h1>
                        <p className="text-slate-500 font-medium mt-0.5 text-sm">Monitor and manage all system-wide planner entries.</p>
                    </div>
                </div>
                <Link href="/dashboard/admin">
                    <button className="hidden sm:flex items-center gap-1.5 px-4 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors bg-white shrink-0">
                        Back to Panel
                    </button>
                </Link>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { label: "Total Entries", value: events.length, color: "text-orange-600", bg: "bg-orange-50" },
                    { label: "Pending", value: events.filter(e => e.status === "Pending").length, color: "text-slate-600", bg: "bg-slate-50" },
                    { label: "Done", value: events.filter(e => e.status === "Done").length, color: "text-indigo-600", bg: "bg-indigo-50" },
                    { label: "High Priority", value: events.filter(e => e.priority === "High").length, color: "text-rose-600", bg: "bg-rose-50" },
                ].map(({ label, value, color, bg }) => (
                    <div key={label} className={`${bg} rounded-2xl p-4 border border-white shadow-sm`}>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{label}</p>
                        <p className={`text-3xl font-extrabold ${color}`}>{value}</p>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 flex flex-wrap gap-3 items-center">
                <input
                    type="text"
                    placeholder="Search title or subject…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="flex-1 min-w-[180px] px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-orange-400/40 focus:border-orange-400 text-slate-700 placeholder:text-slate-400"
                />
                <select value={filterSemester} onChange={e => setFilterSemester(e.target.value)}
                    className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-orange-400/40 text-slate-700 font-medium">
                    <option value="all">All Semesters</option>
                    {semesters.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                    className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-orange-400/40 text-slate-700 font-medium">
                    <option value="all">All Statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="Done">Done</option>
                </select>
                <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}
                    className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-orange-400/40 text-slate-700 font-medium">
                    <option value="all">All Priorities</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                </select>
                <span className="ml-auto text-xs font-bold text-slate-400">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>
            </div>

            {/* Content Area */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <h2 className="text-lg font-bold text-slate-800">Planner Entries</h2>
                    <span className="bg-orange-100 text-orange-700 py-1 px-3 rounded-full text-xs font-bold tracking-wide">
                        {events.length} Total
                    </span>
                </div>

                <div className="p-6 max-h-[70vh] overflow-y-auto">
                    {isLoading ? (
                        <div className="text-center py-12 text-slate-400 font-medium">Loading planner entries…</div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-orange-100">
                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-orange-300"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                            </div>
                            <h3 className="text-lg font-bold text-slate-700">No Entries Found</h3>
                            <p className="text-slate-500 text-sm mt-1">Try adjusting your filters.</p>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {grouped.map(([day, entries]) => (
                                <div key={day}>
                                    {/* Day Header */}
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="px-4 py-2.5 rounded-xl bg-orange-500 text-white flex items-center justify-center font-extrabold text-xs tracking-wider shadow-sm uppercase">
                                            {day}
                                        </div>
                                        <div className="flex-1 h-px bg-slate-200"></div>
                                        <span className="text-xs font-bold text-slate-400">{entries.length} {entries.length === 1 ? "entry" : "entries"}</span>
                                    </div>

                                    {/* Entries Grid */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                                        {entries.map(evt => (
                                            <div key={evt._id} className="group relative bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-orange-200 transition-all">

                                                {/* Priority badge top-right */}
                                                <div className="absolute top-4 right-4 flex items-center gap-2">
                                                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${PRIORITY_STYLES[evt.priority] || PRIORITY_STYLES.Medium}`}>
                                                        {evt.priority || "Medium"}
                                                    </span>
                                                    <button
                                                        onClick={() => handleDelete(evt._id)}
                                                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-transparent hover:border-rose-100"
                                                        title="Delete entry"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                                                    </button>
                                                </div>

                                                {/* Title */}
                                                <h3 className="text-base font-bold text-slate-800 mb-1 pr-24 tracking-tight group-hover:text-orange-600 transition-colors">
                                                    {evt.title}
                                                </h3>

                                                {/* Subject */}
                                                {evt.subject && (
                                                    <p className="text-xs font-semibold text-indigo-500 mb-3">{evt.subject}</p>
                                                )}

                                                {/* Meta grid */}
                                                <div className="grid grid-cols-2 gap-2 mt-3">
                                                    {/* Date */}
                                                    {evt.date && (
                                                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                                                            {formatDate(evt.date)}
                                                        </div>
                                                    )}
                                                    {/* Time */}
                                                    {evt.time && (
                                                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                                                            {evt.time}
                                                        </div>
                                                    )}
                                                    {/* Semester */}
                                                    {evt.semester && (
                                                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg>
                                                            {evt.semester}
                                                        </div>
                                                    )}
                                                    {/* Created by */}
                                                    {evt.createdBy && (
                                                        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium col-span-2 truncate">
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                                                            {evt.createdBy}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Status badge bottom */}
                                                <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between">
                                                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${STATUS_STYLES[evt.status] || STATUS_STYLES.Pending}`}>
                                                        {evt.status || "Pending"}
                                                    </span>
                                                    {evt.description && (
                                                        <p className="text-[11px] text-slate-400 truncate max-w-[55%]">{evt.description}</p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
}

"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Trash2 } from "lucide-react";

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

function formatCohort(sem) {
    if (!sem) return "";
    return String(sem).toUpperCase().replace(/Y(\d)S(\d)/i, 'Y$1 S$2');
}

function isDueToday(dateStr) {
    if (!dateStr) return false;
    return new Date(dateStr).toDateString() === new Date().toDateString();
}

function isOverdue(dateStr) {
    if (!dateStr) return false;
    if (isDueToday(dateStr)) return false;
    const due = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return due < today;
}

export default function AdminAssignments() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [assignments, setAssignments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterSem, setFilterSem] = useState("all");
    const [filterStatus, setFilterStatus] = useState("all");
    const [search, setSearch] = useState("");

    // Protect Route
    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        } else if (session?.user?.role !== "admin" && status === "authenticated") {
            router.push("/dashboard");
        } else if (status === "authenticated" && session?.user?.role === "admin") {
            fetchAssignments();
        }
    }, [status, session, router]);

    const fetchAssignments = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/assignments?admin=true");
            if (res.ok) {
                const data = await res.json();
                setAssignments(data);
            } else {
                setAssignments([]);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const proceedWithDelete = async (id) => {
        try {
            const res = await fetch(`/api/assignments?id=${id}`, { method: "DELETE" });
            if (res.ok) {
                setAssignments(prev => prev.filter(a => a._id !== id));
                toast.success("Assignment deleted successfully");
            } else {
                toast.error("Failed to delete assignment.");
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to delete assignment.");
        }
    };

    const handleDelete = async (id) => {
        toast.custom((t) => (
            <div className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm pointer-events-auto transition-opacity duration-200 ${t.visible ? 'opacity-100' : 'opacity-0'}`}>
                <div className={`${t.visible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'} transition-all duration-200 ease-in-out max-w-sm w-full bg-white dark:bg-slate-900/50 shadow-2xl flex flex-col items-center text-center gap-4 p-6 rounded-3xl ring-1 ring-zinc-200 dark:ring-zinc-700/80`}>
                    <div className="w-14 h-14 rounded-full flex items-center justify-center shrink-0 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400">
                        <Trash2 className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-1">Delete Assignment?</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Are you sure you want to permanently delete this assignment? This action cannot be undone.</p>
                    </div>
                    <div className="flex items-center gap-3 w-full mt-2">
                        <button
                            onClick={() => toast.dismiss(t.id)}
                            className="flex-1 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800/50 rounded-xl transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => {
                                toast.dismiss(t.id);
                                proceedWithDelete(id);
                            }}
                            className="flex-1 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-sm"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        ), { duration: Infinity });
    };



    const filtered = useMemo(() => {
        return assignments.filter(a => {
            if (filterSem !== "all" && String(a.semester).toUpperCase() !== filterSem) return false;
            if (filterStatus !== "all") {
                const pastDue = isOverdue(a.dueDate);
                const dueToday = isDueToday(a.dueDate);
                const upcoming = !pastDue && !dueToday;
                
                if (filterStatus === "upcoming" && !upcoming) return false;
                if (filterStatus === "dueToday" && !dueToday) return false;
                if (filterStatus === "pastDue" && !pastDue) return false;
            }
            if (search) {
                const q = search.toLowerCase();
                if (
                    !a.title?.toLowerCase().includes(q) &&
                    !a.description?.toLowerCase().includes(q)
                ) return false;
            }
            return true;
        });
    }, [assignments, filterSem, filterStatus, search]);

    if (status === "loading" || !session || session.user.role !== "admin") return (
        <div className="min-h-[50vh] flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-600"></div>
        </div>
    );

    return (
        <div className="space-y-6 select-none font-sans">

            {/* Header */}
            <div className="bg-white dark:bg-slate-900/50 p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-rose-50 dark:bg-rose-900/20 rounded-xl flex items-center justify-center text-rose-600 dark:text-rose-400 shadow-sm border border-rose-100/50 dark:border-rose-900/50">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200 tracking-tight">Assignment Management</h1>
                        <p className="text-slate-500 dark:text-slate-400 font-medium mt-0.5 text-sm">Monitor and manage all student assignments across semesters.</p>
                    </div>
                </div>
                <Link href="/dashboard/admin">
                    <button className="hidden sm:flex items-center gap-1.5 px-4 py-2 border border-slate-200 dark:border-slate-700/80 rounded-lg text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors bg-white dark:bg-slate-900/50 shrink-0">
                        Back to Panel
                    </button>
                </Link>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { label: "Total", value: assignments.length, color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-900/20" },
                    { label: "Upcoming", value: assignments.filter(a => !isOverdue(a.dueDate) && !isDueToday(a.dueDate)).length, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
                    { label: "Due Today", value: assignments.filter(a => isDueToday(a.dueDate)).length, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-900/20" },
                    { label: "Past Due", value: assignments.filter(a => isOverdue(a.dueDate)).length, color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-900/20" },
                ].map(({ label, value, color, bg }) => (
                    <div key={label} className={`${bg} rounded-2xl p-4 border border-white dark:border-slate-800 shadow-sm`}>
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">{label}</p>
                        <p className={`text-3xl font-extrabold ${color}`}>{value}</p>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-900/50 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/80 p-4 flex flex-wrap gap-3 items-center">
                <input
                    type="text"
                    placeholder="Search title or description…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="flex-1 min-w-[200px] px-3 py-2 text-sm border border-slate-200 dark:border-slate-700/80 rounded-xl bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-400/40 focus:border-rose-400 text-slate-700 dark:text-slate-300 placeholder:text-slate-400"
                />
                <select value={filterSem} onChange={e => setFilterSem(e.target.value)}
                    className="px-3 py-2 text-sm border border-slate-200 dark:border-slate-700/80 rounded-xl bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-400/40 text-slate-700 dark:text-slate-300 font-medium">
                    <option value="all">All Semesters</option>
                    <option value="Y1S1">Year 1 Sem 1</option>
                    <option value="Y1S2">Year 1 Sem 2</option>
                    <option value="Y2S1">Year 2 Sem 1</option>
                    <option value="Y2S2">Year 2 Sem 2</option>
                    <option value="Y3S1">Year 3 Sem 1</option>
                    <option value="Y3S2">Year 3 Sem 2</option>
                    <option value="Y4S1">Year 4 Sem 1</option>
                    <option value="Y4S2">Year 4 Sem 2</option>
                </select>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                    className="px-3 py-2 text-sm border border-slate-200 dark:border-slate-700/80 rounded-xl bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-400/40 text-slate-700 dark:text-slate-300 font-medium">
                    <option value="all">All Statuses</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="dueToday">Due Today</option>
                    <option value="pastDue">Past Due</option>
                </select>
                <span className="ml-auto text-xs font-bold text-slate-400 dark:text-slate-500">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>
            </div>

            {/* Content Area */}
            <div className="bg-white dark:bg-slate-900/50 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/80 overflow-hidden">
                <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">Assignments</h2>
                    <span className="bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 py-1 px-3 rounded-full text-xs font-bold tracking-wide">
                        {assignments.length} Total
                    </span>
                </div>

                <div className="p-6 max-h-[70vh] overflow-y-auto">
                    {isLoading ? (
                        <div className="text-center py-12 text-slate-400 dark:text-slate-500 font-medium">Loading assignments…</div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-100 dark:border-rose-900/50">
                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-rose-300"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /></svg>
                            </div>
                            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">No Assignments Found</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Try adjusting your filters.</p>
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {filtered.map((a) => {
                                const pastDue = isOverdue(a.dueDate);
                                const dueToday = isDueToday(a.dueDate);
                                return (
                                    <div key={a._id} className="group relative bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-rose-200 dark:hover:border-rose-800/50 transition-all flex flex-col">

                                        {/* Top: Title + delete */}
                                        <div className="flex items-start justify-between gap-3 mb-2">
                                            <div className="flex items-start gap-3 min-w-0">
                                                <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 mt-0.5">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /></svg>
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="font-bold text-slate-800 dark:text-slate-200 text-[15px] leading-snug line-clamp-2 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                                                        {a.title}
                                                    </h3>
                                                    {a.description && (
                                                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 line-clamp-2">{a.description}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleDelete(a._id)}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg border border-transparent hover:border-rose-100 dark:hover:border-rose-900/50 shrink-0"
                                                title="Delete assignment"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                                            </button>
                                        </div>

                                        {/* Meta tags */}
                                        <div className="flex flex-wrap items-center gap-2 mt-2 mb-3">
                                            {/* Semester */}
                                            {a.semester && (
                                                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700/80">
                                                    {formatCohort(a.semester)}
                                                </span>
                                            )}
                                            {/* Status Badge */}
                                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                                                dueToday ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/50" :
                                                pastDue ? "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800/50" : "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50"
                                            }`}>
                                                {dueToday ? "Due Today" : pastDue ? "Past Due" : "Upcoming"}
                                            </span>
                                        </div>

                                        {/* Due date row */}
                                        <div className="flex items-center gap-2 mt-auto">
                                            {a.dueDate && (
                                                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                                                    Due: {formatDate(a.dueDate)}
                                                </div>
                                            )}
                                        </div>

                                        {/* Footer: dates */}
                                        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                                            <span>Created: {formatDate(a.createdAt)}</span>
                                            {a.updatedAt && a.updatedAt !== a.createdAt && (
                                                <span>Updated: {formatDate(a.updatedAt)}</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
}

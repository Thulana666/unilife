"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react"; // useMemo still used for `filtered`
import Link from "next/link";
import { toast } from 'react-hot-toast';

const FILE_TYPE_ICONS = {
    "application/pdf": { label: "PDF", color: "bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800/50" },
    "image/png": { label: "PNG", color: "bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-800/50" },
    "image/jpeg": { label: "JPG", color: "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/50" },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": { label: "DOCX", color: "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800/50" },
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": { label: "PPTX", color: "bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800/50" },
};

function getFileIcon(mime) {
    return FILE_TYPE_ICONS[mime] || { label: mime?.split("/")?.[1]?.toUpperCase() || "FILE", color: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700/80" };
}

function formatDate(raw) {
    if (!raw) return "";
    try {
        const d = new Date(raw);
        if (isNaN(d.getTime())) return String(raw);
        return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch {
        return String(raw);
    }
}

export default function AdminNotes() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [notes, setNotes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterSem, setFilterSem] = useState("all");
    const [search, setSearch] = useState("");
    const [noteToDelete, setNoteToDelete] = useState(null);

    // Protect Route
    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        } else if (session?.user?.role !== "admin" && status === "authenticated") {
            router.push("/dashboard");
        } else if (status === "authenticated" && session?.user?.role === "admin") {
            fetchNotes();
        }
    }, [status, session, router]);

    const fetchNotes = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/notes?admin=true");
            if (res.ok) {
                const data = await res.json();
                setNotes(data);
            } else {
                setNotes([]);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id) => {
        setNoteToDelete(id);
    };

    const executeDelete = async () => {
        if (!noteToDelete) return;
        const id = noteToDelete;
        setNoteToDelete(null);
        try {
            const res = await fetch(`/api/notes?id=${id}`, { method: "DELETE" });
            if (res.ok) {
                setNotes(prev => prev.filter(n => n._id !== id));
                toast.success('Note deleted successfully');
            } else {
                toast.error("Failed to delete note.");
            }
        } catch (error) {
            console.error(error);
            toast.error("Network error. Please try again.");
        }
    };

    // All 8 fixed semesters for the filter
    const semOptions = [
        { value: 'y1s1', label: 'Year 1, Semester 1' },
        { value: 'y1s2', label: 'Year 1, Semester 2' },
        { value: 'y2s1', label: 'Year 2, Semester 1' },
        { value: 'y2s2', label: 'Year 2, Semester 2' },
        { value: 'y3s1', label: 'Year 3, Semester 1' },
        { value: 'y3s2', label: 'Year 3, Semester 2' },
        { value: 'y4s1', label: 'Year 4, Semester 1' },
        { value: 'y4s2', label: 'Year 4, Semester 2' },
    ];

    const filtered = useMemo(() => {
        return notes.filter(n => {
            if (filterSem !== "all" && `y${n.year}s${n.semester}` !== filterSem) return false;
            if (search) {
                const q = search.toLowerCase();
                if (
                    !n.title?.toLowerCase().includes(q) &&
                    !n.description?.toLowerCase().includes(q) &&
                    !n.fileName?.toLowerCase().includes(q) &&
                    !n.uploadedBy?.toLowerCase().includes(q)
                ) return false;
            }
            return true;
        });
    }, [notes, filterSem, search]);

    if (status === "loading" || !session || session.user.role !== "admin") return (
        <div className="min-h-[50vh] flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600"></div>
        </div>
    );

    return (
        <div className="space-y-6 select-none font-sans">

            {/* Header */}
            <div className="bg-white dark:bg-slate-900/50 p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm border border-emerald-100/50 dark:border-emerald-900/50">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /></svg>
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200 tracking-tight">Notes Management</h1>
                        <p className="text-slate-500 dark:text-slate-400 font-medium mt-0.5 text-sm">Monitor and manage all uploaded notes across semesters.</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Link href="/dashboard/notes">
                        <button className="hidden sm:flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-all shadow-sm shadow-indigo-200 shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1" /><rect width="7" height="5" x="14" y="3" rx="1" /><rect width="7" height="9" x="14" y="12" rx="1" /><rect width="7" height="5" x="3" y="16" rx="1" /></svg>
                            Manage Subjects
                        </button>
                    </Link>
                    <Link href="/dashboard/admin">
                        <button className="hidden sm:flex items-center gap-1.5 px-4 py-2 border border-slate-200 dark:border-slate-700/80 rounded-lg text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors bg-white dark:bg-slate-900/50 shrink-0">
                            Back to Panel
                        </button>
                    </Link>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { label: "Total Notes", value: notes.length, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
                    { label: "PDFs", value: notes.filter(n => n.fileType === "application/pdf").length, color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-900/20" },
                    { label: "With Files", value: notes.filter(n => n.fileUrl).length, color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-900/20" },
                    { label: "Uploaders", value: new Set(notes.map(n => n.uploadedBy).filter(Boolean)).size, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-900/20" },
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
                    placeholder="Search title, description, filename, or uploader…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="flex-1 min-w-[200px] px-3 py-2 text-sm border border-slate-200 dark:border-slate-700/80 rounded-xl bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-400/40 focus:border-emerald-400 text-slate-700 dark:text-slate-300 placeholder:text-slate-400"
                />
                <select value={filterSem} onChange={e => setFilterSem(e.target.value)}
                    className="px-3 py-2 text-sm border border-slate-200 dark:border-slate-700/80 rounded-xl bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-400/40 text-slate-700 dark:text-slate-300 font-medium">
                    <option value="all">All Semesters</option>
                    {semOptions.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
                <span className="ml-auto text-xs font-bold text-slate-400 dark:text-slate-500">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>
            </div>

            {/* Notes Table / Cards */}
            <div className="bg-white dark:bg-slate-900/50 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/80 overflow-hidden">
                <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">Uploaded Notes</h2>
                    <span className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 py-1 px-3 rounded-full text-xs font-bold tracking-wide">
                        {notes.length} Total
                    </span>
                </div>

                <div className="p-6 max-h-[70vh] overflow-y-auto">
                    {isLoading ? (
                        <div className="text-center py-12 text-slate-400 dark:text-slate-500 font-medium">Loading notes…</div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100 dark:border-emerald-900/50">
                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-300"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /></svg>
                            </div>
                            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">No Notes Found</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Try adjusting your filters.</p>
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {filtered.map((note) => {
                                const fIcon = getFileIcon(note.fileType);
                                return (
                                    <div key={note._id} className="group relative bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-800/50 transition-all flex flex-col">

                                        {/* Top Row: Icon + Title + Actions */}
                                        <div className="flex items-start gap-3 mb-3">
                                            <div className="w-11 h-11 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /></svg>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-slate-800 dark:text-slate-200 text-[15px] leading-snug line-clamp-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                                    {note.title}
                                                </h3>
                                                {note.description && (
                                                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 line-clamp-1">{note.description}</p>
                                                )}
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                                {note.fileUrl && (
                                                    <button
                                                        onClick={() => window.open(note.fileUrl, '_blank')}
                                                        className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                                                        title="View file"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6" /><path d="M10 14 21 3" /><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /></svg>
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDelete(note._id)}
                                                    className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                                                    title="Delete note"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                                                </button>
                                            </div>
                                        </div>

                                        {/* File Info */}
                                        {note.fileName && (
                                            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-3 mb-3">
                                                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 truncate flex items-center gap-1.5">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>
                                                    {note.fileName}
                                                </p>
                                            </div>
                                        )}

                                        {/* Meta Tags */}
                                        <div className="flex flex-wrap items-center gap-2 mt-auto">
                                            {/* Semester */}
                                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50">
                                                Y{note.year}S{note.semester}
                                            </span>
                                            {/* File Type */}
                                            {note.fileType && (
                                                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${fIcon.color}`}>
                                                    {fIcon.label}
                                                </span>
                                            )}
                                        </div>

                                        {/* Footer: Uploader + Date */}
                                        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                                            {note.uploadedBy && (
                                                <span className="flex items-center gap-1 truncate max-w-[60%]">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                                                    {note.uploadedBy}
                                                </span>
                                            )}
                                            {note.createdAt && (
                                                <span className="shrink-0">{formatDate(note.createdAt)}</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {noteToDelete && (
                <div className="fixed inset-0 bg-slate-900 dark:bg-slate-950 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900/50 rounded-3xl p-8 max-w-sm w-full shadow-2xl relative animate-in zoom-in-95 duration-200 border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 rounded-full flex items-center justify-center mb-5 shadow-inner">
                            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 tracking-tight mb-2">Delete Note?</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-8 leading-relaxed">
                            Are you absolutely sure you want to delete this note? This action cannot be undone.
                        </p>

                        <div className="flex gap-3 w-full">
                            <button
                                onClick={() => setNoteToDelete(null)}
                                className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold rounded-xl transition-colors border border-slate-200 dark:border-slate-700/80"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={executeDelete}
                                className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-md shadow-red-500/20 transition-all active:scale-95"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

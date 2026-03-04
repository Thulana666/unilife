"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function AdminNotes() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [notes, setNotes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterSem, setFilterSem] = useState("all");

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
            // Future REST implementation
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
        if (!window.confirm("Are you sure you want to permanently delete this note?")) return;

        try {
            const res = await fetch(`/api/notes?id=${id}`, { method: "DELETE" });
            if (res.ok) {
                setNotes(prev => prev.filter(n => n._id !== id));
            } else {
                alert("Failed to delete note module.");
            }
        } catch (error) {
            console.error(error);
        }
    };

    if (status === "loading" || !session || session.user.role !== "admin") return (
        <div className="min-h-[50vh] flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600"></div>
        </div>
    );

    const filteredNotes = filterSem === "all"
        ? notes
        : notes.filter(n => `y${n.year}s${n.semester}` === filterSem);

    return (
        <div className="space-y-6 select-none font-sans">

            {/* Header Block */}
            <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100/50">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15.5 3H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3Z" /><path d="M15 3v6h6" /><path d="m14 13-4 4 4 4" /><path d="M10 17h10" /></svg>
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Lecture Notes Monitor</h1>
                        <p className="text-slate-500 font-medium mt-0.5 text-sm">System-wide file storage scanner and permissions management.</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <select
                        value={filterSem}
                        onChange={(e) => setFilterSem(e.target.value)}
                        className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block w-full md:w-48 p-2.5 outline-none font-medium"
                    >
                        <option value="all">All Semesters</option>
                        <option value="y1s1">Year 1 - Sem 1</option>
                        <option value="y1s2">Year 1 - Sem 2</option>
                        <option value="y2s1">Year 2 - Sem 1</option>
                        <option value="y2s2">Year 2 - Sem 2</option>
                        <option value="y3s1">Year 3 - Sem 1</option>
                        <option value="y3s2">Year 3 - Sem 2</option>
                        <option value="y4s1">Year 4 - Sem 1</option>
                        <option value="y4s2">Year 4 - Sem 2</option>
                    </select>
                    <Link href="/dashboard/admin">
                        <button className="hidden sm:flex items-center gap-1.5 px-4 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors bg-white shrink-0">
                            Back to Panel
                        </button>
                    </Link>
                </div>
            </div>

            {/* List Overview */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <h2 className="text-lg font-bold text-slate-800">Note Repositories</h2>
                    <span className="bg-emerald-100 text-emerald-700 py-1 px-3 rounded-full text-xs font-bold tracking-wide">
                        {filteredNotes.length} Document Nodes
                    </span>
                </div>

                <div className="p-6">
                    {isLoading ? (
                        <div className="text-center py-12 text-slate-400 font-medium">Resolving Cloudinary records...</div>
                    ) : filteredNotes.length > 0 ? (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {filteredNotes.map((note) => (
                                <div key={note._id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-emerald-200 transition-all group flex flex-col h-full">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => window.open(note.fileUrl, '_blank')}
                                                className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-md hover:bg-indigo-50"
                                                title="View"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6"></path><path d="M10 14 21 3"></path><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path></svg>
                                            </button>
                                            <button
                                                onClick={() => handleDelete(note._id)}
                                                className="p-1.5 text-slate-400 hover:text-red-500 rounded-md hover:bg-red-50"
                                                title="Delete Node"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                                            </button>
                                        </div>
                                    </div>
                                    <h3 className="font-bold text-slate-800 text-[15px] leading-snug line-clamp-2 mb-2 group-hover:text-emerald-600 transition-colors flex-1">{note.title}</h3>

                                    <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-500">
                                        <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded-[5px]">Y{note.year}S{note.semester}</span>
                                        <span>{note.moduleCode}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16">
                            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100 shadow-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-300"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
                            </div>
                            <h3 className="text-lg font-bold text-slate-700">No Document Roots Discovered</h3>
                            <p className="text-slate-500 font-medium text-sm mt-1 max-w-sm mx-auto">No matching notes files are hosted on the current criteria.</p>
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
}

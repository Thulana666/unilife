"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function AdminAssignments() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [assignments, setAssignments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterSem, setFilterSem] = useState("all");

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
            // Note: Replace with true API when implemented globally
            const res = await fetch("/api/assignments?admin=true");
            if (res.ok) {
                const data = await res.json();
                setAssignments(data);
            } else {
                // Feature not built yet mock
                setAssignments([]);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to permanently delete this assignment?")) return;

        try {
            const res = await fetch(`/api/assignments?id=${id}`, { method: "DELETE" });
            if (res.ok) {
                setAssignments(prev => prev.filter(a => a._id !== id));
            } else {
                alert("Failed to delete assignment.");
            }
        } catch (error) {
            console.error(error);
        }
    };

    if (status === "loading" || !session || session.user.role !== "admin") return (
        <div className="min-h-[50vh] flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-600"></div>
        </div>
    );

    const filteredAssignments = filterSem === "all"
        ? assignments
        : assignments.filter(a => `y${a.year}s${a.semester}` === filterSem);

    return (
        <div className="space-y-6 select-none font-sans">

            {/* Header Block */}
            <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600 shadow-sm border border-rose-100/50">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 19.5v.5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8.5L18 5.5" /><path d="M8 18h1" /><path d="M18.42 9.61a2.1 2.1 0 1 1 2.97 2.97L16.95 17 13 18l.99-3.95 4.43-4.44Z" /></svg>
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Assignment Management</h1>
                        <p className="text-slate-500 font-medium mt-0.5 text-sm">System-wide read and delete access for all assignment modules.</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <select
                        value={filterSem}
                        onChange={(e) => setFilterSem(e.target.value)}
                        className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-rose-500 focus:border-rose-500 block w-full md:w-48 p-2.5 outline-none font-medium"
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

            {/* Content Area */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <h2 className="text-lg font-bold text-slate-800">Uploaded Assignments</h2>
                    <span className="bg-rose-100 text-rose-700 py-1 px-3 rounded-full text-xs font-bold tracking-wide">
                        {filteredAssignments.length} Global Records
                    </span>
                </div>

                <div className="p-6">
                    {isLoading ? (
                        <div className="text-center py-12 text-slate-400 font-medium">Loading records...</div>
                    ) : filteredAssignments.length > 0 ? (
                        <div className="divide-y divide-slate-100">
                            {filteredAssignments.map((assignment) => (
                                <div key={assignment._id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group">
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 mt-1">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                                        </div>
                                        <div>
                                            <h3 className="text-slate-800 font-bold text-base leading-tight mb-1 group-hover:text-rose-600 transition-colors">{assignment.title}</h3>
                                            <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                                                <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">
                                                    Y{assignment.year}S{assignment.semester}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                                                    Due: {new Date(assignment.dueDate).toLocaleDateString()}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                                    By: {assignment.lecturerName}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 sm:opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                                        <button
                                            onClick={() => window.alert('Edit capability can be linked here.')}
                                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                            title="Edit Assignment"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                                        </button>
                                        <button
                                            onClick={() => handleDelete(assignment._id)}
                                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                            title="Delete Assignment"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100 shadow-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                            </div>
                            <h3 className="text-lg font-bold text-slate-700">No Assignments Found</h3>
                            <p className="text-slate-500 font-medium text-sm mt-1 max-w-sm mx-auto">Either this feature is still under development, or there are zero assignment records matching the global filters.</p>
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
}

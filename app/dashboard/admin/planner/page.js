"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function AdminPlanner() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [events, setEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

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
            // Future universal GET implementation
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
        if (!window.confirm("Are you sure you want to permanently delete this event?")) return;

        try {
            const res = await fetch(`/api/planner?id=${id}`, { method: "DELETE" });
            if (res.ok) {
                setEvents(prev => prev.filter(e => e._id !== id));
            } else {
                alert("Failed to delete event block.");
            }
        } catch (error) {
            console.error(error);
        }
    };

    if (status === "loading" || !session || session.user.role !== "admin") return (
        <div className="min-h-[50vh] flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-600"></div>
        </div>
    );

    return (
        <div className="space-y-6 select-none font-sans">

            {/* Header Block */}
            <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600 shadow-sm border border-orange-100/50">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Study Planner Data</h1>
                        <p className="text-slate-500 font-medium mt-0.5 text-sm">Monitor system-wide agenda entries and overarching deadlines.</p>
                    </div>
                </div>
                <div>
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
                    <h2 className="text-lg font-bold text-slate-800">Global Timeline</h2>
                    <span className="bg-orange-100 text-orange-700 py-1 px-3 rounded-full text-xs font-bold tracking-wide">
                        {events.length} System Blocks
                    </span>
                </div>

                <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    {isLoading ? (
                        <div className="text-center py-12 text-slate-400 font-medium">Resolving agenda blocks...</div>
                    ) : events.length > 0 ? (
                        <div className="relative border-l-2 border-slate-100 ml-3 md:ml-6 space-y-8">
                            {events.map((evt) => (
                                <div key={evt._id} className="relative pl-6 md:pl-8 group">
                                    <div className="absolute w-4 h-4 rounded-full bg-white border-4 border-orange-400 -left-[9px] top-1 group-hover:scale-125 transition-transform"></div>
                                    <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm group-hover:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] group-hover:border-orange-200 transition-all">
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <h3 className="text-base font-bold text-slate-800 tracking-tight group-hover:text-orange-600 transition-colors">{evt.title}</h3>
                                                <p className="text-[13px] text-slate-500 mt-1 leading-relaxed line-clamp-2 md:max-w-[75%]">{evt.description}</p>

                                                <div className="flex flex-wrap items-center gap-3 mt-3">
                                                    <span className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1.5 rounded-md">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                                                        {new Date(evt.eventDate).toLocaleDateString()}
                                                    </span>
                                                    <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1.5 rounded-md">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                                        Owner: {evt.userEmail}
                                                    </span>
                                                    <span className="text-xs font-bold text-slate-400 px-2">
                                                        Type: {evt.type || 'Standard'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleDelete(evt._id)}
                                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-100"
                                                    title="Remove Event Block"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16">
                            <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-orange-100 shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)]">
                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-orange-300"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                            </div>
                            <h3 className="text-lg font-bold text-slate-700">Timeline Empty</h3>
                            <p className="text-slate-500 font-medium text-sm mt-1 max-w-sm mx-auto">No study parameters or timeline blocks currently exist within the database schema.</p>
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
}

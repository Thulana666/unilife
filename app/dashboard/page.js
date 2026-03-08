"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";

export default function StudentDashboard() {
    const { data: session, status } = useSession();
    const router = useRouter();

    // Auth Protection Routing
    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        } else if (status === "authenticated") {
            if (session?.user?.role === "admin") {
                router.push("/dashboard/admin");
            } else if (session?.user?.role === "lecturer") {
                router.push("/dashboard/lecturer");
            }
        }
    }, [status, session, router]);

    // Prevent rendering incorrect UI while redirecting or loading
    if (status === "loading" || !session || session.user.role !== "student") {
        return null;
    }

    // Extract Session Data safely
    const { name = "Student", year = 1, semester = 1 } = session.user;

    return (
        <div className="space-y-8">
            {/* Header & Student Info Cards */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-8">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">Student Dashboard</h1>
                    <p className="text-slate-500 mt-2 text-lg">
                        Welcome, <span className="font-semibold text-slate-800">{name}</span> 👋
                    </p>
                </div>

                {/* Academic Info Widget */}
                <div className="flex items-center gap-3 sm:gap-4 bg-white p-3 sm:p-4 rounded-2xl shadow-sm border border-slate-200 overflow-x-auto whitespace-nowrap">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg>
                    </div>
                    <div className="flex gap-4 sm:gap-6 px-2 sm:px-4 flex-nowrap">
                        <div>
                            <p className="text-xs font-medium text-slate-500 mb-0.5 uppercase tracking-wider">Role</p>
                            <p className="font-bold text-slate-900">Student</p>
                        </div>
                        <div className="w-px h-10 bg-slate-200"></div>
                        <div>
                            <p className="text-xs font-medium text-slate-500 mb-0.5 uppercase tracking-wider">Year</p>
                            <p className="font-bold text-slate-900">{year}</p>
                        </div>
                        <div className="w-px h-10 bg-slate-200"></div>
                        <div>
                            <p className="text-xs font-medium text-slate-500 mb-0.5 uppercase tracking-wider">Semester</p>
                            <p className="font-bold text-slate-900">{semester}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Feature Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">

                {/* Feature 1: Assignment Tracker */}
                <div className="group bg-white rounded-3xl p-8 shadow-sm border border-slate-200 hover:shadow-lg transition-all duration-300 flex flex-col justify-between overflow-hidden relative min-h-[280px]">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-bl-full -z-0 opacity-50 group-hover:scale-110 transition-transform duration-500"></div>
                    <div className="z-10 flex-1">
                        <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:bg-purple-600 group-hover:text-white transition-colors duration-300">
                            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 mb-2 tracking-tight">Assignment Tracker</h2>
                        <p className="text-slate-500 mb-6 text-base leading-relaxed">
                            Track assignments, monitor deadlines, and submit your project work securely.
                        </p>
                    </div>
                    <Link href={`/dashboard/assignments/y${year}s${semester}`} className="z-10 relative">
                        <button className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-slate-50 text-purple-600 font-bold rounded-xl group-hover:bg-purple-50 transition-colors border border-slate-100 group-hover:border-purple-200">
                            Open Assignments
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 group-hover:translate-x-1 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                        </button>
                    </Link>
                </div>

                {/* Feature 2: Study Planner */}
                <div className="group bg-white rounded-3xl p-8 shadow-sm border border-slate-200 hover:shadow-lg transition-all duration-300 flex flex-col justify-between overflow-hidden relative min-h-[280px]">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full -z-0 opacity-50 group-hover:scale-110 transition-transform duration-500"></div>
                    <div className="z-10 flex-1">
                        <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
                            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 mb-2 tracking-tight">Study Planner</h2>
                        <p className="text-slate-500 mb-6 text-base leading-relaxed">
                            Plan your weekly study schedule, set goals, and prepare effectively for exams.
                        </p>
                    </div>
                    <Link href="/dashboard/planner" className="z-10 relative">
                        <button className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-slate-50 text-emerald-600 font-bold rounded-xl group-hover:bg-emerald-50 transition-colors border border-slate-100 group-hover:border-emerald-200">
                            Open Planner
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 group-hover:translate-x-1 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                        </button>
                    </Link>
                </div>

                {/* Feature 3: Notes Sharing */}
                <div className="group bg-white rounded-3xl p-8 shadow-sm border border-slate-200 hover:shadow-lg transition-all duration-300 flex flex-col justify-between overflow-hidden relative min-h-[280px]">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-bl-full -z-0 opacity-50 group-hover:scale-110 transition-transform duration-500"></div>
                    <div className="z-10 flex-1">
                        <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:bg-amber-500 group-hover:text-white transition-colors duration-300">
                            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 mb-2 tracking-tight">Notes Sharing</h2>
                        <p className="text-slate-500 mb-6 text-base leading-relaxed">
                            View, download, and share academic notes with your peers across all modules.
                        </p>
                    </div>
                    <Link href="/dashboard/notes" className="z-10 relative">
                        <button className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-slate-50 text-amber-600 font-bold rounded-xl group-hover:bg-amber-50 transition-colors border border-slate-100 group-hover:border-amber-200">
                            Open Notes
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 group-hover:translate-x-1 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                        </button>
                    </Link>
                </div>

                {/* Feature 4: Community Chat */}
                <div className="group bg-white rounded-3xl p-8 shadow-sm border border-slate-200 hover:shadow-lg transition-all duration-300 flex flex-col justify-between overflow-hidden relative min-h-[280px]">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-sky-50 rounded-bl-full -z-0 opacity-50 group-hover:scale-110 transition-transform duration-500"></div>
                    <div className="z-10 flex-1">
                        <div className="w-14 h-14 bg-sky-100 text-sky-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:bg-sky-500 group-hover:text-white transition-colors duration-300">
                            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 mb-2 tracking-tight">Community Chat</h2>
                        <p className="text-slate-500 mb-6 text-base leading-relaxed">
                            Chat in real-time with other students in Year {year}, Semester {semester}.
                        </p>
                    </div>
                    <Link href={`/dashboard/chat/y${year}s${semester}`} className="z-10 relative">
                        <button className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-slate-50 text-sky-600 font-bold rounded-xl group-hover:bg-sky-50 transition-colors border border-slate-100 group-hover:border-sky-200">
                            Join Chat
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 group-hover:translate-x-1 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                        </button>
                    </Link>
                </div>

            </div>
        </div>
    );
}
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
        return null; // Layout handles loading state
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
                        Welcome, <span className="font-semibold text-slate-800">{name}</span> ð
                    </p>
                </div>

                {/* Academic Info Widget */}
                <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg>
                    </div>
                    <div className="flex gap-6 px-4">
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

            {/* Main Feature Cards Grid - Filtered for Notes only */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">

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

            </div>
        </div>
    );
}

"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";

export default function LecturerDashboard() {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        } else if (session?.user?.role !== "lecturer" && status === "authenticated") {
            router.push("/dashboard"); // fallback redirect if not lecturer
        }
    }, [status, session, router]);

    if (status === "loading" || !session || session.user.role !== "lecturer") {
        return null; // Layout handles loading state natively
    }

    return (
        <div className="space-y-6">

            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-8 mt-2 border-b border-slate-100 pb-6">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">Lecturer Overview</h1>
                    <p className="text-slate-500 mt-2 text-lg">
                        Welcome, <span className="font-semibold text-slate-800">{session?.user?.name || "Lecturer"}</span> 👋
                    </p>
                </div>

                {/* Academic Info Widget */}
                <div className="flex items-center gap-3 sm:gap-4 bg-white p-3 sm:p-4 rounded-2xl shadow-sm border border-slate-200 overflow-x-auto whitespace-nowrap">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                    </div>
                    <div className="flex gap-4 sm:gap-6 px-2 sm:px-4 flex-nowrap">                        <div>
                            <p className="text-xs font-medium text-slate-500 mb-0.5 uppercase tracking-wider">Role</p>
                            <p className="font-bold text-slate-900 capitalize">{session?.user?.role || "lecturer"}</p>
                        </div>
                        <div className="w-px h-10 bg-slate-200"></div>
                        <div>
                            <p className="text-xs font-medium text-slate-500 mb-0.5 uppercase tracking-wider">Year</p>
                            <p className="font-bold text-slate-900">{session?.user?.year || 1}</p>
                        </div>
                        <div className="w-px h-10 bg-slate-200"></div>
                        <div>
                            <p className="text-xs font-medium text-slate-500 mb-0.5 uppercase tracking-wider">Semester</p>
                            <p className="font-bold text-slate-900">{session?.user?.semester || 1}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Feature Cards Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Manage Notes Card */}
                <Link href="/dashboard/notes" className="group block h-full">
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:shadow-xl hover:-translate-y-1 hover:border-amber-300 transition-all duration-300 h-full flex flex-col relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-bl-full -z-0 opacity-50 group-hover:scale-110 transition-transform duration-500"></div>
                        <div className="relative z-10 w-14 h-14 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-white transition-all transform shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m16 6 4 14" /><path d="M12 6v14" /><path d="M8 8v12" /><path d="M4 4v16" /></svg>
                        </div>
                        <h3 className="relative z-10 text-xl font-bold text-slate-800 mb-2 group-hover:text-amber-700 transition-colors">Manage Subject Notes</h3>
                        <p className="relative z-10 text-slate-500 flex-grow mb-4">Upload, edit, and organize lecture slides and reading materials for your academic subjects.</p>
                        <div className="relative z-10 text-amber-600 font-semibold text-sm flex items-center gap-2 group-hover:gap-3 transition-all">
                            Access Content Subjects
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                        </div>
                    </div>
                </Link>

            </div>
        </div>
    );
}

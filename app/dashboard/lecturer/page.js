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

            {/* Header Block handled mostly by layout, leaving context block here */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Lecturer Overview</h1>
                    <p className="text-slate-500 mt-1">Manage course materials and assignments across your classes.</p>
                </div>
            </div>

            {/* Main Feature Cards Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Manage Notes Card */}
                <Link href="/dashboard/lecturer/notes" className="group block h-full">
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-purple-300 transition-all duration-300 h-full flex flex-col">
                        <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white transition-all transform shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m16 6 4 14" /><path d="M12 6v14" /><path d="M8 8v12" /><path d="M4 4v16" /></svg>
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-purple-700 transition-colors">Manage Notes</h3>
                        <p className="text-slate-500 flex-grow mb-4">Upload, edit, and organize lecture slides and reading materials for your students.</p>
                        <div className="text-purple-600 font-semibold text-sm flex items-center gap-2 group-hover:gap-3 transition-all">
                            Access Materials
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                        </div>
                    </div>
                </Link>

                {/* Manage Assignments Card */}
                <Link href="/dashboard/lecturer/assignments" className="group block h-full">
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-rose-300 transition-all duration-300 h-full flex flex-col">
                        <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-rose-600 group-hover:text-white transition-all transform shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 19.5v.5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8.5L18 5.5" /><path d="M8 18h1" /><path d="M18.42 9.61a2.1 2.1 0 1 1 2.97 2.97L16.95 17 13 18l.99-3.95 4.43-4.44Z" /></svg>
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-rose-700 transition-colors">Manage Assignments</h3>
                        <p className="text-slate-500 flex-grow mb-4">Create new assignments, set deadlines, and track student submissions seamlessly.</p>
                        <div className="text-rose-600 font-semibold text-sm flex items-center gap-2 group-hover:gap-3 transition-all">
                            Access Assignments
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                        </div>
                    </div>
                </Link>

                {/* Open Semester Chats Card */}
                <Link href="/dashboard/lecturer/chat" className="group block h-full">
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-sky-300 transition-all duration-300 h-full flex flex-col">
                        <div className="w-14 h-14 bg-sky-50 text-sky-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-sky-600 group-hover:text-white transition-all transform shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-sky-700 transition-colors">Open Semester Chats</h3>
                        <p className="text-slate-500 flex-grow mb-4">Monitor student discussions and broadcast important Special Notices across semesters.</p>
                        <div className="text-sky-600 font-semibold text-sm flex items-center gap-2 group-hover:gap-3 transition-all">
                            Access Chats
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                        </div>
                    </div>
                </Link>

            </div>
        </div>
    );
}

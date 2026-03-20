"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";

export default function LecturerChatAccess() {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        } else if (session?.user?.role !== "lecturer" && session?.user?.role !== "admin" && status === "authenticated") {
            router.push("/dashboard");
        }
    }, [status, session, router]);

    if (status === "loading" || !session || (session.user.role !== "lecturer" && session.user.role !== "admin")) {
        return (
            <div className="min-h-[50vh] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    // Generate years 1-4, semesters 1-2
    const semesters = [];
    for (let y = 1; y <= 4; y++) {
        for (let s = 1; s <= 2; s++) {
            semesters.push({ year: y, semester: s });
        }
    }

    return (
        <div className="space-y-6 select-none font-sans">

            {/* Header Block */}
            <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100/50">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path><path d="M13 8H7"></path><path d="M17 12H7"></path></svg>
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Semester Chats</h1>
                        <p className="text-slate-500 font-medium mt-0.5 text-sm">Select semester to access student chats</p>
                    </div>
                </div>
                <Link href="/dashboard/lecturer">
                    <button className="hidden sm:flex items-center gap-1.5 px-4 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors bg-white">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                        Back to Lecturer Dashboard
                    </button>
                </Link>
            </div>

            {/* Chat Room Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {semesters.map((term) => (
                    <Link href={`/dashboard/chat/y${term.year}s${term.semester}`} key={`y${term.year}s${term.semester}`} className="group block h-full">
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-indigo-300 transition-all duration-300 h-full flex flex-col items-center text-center relative overflow-hidden">

                            {/* Decorative background circle */}
                            <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-indigo-50 to-sky-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-700 ease-out"></div>

                            <div className="w-14 h-14 bg-white shadow-sm border border-indigo-100 text-indigo-600 rounded-2xl flex flex-col items-center justify-center mb-4 group-hover:-translate-y-1 transition-transform duration-300 relative z-10">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-0.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                            </div>

                            <h3 className="text-[17px] font-extrabold text-slate-800 group-hover:text-indigo-600 transition-colors relative z-10">
                                Year {term.year} Semester {term.semester}
                            </h3>

                            <p className="text-sm text-slate-500 mt-2 font-medium relative z-10">
                                Access live course chat
                            </p>

                            <div className="mt-5 pt-4 border-t border-slate-100 w-full flex items-center justify-center text-indigo-600 font-semibold text-[13px] gap-2 group-hover:gap-3 transition-all relative z-10 uppercase tracking-wide">
                                Open Chat
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Info Footer */}
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-start gap-3 mt-8">
                <div className="mt-0.5 text-indigo-500">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                </div>
                <div>
                    <h4 className="font-bold text-indigo-900 text-sm">Lecturer Privileges Active</h4>
                    <p className="text-indigo-700/80 text-[13px] mt-1 font-medium leading-relaxed">
                        As a lecturer, you can access any semester chat room. You also have the exclusive ability to broadcast <strong>Special Notices</strong>. Notices bypass regular formatting to appear highlighted to all students.
                    </p>
                </div>
            </div>

        </div>
    );
}

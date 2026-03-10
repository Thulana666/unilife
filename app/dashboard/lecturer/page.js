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
                    <p className="text-slate-500 mt-1">Manage module materials and evaluate academic resources.</p>
                </div>
            </div>

            {/* Main Feature Cards Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Manage Notes Card */}
                <Link href="/dashboard/lecturer/notes" className="group block h-full">
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

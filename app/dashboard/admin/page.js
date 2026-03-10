"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && session?.user?.role !== "admin") {
      router.push("/dashboard");
    }
  }, [status, session, router]);

  // Prevent rendering incorrect UI while redirecting or loading
  if (status === "loading" || !session || session.user.role !== "admin") {
    return null; // Layout handles loading state natively
  }

  return (
    <div className="space-y-8">
      {/* Dashboard Header */}
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-sm font-semibold mb-4 border border-indigo-200 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
          Admin Level Access
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">Admin Dashboard</h1>
        <p className="text-slate-500 mt-3 text-lg max-w-2xl leading-relaxed">
          Welcome, <span className="font-semibold text-slate-700">{session.user.name || "Admin"}</span>. Manage your university platform users from this control center.
        </p>
      </div>

      {/* Feature Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">

        {/* Card 1: User Management */}
        <div className="group bg-white rounded-3xl p-6 shadow-sm border border-slate-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -z-0 opacity-50 group-hover:scale-110 transition-transform duration-500"></div>
          <div className="z-10 flex-1">
            <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-5 shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2 tracking-tight">User Management</h2>
            <p className="text-slate-500 mb-6 leading-relaxed text-[15px]">
              View and manage students, lecturers, and admins across the network.
            </p>
          </div>
          <Link href="/dashboard/admin/users" className="z-10 relative">
            <button className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-slate-50 text-indigo-600 font-bold rounded-xl group-hover:bg-indigo-50 transition-colors border border-slate-100 group-hover:border-indigo-200 text-[15px]">
              Manage Users
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 group-hover:translate-x-1 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
            </button>
          </Link>
        </div>

        {/* Card 2: Create New User */}
        <div className="group bg-white rounded-3xl p-6 shadow-sm border border-slate-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full -z-0 opacity-50 group-hover:scale-110 transition-transform duration-500"></div>
          <div className="z-10 flex-1">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-5 shadow-sm group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2 tracking-tight">Create User</h2>
            <p className="text-slate-500 mb-6 leading-relaxed text-[15px]">
              Add new securely authenticated accounts to the UniLife directory.
            </p>
          </div>
          <Link href="/dashboard/admin/create-user" className="z-10 relative">
            <button className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-slate-50 text-emerald-600 font-bold rounded-xl group-hover:bg-emerald-50 transition-colors border border-slate-100 group-hover:border-emerald-200 text-[15px]">
              Create Entity
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 group-hover:translate-x-1 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
            </button>
          </Link>
        </div>

        {/* Card 5: Notes Overrides */}
        <div className="group bg-white rounded-3xl p-6 shadow-sm border border-slate-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-bl-full -z-0 opacity-50 group-hover:scale-110 transition-transform duration-500"></div>
          <div className="z-10 flex-1">
            <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-5 shadow-sm group-hover:bg-amber-600 group-hover:text-white transition-colors duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m16 6 4 14" /><path d="M12 6v14" /><path d="M8 8v12" /><path d="M4 4v16" /></svg>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2 tracking-tight">Manage Subject Notes</h2>
            <p className="text-slate-500 mb-6 leading-relaxed text-[15px]">
              Database-level view and delete access to uploaded slide decks and PDF material across all modules.
            </p>
          </div>
          <Link href="/dashboard/admin/notes" className="z-10 relative">
            <button className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-slate-50 text-amber-600 font-bold rounded-xl group-hover:bg-amber-50 transition-colors border border-slate-100 group-hover:border-amber-200 text-[15px]">
              Notes Control
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 group-hover:translate-x-1 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
            </button>
          </Link>
        </div>

      </div>
    </div>
  );
}
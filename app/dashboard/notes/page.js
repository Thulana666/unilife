'use client';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function NotesSemesterGrid() {
  const { data: session, status } = useSession();

  // Define the 8 Semesters explicitly
  const semesters = [
    { id: 1, name: 'Year 1, Semester 1', short: 'Y1S1' },
    { id: 2, name: 'Year 1, Semester 2', short: 'Y1S2' },
    { id: 3, name: 'Year 2, Semester 1', short: 'Y2S1' },
    { id: 4, name: 'Year 2, Semester 2', short: 'Y2S2' },
    { id: 5, name: 'Year 3, Semester 1', short: 'Y3S1' },
    { id: 6, name: 'Year 3, Semester 2', short: 'Y3S2' },
    { id: 7, name: 'Year 4, Semester 1', short: 'Y4S1' },
    { id: 8, name: 'Year 4, Semester 2', short: 'Y4S2' },
  ];

  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center py-20 min-h-[40vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600 shadow-sm"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Header Section */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6 w-full relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-indigo-50 rounded-full mix-blend-multiply opacity-70"></div>
        <div className="relative z-10 w-full xl:w-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex justify-center items-center shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path></svg>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">Academic Semesters</h1>
          </div>
          <p className="text-slate-500 text-sm md:text-base max-w-2xl font-medium leading-relaxed">
            Select a specific semester to view its modules, read course materials, or upload new notes.
          </p>
        </div>

        {/* Academic Info Widget */}
        <div className="relative z-10 flex items-center gap-3 sm:gap-4 bg-white/80 backdrop-blur p-3 sm:p-4 rounded-2xl shadow-sm border border-slate-200 overflow-x-auto whitespace-nowrap self-start xl:self-center">
            <div className={`w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 rounded-full flex items-center justify-center ${session?.user?.role === "admin" ? "bg-amber-50 text-amber-600" : session?.user?.role === "lecturer" ? "bg-purple-50 text-purple-600" : "bg-blue-50 text-blue-600"}`}>
                {session?.user?.role === "admin" ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                ) : session?.user?.role === "lecturer" ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg>
                )}
            </div>
            <div className="flex gap-4 sm:gap-6 px-2 sm:px-4 flex-nowrap">
                <div>
                    <p className="text-xs font-medium text-slate-500 mb-0.5 uppercase tracking-wider">Role</p>
                    <p className="font-bold text-slate-900 capitalize">{session?.user?.role || "student"}</p>
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

      {/* Semester Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {semesters.map((sem) => (
          <Link
            href={`/dashboard/${sem.id}/notes`}
            key={sem.id}
            className={`group bg-white rounded-3xl p-6 border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden flex flex-col justify-between min-h-[160px] ${session?.user?.semester === sem.id ? 'border-indigo-300 ring-2 ring-indigo-50/50' : 'border-slate-200'}`}
          >
            <div className="absolute -right-8 -top-8 w-24 h-24 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-full transition-transform group-hover:scale-150 duration-500 z-0 opacity-60"></div>

            <div className="relative z-10 flex flex-col h-full">
              <div className="flex justify-between items-start mb-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm transition-colors ${session?.user?.semester === sem.id ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white'}`}>
                  <span className="font-extrabold text-lg">{sem.id}</span>
                </div>
                {session?.user?.semester === sem.id && (
                  <span className="bg-indigo-100 text-indigo-700 text-xs font-bold py-1 px-3 rounded-full flex items-center gap-1.5 shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                    Current
                  </span>
                )}
              </div>

              <div className="mt-auto pt-2">
                <h2 className="text-xl font-extrabold text-slate-800 group-hover:text-indigo-700 transition-colors tracking-tight">{sem.short}</h2>
                <p className="text-sm font-medium text-slate-500 mt-1">{sem.name}</p>

                <div className="flex items-center gap-2 mt-4 text-sm font-bold text-indigo-600 opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all duration-300">
                  <span>Open Modules</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

    </div>
  );
}

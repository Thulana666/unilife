'use client';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LecturerNotesSemesterGrid() {
    const { data: session, status } = useSession();
    const router = useRouter();

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

    // Compute the current semester ID (1-8) from user's year and semester
    const userYear = session?.user?.year || 1;
    const userSem = session?.user?.semester || 1;
    const currentSemId = (userYear - 1) * 2 + userSem;

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
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-purple-50 rounded-full mix-blend-multiply opacity-70"></div>
                <div className="relative z-10 w-full xl:w-auto">
                    <div className="flex items-center gap-3 mb-2">
                        <button
                            onClick={() => router.push('/dashboard/lecturer')}
                            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
                            title="Go back"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"></path></svg>
                        </button>
                        <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-xl flex justify-center items-center shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path></svg>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">Manage Course Materials</h1>
                    </div>
                    <p className="text-slate-500 text-sm md:text-base max-w-2xl font-medium leading-relaxed">
                        Select a semester to view its modules, manage your course notes, or upload new materials for your students.
                    </p>
                </div>
            </div>

            {/* Semester Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {semesters.map((sem) => (
                    <Link
                        href={`/dashboard/${sem.id}/notes`}
                        key={sem.id}
                        className={`group bg-white rounded-3xl p-6 border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden flex flex-col justify-between min-h-[160px] ${currentSemId === sem.id ? 'border-purple-300 ring-2 ring-purple-50/50' : 'border-slate-200'}`}
                    >
                        <div className="absolute -right-8 -top-8 w-24 h-24 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-full transition-transform group-hover:scale-150 duration-500 z-0 opacity-60"></div>

                        <div className="relative z-10 flex flex-col h-full">
                            <div className="flex justify-between items-start mb-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm transition-colors ${currentSemId === sem.id ? 'bg-purple-600 text-white' : 'bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white'}`}>
                                    <span className="font-extrabold text-lg">{sem.id}</span>
                                </div>
                                {currentSemId === sem.id && (
                                    <span className="bg-purple-100 text-purple-700 text-xs font-bold py-1 px-3 rounded-full flex items-center gap-1.5 shadow-sm">
                                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse"></span>
                                        Current
                                    </span>
                                )}
                            </div>

                            <div className="mt-auto pt-2">
                                <h2 className="text-xl font-extrabold text-slate-800 group-hover:text-purple-700 transition-colors tracking-tight">{sem.short}</h2>
                                <p className="text-sm text-slate-400 font-medium mt-1">{sem.name}</p>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}

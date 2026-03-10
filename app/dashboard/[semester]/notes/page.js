'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';

export default function SubjectsDashboard() {
  const { data: session, status } = useSession();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const router = useRouter();
  const params = useParams(); // gives { semester }

  // Clean 'yXsY' string or numeric semester param. Using session defaults for robust query.
  // The user clicked a specific semester (1-8), so we parse that from the path
  const querySem = parseInt(params.semester) || session?.user?.semester || 1;
  // Compute year roughly based on semester (1,2 -> Y1 | 3,4 -> Y2 | 5,6 -> Y3 | 7,8 -> Y4)
  const queryYear = Math.ceil(querySem / 2);

  const isAdmin = session?.user?.role === 'admin';

  async function fetchSubjects() {
    if (!session) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/notes/subjects?year=${queryYear}&semester=${querySem}`);
      const data = await res.json();
      if (res.ok) {
        setSubjects(data);
      }
    } catch (err) { }
    setLoading(false);
  }

  useEffect(() => {
    fetchSubjects();
    // eslint-disable-next-line
  }, [session, params.semester]);

  const handleCreateSubject = async (e) => {
    e.preventDefault();
    if (!newSubjectName.trim()) return;
    setErrorMsg('');

    // Explicit Admin-only API Call
    try {
      const res = await fetch('/api/notes/subjects/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newSubjectName.trim(),
          year: queryYear,
          semester: querySem
        })
      });

      const data = await res.json();
      if (res.ok) {
        setShowAddModal(false);
        setNewSubjectName('');
        fetchSubjects(); // Refresh
      } else {
        setErrorMsg(data.error || "Failed to create subject");
      }
    } catch (err) {
      setErrorMsg("Network error creating subject");
    }
  };

  const handleDeleteSubject = async (e, subjectName) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent Link navigation

    if (!window.confirm(`Are you sure you want to completely delete the subject "${subjectName}"? This does NOT delete the notes inside it automatically.`)) return;

    try {
      const res = await fetch(`/api/notes/subjects/manage?name=${encodeURIComponent(subjectName)}&year=${queryYear}&semester=${querySem}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        fetchSubjects();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete subject");
      }
    } catch (err) {
      alert("Network error.");
    }
  };

  return (
    <div className="space-y-6">

      {/* Header Section */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 w-full relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-indigo-50 rounded-full mix-blend-multiply opacity-70"></div>
        <div className="relative z-10 w-full">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex justify-center items-center shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path></svg>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">Year {queryYear}, Semester {querySem} Subjects</h1>
          </div>
          <p className="text-slate-500 text-sm md:text-base mb-6 max-w-2xl font-medium leading-relaxed">
            Select a subject below to view or upload lecture notes and study materials.
          </p>

          <div className="flex gap-3 mt-4 md:mt-0 pb-1">
            {/* Only admins can create subjects globally */}
            {isAdmin && (
              <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 hover:shadow-lg hover:-translate-y-0.5 transition-all shadow-sm text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                New Subject (Admin)
              </button>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center flex-col gap-4 items-center py-20 min-h-[40vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600 shadow-sm"></div>
          <p className="text-slate-400 font-medium animate-pulse">Loading subjects...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">

          {subjects.length === 0 ? (
            <div className="col-span-full py-20 bg-white rounded-3xl border border-dashed border-slate-300 flex flex-col items-center justify-center text-center px-4">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              </div>
              <h3 className="text-xl font-bold text-slate-700 mb-2">No subjects configured</h3>
              <p className="text-slate-500 max-w-sm font-medium">It looks like no subjects have been created for this semester yet.</p>
              {isAdmin && (
                <button onClick={() => setShowAddModal(true)} className="mt-6 font-bold text-indigo-600 bg-indigo-50 px-6 py-2 rounded-xl hover:bg-indigo-100 transition-colors">Create First Subject</button>
              )}
            </div>
          ) : (
            subjects.map((subj, idx) => (
              <div key={idx} className="relative group bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col justify-between min-h-[180px]">
                <div className="absolute -right-8 -top-8 w-24 h-24 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-full transition-transform group-hover:scale-150 duration-500 z-0 opacity-60"></div>

                <Link
                  href={`/dashboard/${params.semester}/notes/${encodeURIComponent(subj.name)}`}
                  className="relative z-10 flex flex-col h-full cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
                    </div>

                    <div className="flex gap-2 items-center">
                      {/* Admin Delete Actions */}
                      {isAdmin && (
                        <button
                          onClick={(e) => handleDeleteSubject(e, subj.name)}
                          className="z-20 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                          title="Delete Subject"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                        </button>
                      )}
                      <span className="bg-slate-100 text-slate-500 text-xs font-wdy py-1 px-3 rounded-full flex items-center gap-1 font-bold group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                        <span className="w-2 h-2 rounded-full bg-slate-400 group-hover:bg-indigo-500"></span>
                        {subj.count} Notes
                      </span>
                    </div>
                  </div>

                  <div className="mt-auto pt-2">
                    <h2 className="text-lg font-bold text-slate-800 group-hover:text-indigo-700 transition-colors line-clamp-2">{subj.name}</h2>
                    <div className="flex items-center gap-2 mt-3 text-sm text-slate-500 font-medium group-hover:text-indigo-600">
                      <span>View Module Notes</span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" className="transform group-hover:translate-x-1 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                    </div>
                  </div>
                </Link>
              </div>
            ))
          )}
        </div>
      )}

      {/* Add Subject Modal (Admin Only) */}
      {showAddModal && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full p-8 relative animate-in zoom-in-95 duration-200">
            <button onClick={() => setShowAddModal(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 p-2 rounded-full transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
            <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-indigo-100 shadow-inner">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path></svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2 tracking-tight">Create Subject (Admin)</h2>
            <p className="text-slate-500 text-sm mb-6 font-medium">Add an empty module skeleton to the Year {queryYear} Semester {querySem} curriculum.</p>

            <form onSubmit={handleCreateSubject}>
              <div className="mb-6">
                <input
                  type="text"
                  placeholder="e.g. SE2030 Software Engineering"
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all font-medium text-slate-800 placeholder:text-slate-400"
                  autoFocus
                  required
                />
              </div>

              {errorMsg && (
                <div className="mb-4 text-xs font-bold text-red-600 bg-red-50 p-3 rounded-lg border border-red-100 flex items-center gap-1.5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                  {errorMsg}
                </div>
              )}

              <div className="flex justify-end gap-3 text-sm font-bold">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 bg-white border border-slate-200 rounded-xl transition-colors">Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-sm transition-colors flex items-center gap-2">
                  Save Framework
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

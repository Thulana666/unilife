// Notes Dashboard Page for Students and Lecturers
'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

export default function NotesDashboard() {
  const { data: session } = useSession();
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');

  async function fetchNotes() {
    if (!session) return;
    setLoading(true);
    const url = `/api/notes?year=${session.user.year}&semester=${session.user.semester}` +
      (title ? `&title=${encodeURIComponent(title)}` : '');
    const res = await fetch(url);
    const data = await res.json();
    setNotes(data);
    setLoading(false);
  }

  useEffect(() => {
    fetchNotes();
    // eslint-disable-next-line
  }, [title, session]);

  async function handleDelete(noteId) {
    if (!session) return;
    if (!window.confirm('Are you sure you want to delete this note?')) return;
    const res = await fetch(`/api/notes?id=${noteId}`, { method: 'DELETE' });
    if (res.ok) {
      fetchNotes();
    } else {
      const data = await res.json();
      alert(data.error || 'Failed to delete note');
    }
  }

  function handleDownload(fileUrl) {
    window.open(fileUrl, '_blank');
  }

  function openEditModal(note) {
    setEditingNote(note);
    setEditTitle(note.title);
    setEditDescription(note.description || '');
  }

  async function handleUpdate(e) {
    e.preventDefault();
    if (!session || !editingNote) return;

    const res = await fetch('/api/notes', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: editingNote._id,
        title: editTitle,
        description: editDescription
      })
    });

    if (res.ok) {
      setEditingNote(null);
      fetchNotes();
    } else {
      const data = await res.json();
      alert(data.error || 'Failed to update note');
    }
  }

  return (
    <div className="space-y-6">

      {/* Header Section */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 w-full">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Notes Dashboard</h1>
          <p className="text-slate-500 mt-1">Access, download, and manage study materials shared for your semester.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto mt-4 md:mt-0">
          <div className="relative flex-grow md:w-64">
            <input
              type="text"
              placeholder="Search notes..."
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all"
            />
            <svg className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </div>
          <button onClick={fetchNotes} className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition text-sm">Search</button>

          <a href={`/dashboard/${session?.user?.semester || 1}/notes/upload`} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition shadow-sm text-sm whitespace-nowrap">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
            Upload
          </a>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {notes.length === 0 ? (
            <div className="p-8 text-center text-slate-500">No notes found for this semester.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                    <th className="px-6 py-4">Details</th>
                    <th className="px-6 py-4">Uploaded By</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/80">
                  {notes.map(note => {
                    const canModify = session?.user?.role === 'admin' || note.uploadedBy === session?.user?.email;

                    return (
                      <tr key={note._id} className="hover:bg-slate-50/50 transition duration-150">
                        <td className="px-6 py-5 align-top">
                          <div className="font-bold text-slate-800 text-base mb-1">{note.title}</div>
                          {note.description && <div className="text-slate-500 text-sm line-clamp-2 max-w-sm">{note.description}</div>}
                        </td>
                        <td className="px-6 py-5 align-top whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-xs font-bold text-indigo-600 border border-indigo-100 shadow-sm">
                              {note.uploadedBy?.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm text-slate-600 font-medium">{note.uploadedBy}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5 align-top whitespace-nowrap text-sm text-slate-500 font-medium">
                          {new Date(note.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                        </td>
                        <td className="px-6 py-5 align-top">
                          <div className="flex justify-end items-center gap-2">
                            <button onClick={() => handleDownload(note.fileUrl)} className="text-emerald-600 bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-700 px-3 py-1.5 rounded-lg text-sm font-semibold transition flex items-center gap-1.5 border border-emerald-100">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                              Get
                            </button>

                            {canModify && (
                              <>
                                <button onClick={() => openEditModal(note)} className="text-blue-600 bg-blue-50 hover:bg-blue-100 hover:text-blue-700 px-3 py-1.5 rounded-lg text-sm font-semibold transition border border-blue-100">
                                  Edit
                                </button>
                                <button onClick={() => handleDelete(note._id)} className="text-rose-600 bg-rose-50 hover:bg-rose-100 hover:text-rose-700 px-3 py-1.5 rounded-lg text-sm font-semibold transition border border-rose-100">
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Edit Modal */}
      {editingNote && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden transform transition-all border border-slate-200">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-purple-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                Edit Note Details
              </h2>
              <button type="button" onClick={() => setEditingNote(null)} className="text-slate-400 hover:text-slate-600 transition p-1 hover:bg-slate-100 rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            <form onSubmit={handleUpdate} className="p-6 flex flex-col gap-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Note Title</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 font-medium focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 focus:outline-none transition-all placeholder:font-normal"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Note Description</label>
                <textarea
                  value={editDescription}
                  onChange={e => setEditDescription(e.target.value)}
                  placeholder="Additional context or details..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 focus:outline-none transition-all h-32 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 mt-4 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setEditingNote(null)} className="px-5 py-2.5 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2.5 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 shadow-sm transition active:scale-[0.98]">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

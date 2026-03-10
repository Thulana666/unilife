'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SubjectNotesPage() {
    const { data: session } = useSession();
    const params = useParams(); // { semester, subject }
    const router = useRouter();
    const [notes, setNotes] = useState([]);
    const [searchTitle, setSearchTitle] = useState('');
    const [loading, setLoading] = useState(false);

    // Editing State (Owner / Admin only)
    const [editingNote, setEditingNote] = useState(null);
    const [editTitle, setEditTitle] = useState('');
    const [editDescription, setEditDescription] = useState('');

    const decodedSubject = decodeURIComponent(params.subject);

    async function fetchNotes() {
        if (!session) return;
        setLoading(true);
        // We reuse the existing Notes API but add subject filtering manually or via endpoint update.
        // I will update the API route to support the ?subject= parameter shortly.
        const res = await fetch(`/api/notes?year=${session.user.year}&semester=${session.user.semester}&subject=${encodeURIComponent(decodedSubject)}${searchTitle ? `&title=${encodeURIComponent(searchTitle)}` : ''}`);
        if (res.ok) {
            const data = await res.json();
            setNotes(data);
        }
        setLoading(false);
    }

    useEffect(() => {
        fetchNotes();
        // eslint-disable-next-line
    }, [searchTitle, session, params.subject]);

    async function handleDelete(noteId) {
        if (!window.confirm('Are you sure you want to delete this note?')) return;
        const res = await fetch(`/api/notes?id=${noteId}`, { method: 'DELETE' });
        if (res.ok) {
            fetchNotes();
        } else {
            const data = await res.json();
            alert(data.error || 'Failed to delete note');
        }
    }

    function handleDownload(fileUrl, noteId) {
        // Trigger download tracking in background
        fetch(`/api/notes/interact`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'download', noteId })
        }).catch(err => console.error(err));

        // Open file
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

            {/* Breadcrumb & Header */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 w-full relative overflow-hidden">
                <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-indigo-50 rounded-full mix-blend-multiply opacity-50"></div>

                <div className="relative z-10 w-full flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-500 bg-slate-100 w-max px-3 py-1.5 rounded-lg mb-1 shadow-inner border border-slate-200">
                        <Link href={`/dashboard/${params.semester}/notes`} className="hover:text-indigo-600 transition-colors flex items-center gap-1.5">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                            Subjects
                        </Link>
                        <span className="text-slate-400">/</span>
                        <span className="text-indigo-700 font-bold truncate max-w-[150px] sm:max-w-xs">{decodedSubject}</span>
                    </div>
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 w-full">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight leading-tight">{decodedSubject} Materials</h1>
                            <p className="text-slate-500 mt-1 max-w-xl font-medium">Access required reading, lecture slides, and student-shared notes for this module.</p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto mt-2 md:mt-0">
                            <div className="relative flex-grow sm:w-56 md:w-64">
                                <input
                                    type="text"
                                    placeholder="Search by title..."
                                    value={searchTitle}
                                    onChange={e => setSearchTitle(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 focus:outline-none transition-all font-medium text-slate-800 placeholder:text-slate-400"
                                />
                                <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                            </div>

                            {/* Navigate to the global Upload page, passing the subject as a query param constraint */}
                            <Link href={`/dashboard/${params.semester}/notes/upload?subject=${encodeURIComponent(decodedSubject)}`}
                                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 hover:-translate-y-0.5 transition-all shadow-sm shadow-indigo-200 whitespace-nowrap">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                                Upload Note
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-20 min-h-[30vh]">
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-200 border-t-indigo-600"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {notes.length === 0 ? (
                        <div className="col-span-full py-16 bg-white rounded-3xl border border-dashed border-slate-300 flex flex-col items-center justify-center text-center px-4">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100 shadow-inner">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><line x1="10" y1="9" x2="8" y2="9"></line></svg>
                            </div>
                            <h3 className="text-xl font-bold text-slate-700 mb-2 tracking-tight">Folder is empty</h3>
                            <p className="text-slate-500 max-w-sm font-medium mb-6">There are no study materials available for "{decodedSubject}" yet.</p>
                            <Link href={`/dashboard/${params.semester}/notes/upload?subject=${encodeURIComponent(decodedSubject)}`}
                                className="font-bold text-indigo-600 bg-indigo-50 px-6 py-2.5 rounded-xl hover:bg-indigo-100 transition-colors border border-indigo-100">
                                Be the first to upload
                            </Link>
                        </div>
                    ) : (
                        notes.map(note => {
                            const isOwner = note.uploadedBy === session?.user?.email;
                            const canModify = session?.user?.role === 'admin' || isOwner;
                            const isLecturerUpload = note.uploaderRole === 'lecturer';

                            return (
                                <div key={note._id} className={`bg-white rounded-3xl p-6 border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group overflow-hidden ${isLecturerUpload ? 'border-amber-200' : 'border-slate-200'}`}>
                                    {/* Lecturer Banner Highlight (if applicable) */}
                                    {isLecturerUpload ? (
                                        <div className="bg-amber-100/80 text-amber-700 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 flex justify-center -m-6 mb-4 items-center gap-1.5 border-b border-amber-200">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                                            Uploaded by Lecturer
                                        </div>
                                    ) : (
                                        <div className="bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 flex justify-center -m-6 mb-4 items-center gap-1.5 border-b border-emerald-100">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>
                                            Uploaded by Student
                                        </div>
                                    )}

                                    <div>
                                        {/* Card Header */}
                                        <div className="flex justify-between items-start mb-3 gap-2">
                                            <div>
                                                <h3 className="font-extrabold text-slate-800 text-lg leading-tight group-hover:text-indigo-700 transition-colors line-clamp-2" title={note.title}>
                                                    {note.title}
                                                </h3>
                                                <p className="text-xs text-slate-400 font-medium mt-1">
                                                    {new Date(note.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                                                </p>
                                            </div>
                                            {/* Top right interact actions (Ratings / views summary) */}
                                            <div className="flex flex-col items-end gap-1 shrink-0">
                                                <div className="flex items-center gap-1 bg-amber-50 text-amber-600 font-bold text-xs px-2 py-0.5 rounded-lg border border-amber-100 shadow-inner">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                                                    {note.averageRating || 0}
                                                    <span className="text-amber-400 font-medium">({note.ratingCount || 0})</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                                                    {note.downloads || 0}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Description */}
                                        {note.description && (
                                            <p className="text-slate-500 text-sm font-medium leading-relaxed line-clamp-3 mb-4 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                                                {note.description}
                                            </p>
                                        )}

                                        {/* File Metadata */}
                                        <div className="flex items-center gap-2 mb-5">
                                            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100 shadow-sm shrink-0">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold text-slate-700 truncate" title={note.fileName}>{note.fileName || 'Document'}</p>
                                                <p className="text-[10px] text-slate-400 font-bold tracking-wider uppercase">File Attachment</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Footer */}
                                    <div className="pt-4 mt-auto border-t border-slate-100/80 flex justify-between items-center gap-2">
                                        <div className="flex items-center gap-2">
                                            {canModify && (
                                                <div className="flex gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                                                    {isOwner && (
                                                        <button onClick={() => openEditModal(note)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-200" title="Edit text">
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path></svg>
                                                        </button>
                                                    )}
                                                    <button onClick={() => handleDelete(note._id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200" title="Delete note">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Primary Interact Button - Triggers Modals / Preview */}
                                        <button onClick={() => handleDownload(note.fileUrl, note._id)} className="flex items-center justify-center gap-1.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm border border-indigo-100 hover:border-indigo-600 flex-1 ml-auto max-w-[140px]">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                                            Download
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            {/* Edit Modal remains similar */}
            {editingNote && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative animate-in zoom-in-95 duration-200 border border-slate-100">
                        <button onClick={() => setEditingNote(null)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 p-2 rounded-full transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                        <h2 className="text-2xl font-bold mb-6 text-slate-800 tracking-tight flex items-center gap-2">
                            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shadow-inner">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path></svg>
                            </div>
                            Edit Material
                        </h2>
                        <form onSubmit={handleUpdate} className="space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1.5">Title</label>
                                <input
                                    type="text"
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all font-medium text-slate-800"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1.5">Description</label>
                                <textarea
                                    value={editDescription}
                                    onChange={(e) => setEditDescription(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all font-medium text-slate-800 h-28 resize-none"
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setEditingNote(null)} className="px-5 py-2.5 text-slate-600 bg-white border border-slate-200 rounded-xl font-bold hover:bg-slate-50 transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-sm transition-colors flex items-center gap-2">
                                    Update
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

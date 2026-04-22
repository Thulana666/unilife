'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

export default function SubjectNotesPage() {
    const { data: session } = useSession();
    const params = useParams(); // { semester, subject }
    const router = useRouter();
    const [notes, setNotes] = useState([]);
    const [allNotes, setAllNotes] = useState([]); // Store unfiltered notes
    const [searchTitle, setSearchTitle] = useState('');
    const [sortOrder, setSortOrder] = useState('newest'); // 'newest', 'oldest', 'a-z', 'z-a'
    const [loading, setLoading] = useState(false);

    // Native PDF Viewer State
    const [previewFile, setPreviewFile] = useState(null);

    // Editing State (Owner / Admin only)
    const [editingNote, setEditingNote] = useState(null);
    const [editTitle, setEditTitle] = useState('');
    const [editDescription, setEditDescription] = useState('');

    // Deletion State
    const [noteToDelete, setNoteToDelete] = useState(null);

    // Rating & Review State
    const [ratingNote, setRatingNote] = useState(null);
    const [ratingStars, setRatingStars] = useState(0);
    const [ratingHover, setRatingHover] = useState(0);
    const [reviewText, setReviewText] = useState('');
    const [isSubmittingRating, setIsSubmittingRating] = useState(false);

    const STAR_LABELS = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

    const decodedSubject = decodeURIComponent(params.subject);

    async function fetchNotes() {
        if (!session) return;
        setLoading(true);

        const querySem = parseInt(params.semester) || session?.user?.semester || 1;
        const queryYear = Math.ceil(querySem / 2);

        const res = await fetch(`/api/notes?year=${queryYear}&semester=${querySem}&subject=${encodeURIComponent(decodedSubject)}`);
        if (res.ok) {
            const data = await res.json();
            setAllNotes(data);
            applySearchAndSort(data, searchTitle, sortOrder);
        }
        setLoading(false);
    }

    function applySearchAndSort(notesData, search, sort) {
        let filtered = notesData;

        // Client-side search filter by title (case-insensitive)
        if (search.trim()) {
            filtered = filtered.filter(note => 
                note.title.toLowerCase().includes(search.toLowerCase())
            );
        }

        // Apply sorting
        let sorted = [...filtered];
        switch (sort) {
            case 'a-z':
                sorted.sort((a, b) => a.title.localeCompare(b.title));
                break;
            case 'z-a':
                sorted.sort((a, b) => b.title.localeCompare(a.title));
                break;
            case 'oldest':
                sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                break;
            case 'newest':
            default:
                sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                break;
        }

        setNotes(sorted);
    }

    useEffect(() => {
        applySearchAndSort(allNotes, searchTitle, sortOrder);
        // eslint-disable-next-line
    }, [searchTitle, sortOrder]);

    useEffect(() => {
        fetchNotes();
        // eslint-disable-next-line
    }, [session, params.subject]);

    function confirmDelete(note) {
        setNoteToDelete(note);
    }

    async function handleRatingSubmit() {
        if (!session || !ratingNote || ratingStars === 0) {
            toast.error('Please select a star rating');
            return;
        }

        setIsSubmittingRating(true);
        try {
            const ratingRes = await fetch('/api/notes/interact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    noteId: ratingNote._id,
                    action: 'rate',
                    stars: ratingStars
                })
            });

            if (!ratingRes.ok) {
                const error = await ratingRes.json();
                toast.error(error.error || 'Failed to submit rating');
                setIsSubmittingRating(false);
                return;
            }

            if (reviewText.trim()) {
                await fetch('/api/notes/interact', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        noteId: ratingNote._id,
                        action: 'comment',
                        text: reviewText.trim()
                    })
                });
            }

            toast.success('Rating submitted!');
            fetchNotes();
            setRatingNote(null);
            setRatingStars(0);
            setRatingHover(0);
            setReviewText('');
        } catch (error) {
            console.error('Error submitting rating:', error);
            toast.error('Failed to submit rating');
        } finally {
            setIsSubmittingRating(false);
        }
    }

    // Open the rating modal, pre-filling the user's existing rating if any
    function openRatingModal(note) {
        const existingRating = note.ratings?.find(r => r.userEmail === session?.user?.email);
        setRatingNote(note);
        setRatingStars(existingRating?.stars || 0);
        setRatingHover(0);
        setReviewText('');
    }

    async function executeDelete() {
        if (!noteToDelete) return;
        const res = await fetch(`/api/notes?id=${noteToDelete._id}`, { method: 'DELETE' });
        if (res.ok) {
            setNoteToDelete(null);
            fetchNotes();
        } else {
            const data = await res.json();
            alert(data.error || 'Failed to delete note');
            setNoteToDelete(null);
        }
    }

    const handlePreview = async (url, fileName) => {
        if (!url) return;
        
        const lowerUrl = url.toLowerCase();
        const lowerName = (fileName || '').toLowerCase();
        const isPdf = lowerName.endsWith('.pdf') || lowerUrl.includes('.pdf');
        const isImage = lowerName.match(/\.(png|jpg|jpeg|webp)$/) || lowerUrl.match(/\.(png|jpg|jpeg|webp)$/);
        
        if (isPdf || isImage) {
            const proxyUrl = `/api/notes/proxy?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(fileName || '')}`;
            setPreviewFile({ url: proxyUrl, type: isPdf ? 'pdf' : 'image', isBlob: false, originalUrl: url });
        } else {
            toast.error("Inline preview not fully supported for this format. Sending to browser...");
            window.open(url, '_blank', 'noopener,noreferrer');
        }
    };

    async function handleDownload(fileUrl, noteId, fileName) {
        fetch(`/api/notes/interact`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ noteId, action: 'download' })
        }).catch(err => console.error("Download tracking failed:", err));

        toast.success('Initiating download...');
        
        const proxyUrl = `/api/notes/proxy?url=${encodeURIComponent(fileUrl)}&download=true&filename=${encodeURIComponent(fileName || '')}`;
        setTimeout(() => window.open(proxyUrl, '_blank', 'noopener,noreferrer'), 600);
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
            <div className="bg-white dark:bg-slate-900/50 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 w-full relative overflow-hidden">
                <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-indigo-50 dark:bg-indigo-900/20 rounded-full mix-blend-multiply opacity-50"></div>

                <div className="relative z-10 w-full flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 w-max px-3 py-1.5 rounded-lg mb-1 shadow-inner border border-slate-200 dark:border-slate-700/80">
                        <Link href={`/dashboard/${params.semester}/notes`} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1.5">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                            Subjects
                        </Link>
                        <span className="text-slate-400 dark:text-slate-500">/</span>
                        <span className="text-indigo-700 dark:text-indigo-300 font-bold truncate max-w-[150px] sm:max-w-xs">{decodedSubject}</span>
                    </div>
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 w-full">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-slate-200 tracking-tight leading-tight">{decodedSubject} Materials</h1>
                            <p className="text-slate-500 dark:text-slate-400 mt-1 max-w-xl font-medium">Access required reading, lecture slides, and student-shared notes for this module.</p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto mt-2 md:mt-0">
                            <div className="relative flex-grow sm:w-56 md:w-64">
                                <input
                                    type="text"
                                    placeholder="Search by title..."
                                    value={searchTitle}
                                    onChange={e => setSearchTitle(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 focus:outline-none transition-all font-medium text-slate-800 dark:text-slate-200 placeholder:text-slate-400"
                                />
                                <svg className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                            </div>

                            {/* Sort Filter Dropdown */}
                            <select
                                value={sortOrder}
                                onChange={(e) => setSortOrder(e.target.value)}
                                className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 focus:outline-none transition-all font-medium text-slate-800 dark:text-slate-200 w-full sm:w-auto md:max-w-lg"
                            >
                                <option value="newest">Latest First</option>
                                <option value="oldest">Oldest First</option>
                                <option value="a-z">A to Z</option>
                                <option value="z-a">Z to A</option>
                            </select>

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
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-200 dark:border-indigo-800/50 border-t-indigo-600"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {notes.length === 0 ? (
                        <div className="col-span-full py-16 bg-white dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-300 dark:border-slate-600/80 flex flex-col items-center justify-center text-center px-4">
                            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mb-4 border border-slate-100 dark:border-slate-800 shadow-inner">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><line x1="10" y1="9" x2="8" y2="9"></line></svg>
                            </div>
                            <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2 tracking-tight">Folder is empty</h3>
                            <p className="text-slate-500 dark:text-slate-400 max-w-sm font-medium mb-6">There are no study materials available for "{decodedSubject}" yet.</p>
                            <Link href={`/dashboard/${params.semester}/notes/upload?subject=${encodeURIComponent(decodedSubject)}`}
                                className="font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-6 py-2.5 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors border border-indigo-100 dark:border-indigo-900/50">
                                Be the first to upload
                            </Link>
                        </div>
                    ) : (
                        notes.map(note => {
                            const isOwner = note.uploadedBy === session?.user?.email;
                            const canModify = session?.user?.role === 'admin' || isOwner;
                            const isLecturerUpload = note.uploaderRole === 'lecturer';

                            return (
                                <div key={note._id} className={`bg-white dark:bg-slate-900/50 rounded-3xl border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group ${isLecturerUpload ? 'border-amber-200 dark:border-amber-800/50' : 'border-slate-200 dark:border-slate-700/80'}`}>
                                    {/* Lecturer Banner Highlight (if applicable) */}
                                    {isLecturerUpload ? (
                                        <div className="bg-amber-100/80 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 flex justify-center items-center gap-1.5 border-b border-amber-200 dark:border-amber-800/50 rounded-t-3xl">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                                            Uploaded by Lecturer
                                        </div>
                                    ) : (
                                        <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 flex justify-center items-center gap-1.5 border-b border-emerald-100 dark:border-emerald-900/50 rounded-t-3xl">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>
                                            Uploaded by Student
                                        </div>
                                    )}

                                    <div className="p-6 flex flex-col flex-1">
                                    <div>
                                        {/* Card Header */}
                                        <div className="flex justify-between items-start mb-3 gap-2">
                                            <div>
                                                <h3 className="font-extrabold text-slate-800 dark:text-slate-200 text-lg leading-tight group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors line-clamp-2" title={note.title}>
                                                    {note.title}
                                                </h3>
                                                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-1">
                                                    {new Date(note.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                                                </p>
                                            </div>
                                            {/* Top right interact actions (Ratings / views summary) */}
                                            <div className="flex flex-col items-end gap-1 shrink-0">
                                                <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 font-bold text-xs px-2.5 py-1 rounded-lg border border-amber-100 dark:border-amber-900/50 shadow-inner">
                                                    <div className="flex items-center gap-0.5">
                                                        {[1, 2, 3, 4, 5].map((star) => {
                                                            const avg = note.averageRating || 0;
                                                            const filled = star <= Math.floor(avg);
                                                            const half = !filled && star === Math.ceil(avg) && avg % 1 >= 0.3;
                                                            return (
                                                                <svg key={star} xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24"
                                                                    fill={filled ? "currentColor" : "none"}
                                                                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                                                    className={filled ? 'text-amber-400' : half ? 'text-amber-300' : 'text-amber-200'}
                                                                    style={half ? { fill: 'currentColor', opacity: 0.5 } : {}}
                                                                >
                                                                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                                                                </svg>
                                                            );
                                                        })}
                                                    </div>
                                                    <span className="text-amber-700 dark:text-amber-300 font-extrabold">{note.averageRating || 0}</span>
                                                    <span className="text-amber-400 font-medium">({note.ratingCount || 0})</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 text-xs font-medium">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                                                    {note.downloads || 0}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Description */}
                                        {note.description && (
                                            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-relaxed line-clamp-3 mb-4 bg-slate-50 dark:bg-slate-900 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                                                {note.description}
                                            </p>
                                        )}

                                        {/* File Metadata */}
                                        <div className="flex items-center gap-2 mb-5">
                                            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50 shadow-sm shrink-0">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate" title={note.fileName}>{note.fileName || 'Document'}</p>
                                                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold tracking-wider uppercase">File Attachment</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Footer */}
                                    <div className="pt-4 mt-auto border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2">
                                        <div className="flex items-center gap-2 shrink-0">
                                            <button 
                                                onClick={() => openRatingModal(note)}
                                                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors border ${
                                                    note.ratings?.find(r => r.userEmail === session?.user?.email)
                                                        ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/50 hover:bg-amber-100 dark:hover:bg-amber-900/40'
                                                        : 'bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700/80 hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:text-amber-600 dark:hover:text-amber-400 hover:border-amber-200 dark:hover:border-amber-800/50'
                                                }`}
                                                title={note.ratings?.find(r => r.userEmail === session?.user?.email) ? 'Update your rating' : 'Rate this note'}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24"
                                                    fill={note.ratings?.find(r => r.userEmail === session?.user?.email) ? 'currentColor' : 'none'}
                                                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                                                </svg>
                                                {note.ratings?.find(r => r.userEmail === session?.user?.email)
                                                    ? `Your rating: ${note.ratings.find(r => r.userEmail === session?.user?.email).stars}★`
                                                    : 'Rate'}
                                            </button>
                                            {canModify && (
                                                <div className="flex gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                                                    {isOwner && (
                                                        <button onClick={() => openEditModal(note)} className="p-1.5 text-blue-500 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors border border-transparent hover:border-blue-200 dark:hover:border-blue-800/50" title="Edit text">
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path></svg>
                                                        </button>
                                                    )}
                                                    <button onClick={() => confirmDelete(note)} className="p-1.5 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors border border-transparent hover:border-red-200 dark:hover:border-red-800/50" title="Delete note">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Primary Interact Button - Triggers Modals / Preview */}
                                        <div className="flex gap-2 ml-auto flex-wrap justify-end">
                                            <button onClick={() => handlePreview(note.fileUrl, note.fileName)} className="flex items-center justify-center gap-1.5 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-2 rounded-xl text-sm font-bold transition-all shadow-sm border border-slate-200 dark:border-slate-700/80 whitespace-nowrap">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                                Preview
                                            </button>
                                            <button onClick={() => handleDownload(note.fileUrl, note._id, note.fileName)} className="flex items-center justify-center gap-1.5 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-600 text-indigo-700 dark:text-indigo-300 hover:text-white px-3 py-2 rounded-xl text-sm font-bold transition-all shadow-sm border border-indigo-100 dark:border-indigo-900/50 hover:border-indigo-600 whitespace-nowrap">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                                                Download
                                            </button>
                                        </div>
                                    </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            {/* Rest of the modals... (Edit, Delete, Rating, Preview) - code continues but omitted for brevity in this comment */}
            {editingNote && (
                <div className="fixed inset-0 bg-slate-900 dark:bg-slate-950 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900/50 rounded-3xl p-8 max-w-md w-full shadow-2xl relative animate-in zoom-in-95 duration-200 border border-slate-100 dark:border-slate-800">
                        <button onClick={() => setEditingNote(null)} className="absolute top-6 right-6 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800/50 p-2 rounded-full transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                        <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-slate-200 tracking-tight flex items-center gap-2">
                            <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center shadow-inner">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path></svg>
                            </div>
                            Edit Material
                        </h2>
                        <form onSubmit={handleUpdate} className="space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Title</label>
                                <input
                                    type="text"
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all font-medium text-slate-800 dark:text-slate-200"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Description</label>
                                <textarea
                                    value={editDescription}
                                    onChange={(e) => setEditDescription(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all font-medium text-slate-800 dark:text-slate-200 h-28 resize-none"
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setEditingNote(null)} className="px-5 py-2.5 text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/80 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
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

            {noteToDelete && (
                <div className="fixed inset-0 bg-slate-900 dark:bg-slate-950 backdrop-blur-[2px] z-50 flex justify-center items-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900/50 rounded-3xl p-8 max-w-sm w-full shadow-2xl relative animate-in zoom-in-95 duration-200 border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 rounded-full flex items-center justify-center mb-5 shadow-inner">
                            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 tracking-tight mb-2">Delete Note?</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-8 leading-relaxed">
                            Are you absolutely sure you want to delete <span className="font-bold text-slate-700 dark:text-slate-300">"{noteToDelete.fileName}"</span>? This action cannot be undone.
                        </p>

                        <div className="flex gap-3 w-full">
                            <button
                                onClick={() => setNoteToDelete(null)}
                                className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold rounded-xl transition-colors border border-slate-200 dark:border-slate-700/80"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={executeDelete}
                                className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-md shadow-red-500/20 transition-all active:scale-95"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {ratingNote && (
                <div className="fixed inset-0 bg-slate-900 dark:bg-slate-950 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900/50 rounded-3xl p-8 max-w-lg w-full shadow-2xl relative animate-in zoom-in-95 duration-200 border border-slate-100 dark:border-slate-800">
                        <button onClick={() => setRatingNote(null)} className="absolute top-6 right-6 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800/50 p-2 rounded-full transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>

                        {/* Header */}
                        <div className="flex items-center gap-3 mb-1">
                            <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/20 text-amber-500 dark:text-amber-400 rounded-xl flex items-center justify-center shadow-inner shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 tracking-tight">
                                    {ratingNote.ratings?.find(r => r.userEmail === session?.user?.email) ? 'Update Rating' : 'Rate & Review'}
                                </h2>
                                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium truncate max-w-xs">{ratingNote.title}</p>
                            </div>
                        </div>

                        <div className="space-y-5 mt-6">
                            {/* Interactive star picker */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Your Rating</label>
                                <div className="flex flex-col items-center gap-2">
                                    <div className="flex gap-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                onClick={() => setRatingStars(star)}
                                                onMouseEnter={() => setRatingHover(star)}
                                                onMouseLeave={() => setRatingHover(0)}
                                                className="transition-transform hover:scale-125 focus:outline-none"
                                            >
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    width="44" height="44"
                                                    viewBox="0 0 24 24"
                                                    fill={star <= (ratingHover || ratingStars) ? 'currentColor' : 'none'}
                                                    stroke="currentColor" strokeWidth="1.5"
                                                    strokeLinecap="round" strokeLinejoin="round"
                                                    className={`transition-colors ${
                                                        star <= (ratingHover || ratingStars) ? 'text-amber-400' : 'text-slate-200'
                                                    }`}
                                                >
                                                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                                                </svg>
                                            </button>
                                        ))}
                                    </div>
                                    {/* Star label */}
                                    <p className={`text-sm font-bold transition-colors ${
                                        (ratingHover || ratingStars) ? 'text-amber-500 dark:text-amber-400' : 'text-slate-300'
                                    }`}>
                                        {STAR_LABELS[ratingHover || ratingStars] || 'Select a rating'}
                                    </p>
                                </div>
                            </div>

                            {/* Review textarea */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Write a Review <span className="font-normal text-slate-400 dark:text-slate-500">(optional)</span></label>
                                <textarea
                                    value={reviewText}
                                    onChange={(e) => setReviewText(e.target.value)}
                                    placeholder="Share your thoughts about these notes..."
                                    maxLength={300}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 focus:outline-none transition-all font-medium text-slate-800 dark:text-slate-200 resize-none h-24 placeholder:text-slate-400"
                                />
                                <p className="text-right text-[11px] text-slate-400 dark:text-slate-500 mt-1">{reviewText.length}/300</p>
                            </div>

                            {/* Existing community comments */}
                            {ratingNote.comments?.length > 0 && (
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Community Reviews ({ratingNote.comments.length})</label>
                                    <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                                        {ratingNote.comments.map((c, i) => {
                                            // Find this commenter's star rating
                                            const commenterRating = ratingNote.ratings?.find(r => r.userEmail === c.userEmail);
                                            const stars = commenterRating?.stars || 0;
                                            return (
                                                <div key={i} className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl px-3 py-2.5">
                                                    <div className="flex items-center justify-between mb-1 gap-2">
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{c.userName || 'Anonymous'}</span>
                                                            {/* Commenter's star rating */}
                                                            {stars > 0 && (
                                                                <div className="flex items-center gap-0.5 shrink-0">
                                                                    {[1,2,3,4,5].map(s => (
                                                                        <svg key={s} xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24"
                                                                            fill={s <= stars ? 'currentColor' : 'none'}
                                                                            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                                                            className={s <= stars ? 'text-amber-400' : 'text-slate-300'}
                                                                        >
                                                                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                                                                        </svg>
                                                                    ))}
                                                                    <span className="text-[10px] font-bold text-amber-500 dark:text-amber-400 ml-0.5">{stars}.0</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0">
                                                            {new Date(c.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{c.text}</p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3 pt-6 mt-4 border-t border-slate-100 dark:border-slate-800">
                            <button type="button" onClick={() => setRatingNote(null)} className="flex-1 px-5 py-3 text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/80 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                                Cancel
                            </button>
                            <button
                                onClick={handleRatingSubmit}
                                disabled={isSubmittingRating || ratingStars === 0}
                                className="flex-1 px-6 py-3 bg-amber-400 hover:bg-amber-500 text-slate-900 dark:text-white rounded-xl font-bold shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isSubmittingRating ? (
                                    <><div className="w-4 h-4 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin"></div> Submitting...</>
                                ) : (
                                    ratingNote.ratings?.find(r => r.userEmail === session?.user?.email) ? 'Update Rating' : 'Submit Rating'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {previewFile && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900 dark:bg-slate-950 backdrop-blur-sm p-4 sm:p-6 lg:p-8 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900/50 rounded-[2rem] shadow-2xl overflow-hidden w-full max-w-7xl h-full max-h-[92vh] flex flex-col relative animate-in zoom-in-95 duration-200 border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 shrink-0">
                            <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-200">Document Viewer</h2>
                            <button onClick={() => setPreviewFile(null)} className="text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 bg-white dark:bg-slate-900/50 hover:bg-red-50 dark:hover:bg-red-900/20 border border-slate-200 dark:border-slate-700/80 hover:border-red-200 dark:hover:border-red-800/50 p-2.5 rounded-xl transition-all">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>

                        <div className="flex-1 w-full relative bg-slate-800 dark:bg-slate-200 flex items-center justify-center overflow-auto">
                            {previewFile.type === 'pdf' ? (
                                <object data={previewFile.url} type="application/pdf" className="w-full h-full max-w-full" />
                            ) : (
                                //eslint-disable-next-line @next/next/no-img-element
                                <img src={previewFile.url} alt="Note Preview" className="max-w-full max-h-full object-contain" />
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
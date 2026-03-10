// Notes Upload Page
'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function UploadNote() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();

  // If we came from a specific subject folder, default to it
  const defaultSubject = searchParams.get('subject') || '';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState(defaultSubject);
  const [file, setFile] = useState(null);

  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Fallback to year 1 / sem 1 if session takes a sec
  const queryYear = session?.user?.year || 1;
  const querySem = session?.user?.semester || 1;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title || !file || !subject) {
      setMessage('Title, Subject, and File are required.');
      return;
    }
    if (!session) {
      setMessage('You must be logged in.');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('subject', subject);
    formData.append('file', file);
    formData.append('year', queryYear);
    formData.append('semester', querySem);

    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (res.ok) {
        setMessage('Note uploaded successfully!');
        setTitle('');
        setDescription('');
        setFile(null);

        // After 2 seconds, redirect them back to the newly created Subject page
        setTimeout(() => {
          router.push(`/dashboard/${querySem}/notes/${encodeURIComponent(subject)}`);
        }, 1500);

      } else {
        setMessage(data.error || 'Upload failed.');
      }
    } catch (err) {
      setMessage('A network error occurred.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
            </div>
            Upload Notes
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Share lecture slides, study guides, and resources to a specific Module.</p>
        </div>

        <Link href={`/dashboard/${querySem}/notes${defaultSubject ? `/${encodeURIComponent(defaultSubject)}` : ''}`}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition shadow-sm text-sm whitespace-nowrap">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          Back
        </Link>
      </div>

      {/* Upload Form Card */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -z-0 opacity-50"></div>

        <form onSubmit={handleSubmit} className="relative z-10 flex flex-col gap-6">

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Subject / Module <span className="text-red-500">*</span></label>
            <input
              type="text"
              placeholder="e.g. SE2030 Software Engineering"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition-all placeholder:font-normal placeholder:text-slate-400"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Note Title <span className="text-red-500">*</span></label>
            <input
              type="text"
              placeholder="e.g. Chapter 1 Summary"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition-all placeholder:font-normal placeholder:text-slate-400"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Description <span className="text-slate-400 font-normal">(Optional)</span></label>
            <textarea
              placeholder="Add key takeaways or topics covered..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition-all h-28 resize-none placeholder:font-normal placeholder:text-slate-400"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">File <span className="text-red-500">*</span></label>
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-slate-200 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100/50 hover:border-indigo-400 transition-colors group">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {file ? (
                    <div className="flex flex-col items-center text-indigo-600">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><path d="M12 18v-6"></path><path d="M9 15l3 3 3-3"></path></svg>
                      <p className="font-bold text-sm max-w-[200px] truncate text-slate-800">{file.name}</p>
                      <p className="text-xs font-medium text-slate-500 mt-1">Ready to upload</p>
                    </div>
                  ) : (
                    <>
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 mb-3 group-hover:scale-110 transition-transform">
                        <svg className="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                      </div>
                      <p className="mb-1 text-sm text-slate-600 font-bold">Click to browse or drag and drop</p>
                      <p className="text-xs text-slate-400 font-medium">PDF, DOCX, PPTX</p>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.docx,.ppt,.pptx"
                  onChange={e => setFile(e.target.files[0])}
                />
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex flex-col md:flex-row items-center gap-4 justify-between mt-2">
            {message && (
              <div className={`text-sm font-bold px-4 py-3 rounded-xl w-full md:w-auto text-center flex items-center gap-2 ${message.includes('successfully') ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
                {message.includes('successfully') ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                )}
                {message}
              </div>
            )}
            {!message && <div></div> /* flex spacer */}

            <button
              type="submit"
              className="w-full md:w-auto bg-indigo-600 text-white font-bold px-8 py-3.5 rounded-xl hover:bg-indigo-700 shadow-sm transition-all active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Uploading...
                </>
              ) : (
                <>
                  Upload Material
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

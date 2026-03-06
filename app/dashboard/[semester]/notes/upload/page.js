// Notes Upload Page
'use client';
import { useState } from 'react';
import { useSession } from 'next-auth/react';

export default function UploadNote() {
  const { data: session } = useSession();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title || !file) {
      setMessage('Title and file are required.');
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
    formData.append('file', file);
    formData.append('year', session.user.year);
    formData.append('semester', session.user.semester);
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
    } else {
      setMessage(data.error || 'Upload failed.');
    }
    setLoading(false);
  }

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
            </div>
            Upload Notes
          </h1>
          <p className="text-slate-500 mt-2">Share lecture slides, study guides, and resources with your peers.</p>
        </div>

        <a href={`/dashboard/${session?.user?.semester || 1}/notes`} className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition shadow-sm text-sm whitespace-nowrap">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          Back to Notes
        </a>
      </div>

      {/* Upload Form Card */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-bl-full -z-0 opacity-50"></div>

        <form onSubmit={handleSubmit} className="relative z-10 flex flex-col gap-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Note Title <span className="text-red-500">*</span></label>
            <input
              type="text"
              placeholder="e.g. Chapter 1 Summary"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-medium focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 focus:outline-none transition-all placeholder:font-normal"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Description <span className="text-slate-400 font-normal">(Optional)</span></label>
            <textarea
              placeholder="Add key takeaways or topics covered..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 focus:outline-none transition-all h-28 resize-none placeholder:text-slate-400"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">File <span className="text-red-500">*</span></label>
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-200 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100/50 hover:border-purple-400 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {file ? (
                    <div className="flex flex-col items-center text-purple-600">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><path d="M12 18v-6"></path><path d="M9 15l3 3 3-3"></path></svg>
                      <p className="font-semibold text-sm max-w-[200px] truncate">{file.name}</p>
                    </div>
                  ) : (
                    <>
                      <svg className="w-8 h-8 mb-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                      <p className="mb-1 text-sm text-slate-500 font-semibold">Click to browse or drag and drop</p>
                      <p className="text-xs text-slate-400">PDF, DOCX, PPTX</p>
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

          <div className="pt-4 border-t border-slate-100 flex flex-col md:flex-row items-center gap-4 justify-between">
            {message && (
              <div className={`text-sm font-semibold p-3 rounded-xl w-full md:w-auto text-center ${message.includes('successfully') ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                {message}
              </div>
            )}
            {!message && <div></div> /* spacer */}

            <button
              type="submit"
              className="w-full md:w-auto bg-purple-600 text-white font-bold px-8 py-3 rounded-xl hover:bg-purple-700 shadow-sm transition-all active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Uploading...
                </>
              ) : (
                'Upload Note'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

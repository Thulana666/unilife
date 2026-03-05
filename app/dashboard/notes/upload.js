// Notes Upload Page (Lecturer Only)
'use client';
import { useState } from 'react';
import { useSession } from 'next-auth/react';

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
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Upload Notes</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="border px-2 py-1 rounded"
        />
        <textarea
          placeholder="Description (optional)"
          value={description}
          onChange={e => setDescription(e.target.value)}
          className="border px-2 py-1 rounded"
        />
        <input
          type="file"
          accept=".pdf,.docx,.ppt,.pptx"
          onChange={e => setFile(e.target.files[0])}
          className="border px-2 py-1 rounded"
        />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded" disabled={loading}>
          {loading ? 'Uploading...' : 'Upload'}
        </button>
        {message && <div className="text-center text-red-600">{message}</div>}
      </form>
    </div>
  );
}

// Notes Dashboard Page for Students and Lecturers
'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

export default function NotesDashboard() {
  const { data: session } = useSession();
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);

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
      alert('Failed to delete note');
    }
  }

  function handleDownload(fileUrl) {
    window.open(fileUrl, '_blank');
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Notes Dashboard</h1>
      <div className="flex gap-2 mb-4 items-center">
        <input
          type="text"
          placeholder="Search by title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="border px-2 py-1 rounded"
        />
        <button onClick={fetchNotes} className="bg-blue-500 text-white px-3 py-1 rounded">Search</button>
        {session?.user?.role !== 'student' && (
          <a href="/dashboard/notes/upload" className="bg-purple-600 text-white px-3 py-1 rounded ml-4">Upload Note</a>
        )}
      </div>
      {loading ? <div>Loading...</div> : (
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border">Title</th>
              <th className="p-2 border">Description</th>
              <th className="p-2 border">Uploaded By</th>
              <th className="p-2 border">Created At</th>
              <th className="p-2 border">Download</th>
              {session?.user?.role !== 'student' && <th className="p-2 border">Delete</th>}
            </tr>
          </thead>
          <tbody>
            {notes.map(note => (
              <tr key={note._id}>
                <td className="p-2 border">{note.title}</td>
                <td className="p-2 border">{note.description}</td>
                <td className="p-2 border">{note.uploadedBy}</td>
                <td className="p-2 border">{new Date(note.createdAt).toLocaleDateString()}</td>
                <td className="p-2 border">
                  <button onClick={() => handleDownload(note.fileUrl)} className="bg-green-500 text-white px-2 py-1 rounded">Download</button>
                </td>
                {session?.user?.role !== 'student' && (
                  <td className="p-2 border">
                    <button onClick={() => handleDelete(note._id)} className="bg-red-500 text-white px-2 py-1 rounded">Delete</button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

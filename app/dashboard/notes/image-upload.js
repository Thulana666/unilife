// Example: Image upload form using Cloudinary API
'use client';
import { useState } from 'react';

export default function ImageUpload() {
  const [file, setFile] = useState(null);
  const [url, setUrl] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file) {
      setMessage('Please select an image.');
      return;
    }
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/image-upload', {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    if (res.ok) {
      setUrl(data.url);
      setMessage('Upload successful!');
    } else {
      setMessage(data.error || 'Upload failed.');
    }
    setLoading(false);
  }

  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">Upload Image</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="file"
          accept="image/*"
          onChange={e => setFile(e.target.files[0])}
        />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded" disabled={loading}>
          {loading ? 'Uploading...' : 'Upload'}
        </button>
        {message && <div className="text-center text-red-600">{message}</div>}
        {url && <img src={url} alt="Uploaded" className="mt-4 max-h-64" />}
      </form>
    </div>
  );
}

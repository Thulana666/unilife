"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function AssignmentPage() {

  const { semester } = useParams();
  const [assignments, setAssignments] = useState([]);
  const [user, setUser] = useState(null);
  const [mounted, setMounted] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");

  // Load user from localStorage on client side only
  useEffect(() => {
    setMounted(true);
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // Fetch
  const fetchAssignments = async () => {
    if (!user) return;
    const res = await fetch(
      `/api/assignments?userId=${user._id}&semester=${semester}`
    );
    const data = await res.json();
    setAssignments(data);
  };

  useEffect(() => {
    if (user) {
      fetchAssignments();
    }
  }, [user]);

  // Add
  const addAssignment = async () => {
    await fetch("/api/assignments", {
      method: "POST",
      body: JSON.stringify({
        title,
        description,
        dueDate,
        userId: user._id,
        year: user.year,
        semester: user.semester
      }),
    });

    setTitle("");
    setDescription("");
    setDueDate("");

    fetchAssignments();
  };

  // Update status
  const updateStatus = async (id, status) => {
    await fetch("/api/assignments", {
      method: "PUT",
      body: JSON.stringify({
        id,
        status
      }),
    });

    fetchAssignments();
  };

  // Delete
  const deleteAssignment = async (id) => {
    await fetch("/api/assignments", {
      method: "DELETE",
      body: JSON.stringify({ id }),
    });

    fetchAssignments();
  };

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted || !user) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Assignment Tracker</h1>

      <div className="mt-4 space-y-2">
        <input
          placeholder="Title"
          className="border p-2 w-full"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <textarea
          placeholder="Description"
          className="border p-2 w-full"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <input
          type="date"
          className="border p-2 w-full"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />

        <button
          onClick={addAssignment}
          className="bg-blue-500 text-white px-4 py-2"
        >
          Add Assignment
        </button>
      </div>

      <div className="mt-6">
        {assignments.map((a) => (
          <div key={a._id} className="border p-4 mb-3 rounded">
            <h2 className="font-bold">{a.title}</h2>
            <p>{a.description}</p>
            <p>Due: {new Date(a.dueDate).toDateString()}</p>
            <p>Status: {a.status}</p>

            <div className="mt-2 space-x-2">
              <button
                onClick={() => updateStatus(a._id, "submitted")}
                className="bg-green-500 text-white px-2 py-1"
              >
                Submit
              </button>

              <button
                onClick={() => deleteAssignment(a._id)}
                className="bg-red-500 text-white px-2 py-1"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
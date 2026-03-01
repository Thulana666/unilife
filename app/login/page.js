"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [year, setYear] = useState(1);
  const [semester, setSemester] = useState(1);

  const handleLogin = () => {
    // validate SLIIT email
    if (!email.endsWith("@my.sliit.lk")) {
      alert("Use SLIIT email!");
      return;
    }

    const user = {
      _id: String(Date.now()), // fake ID as string
      name,
      email,
      year: Number(year),
      semester: Number(semester),
    };

    // store in localStorage
    localStorage.setItem("user", JSON.stringify(user));

    // redirect to dashboard
    router.push("/dashboard");
  };

  return (
    <div className="h-screen flex items-center justify-center">
      <div className="border p-6 w-96 rounded">
        <h1 className="text-xl font-bold mb-4">Login / Register</h1>

        <input
          placeholder="Name"
          className="border p-2 w-full mb-2"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          placeholder="Email"
          className="border p-2 w-full mb-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <select
          className="border p-2 w-full mb-2"
          value={year}
          onChange={(e) => setYear(e.target.value)}
        >
          <option value={1}>Year 1</option>
          <option value={2}>Year 2</option>
          <option value={3}>Year 3</option>
          <option value={4}>Year 4</option>
        </select>

        <select
          className="border p-2 w-full mb-4"
          value={semester}
          onChange={(e) => setSemester(e.target.value)}
        >
          <option value={1}>Semester 1</option>
          <option value={2}>Semester 2</option>
        </select>

        <button
          onClick={handleLogin}
          className="bg-blue-500 text-white w-full py-2"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
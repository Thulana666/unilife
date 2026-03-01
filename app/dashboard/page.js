"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const router = useRouter();

  useEffect(() => {
    const userStr = localStorage.getItem("user");

    if (!userStr) {
      router.push("/login");
      return;
    }

    const user = JSON.parse(userStr);

    // auto redirect to assignments for user's semester
    router.push(`/dashboard/assignments/${user.semester}`);
  }, [router]);

  return <div className="p-6">Loading...</div>;
}

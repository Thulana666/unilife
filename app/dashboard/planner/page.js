"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function PlannerRedirect() {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === "loading") return;

        if (status === "unauthenticated") {
            router.replace("/login");
            return;
        }

        // Get the user's year and semester from session
        const year = session?.user?.year || 1;
        const semester = session?.user?.semester || 1;

        // Redirect to their correct semester planner
        // URL format: /dashboard/planner/year1semester2
        router.replace(`/dashboard/planner/year${year}semester${semester}`);
    }, [session, status, router]);

    // Show a brief loading state while redirecting
    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F4F7FE]">
            <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#4318FF]"></div>
                <p className="text-[#707EAE] font-bold text-sm tracking-widest animate-pulse">
                    LOADING YOUR PLANNER...
                </p>
            </div>
        </div>
    );
}

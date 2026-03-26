// Admin and Lecturer redirect logic. We simply point them to /dashboard/1/notes.
'use client';
import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function NotesRedirect() {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === 'loading') return;
        if (!session) {
            router.replace('/login');
        } else {
            // For Admin and Lecturer, send them to the general semester 1 dashboard view first 
            // (or let them pick semesters if we added a cross-semester dropdown).
            // Since our UI is nested under [semester], let's route them there.
            const semester = session.user.semester || 1;
            router.replace(`/dashboard/${semester}/notes`);
        }
    }, [session, status, router]);

    return (
        <div className="flex justify-center items-center py-20 min-h-[30vh]">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-200 border-t-indigo-600"></div>
        </div>
    );
}

// Redirect /dashboard/notes to the user's semester notes page
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
      // Default to user's year/semester, or fallback to 1
      const year = session.user.year || 1;
      const semester = session.user.semester || 1;
      router.replace(`/dashboard/${semester}/notes`);
    }
  }, [session, status, router]);

  return <div className="p-8 text-center">Redirecting to your notes...</div>;
}

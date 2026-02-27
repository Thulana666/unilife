"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function Dashboard() {

const { data: session, status } = useSession();

const router = useRouter();

if (status === "loading") return <p>Loading...</p>;

if (!session) {

router.push("/login");

return null;

}

const year = session.user.year;
const semester = session.user.semester;

return (

<div style={{ padding: "40px" }}>

<h1>Welcome {session.user.name}</h1>

<p>

Year {year} Semester {semester}

</p>

<br/>

<button
onClick={() =>
router.push(`/dashboard/assignments/y${year}s${semester}`)
}
>

Assignment Tracker

</button>

<br/><br/>

<button
onClick={() =>
router.push(`/dashboard/chat/y${year}s${semester}`)
}
>

Community Chat

</button>

<br/><br/>

<button
onClick={() =>
router.push(`/dashboard/notes/y${year}s${semester}`)
}
>

Notes Sharing

</button>

<br/><br/>

<button
onClick={() =>
router.push(`/dashboard/planner/y${year}s${semester}`)
}
>

Study Planner

</button>

<br/><br/><br/>

<button
onClick={() =>
signOut({ callbackUrl: "/login" })
}
>

Logout

</button>

</div>

);

}

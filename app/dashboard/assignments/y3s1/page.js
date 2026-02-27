"use client";

import { useSession } from "next-auth/react";

export default function AssignmentPage() {

const { data: session } = useSession();

return (

<div>

<h1>Assignment Tracker</h1>

<p>

Welcome {session?.user?.name}

</p>

<p>

Year {session?.user?.year} Semester {session?.user?.semester}

</p>

</div>

);

}

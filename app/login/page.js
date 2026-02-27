"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {

const router = useRouter();

const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [error, setError] = useState("");

const handleLogin = async (e) => {

e.preventDefault();

setError("");

if (!email || !password) {

setError("Enter email and password");

return;

}

const result = await signIn("credentials", {

email,
password,
redirect: false

});

if (result.error) {

setError("Invalid email or password");

} else {

router.push("/dashboard");

}

};

return (

<div style={{ padding: "40px" }}>

<h2>Login</h2>

<form onSubmit={handleLogin}>

<input
type="email"
placeholder="SLIIT Email"
onChange={(e) => setEmail(e.target.value)}
/>

<br/><br/>

<input
type="password"
placeholder="Password"
onChange={(e) => setPassword(e.target.value)}
/>

<br/><br/>

<button type="submit">Login</button>

</form>

{error && <p style={{ color: "red" }}>{error}</p>}

<p>

If you don't have an account{" "}

<Link href="/register">

<b>Register</b>

</Link>

</p>

</div>

);

}

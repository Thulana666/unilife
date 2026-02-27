"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {

const router = useRouter();

const [form, setForm] = useState({
name: "",
email: "",
password: "",
year: "",
semester: ""
});

const [error, setError] = useState("");
const [success, setSuccess] = useState("");

const handleChange = (e) => {

setForm({
...form,
[e.target.name]: e.target.value
});

};

const handleRegister = async (e) => {

e.preventDefault();

setError("");
setSuccess("");

const res = await fetch("/api/register", {

method: "POST",

headers: {
"Content-Type": "application/json"
},

body: JSON.stringify(form)

});

const data = await res.json();

if (!res.ok) {

setError(data.error);

} else {

setSuccess(data.message);

setTimeout(() => {
router.push("/login");
}, 2000);

}

};

return (

<div style={{ padding: "40px" }}>

<h2>Register</h2>

<form onSubmit={handleRegister}>

<input name="name" placeholder="Name" onChange={handleChange} />

<br/><br/>

<input name="email" placeholder="SLIIT Email" onChange={handleChange} />

<br/><br/>

<input name="password" type="password" placeholder="Password" onChange={handleChange} />

<br/><br/>

<input name="year" placeholder="Year (1-4)" onChange={handleChange} />

<br/><br/>

<input name="semester" placeholder="Semester (1-2)" onChange={handleChange} />

<br/><br/>

<button type="submit">Register</button>

</form>

{error && <p style={{ color: "red" }}>{error}</p>}

{success && <p style={{ color: "green" }}>{success}</p>}

</div>

);

}

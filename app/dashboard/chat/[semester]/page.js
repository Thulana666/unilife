"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";

export default function ChatPage() {

const { data: session } = useSession();

const [messages, setMessages] = useState([]);

const [text, setText] = useState("");

const year = session?.user?.year;
const semester = session?.user?.semester;


// Load messages

useEffect(() => {

fetch(`/api/chat?year=${year}&semester=${semester}`)

.then(res => res.json())

.then(data => setMessages(data));

}, [year, semester]);


// Send message

const sendMessage = async () => {

if (!text) return;

await fetch("/api/chat", {

method: "POST",

headers: {
"Content-Type": "application/json"
},

body: JSON.stringify({

text,
sender: session.user.name,
year,
semester

})

});

setText("");

// reload messages

const res = await fetch(`/api/chat?year=${year}&semester=${semester}`);

setMessages(await res.json());

};


return (

<div style={{ padding: "20px" }}>

<h2>

Community Chat

</h2>


<div style={{

border: "1px solid gray",

height: "300px",

overflow: "scroll",

padding: "10px"

}}>


{messages.map((msg, i) => (

<p key={i}>

<b>{msg.sender}</b>: {msg.text}

</p>

))}


</div>


<br/>


<input

value={text}

onChange={(e) => setText(e.target.value)}

placeholder="Enter message"

/>


<button onClick={sendMessage}>

Send

</button>


</div>

);

}

import connectDB from "@/lib/db";
import Message from "@/models/Message";

// GET messages

export async function GET(req) {

await connectDB();

const { searchParams } = new URL(req.url);

const year = searchParams.get("year");
const semester = searchParams.get("semester");

const messages = await Message.find({
year,
semester
}).sort({ createdAt: 1 });

return Response.json(messages);

}


// SEND message

export async function POST(req) {

await connectDB();

const body = await req.json();

const message = await Message.create(body);

return Response.json(message);

}

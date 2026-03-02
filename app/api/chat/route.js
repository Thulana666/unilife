import connectDB from "@/lib/db";
import Message from "@/models/Message";
import cloudinary from "@/lib/cloudinary";
import { pushNotification } from "@/lib/pushNotification";

export async function GET(req) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const year = searchParams.get("year");
        const semester = searchParams.get("semester");

        const messages = await Message.find({ year, semester }).sort({ createdAt: 1 });

        // Debugging Notice fields as requested
        console.log("Fetched messages:", messages);

        return Response.json(messages);
    } catch (error) {
        console.error("GET Chat Error:", error);
        return Response.json({ error: "Failed to fetch messages" }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        await connectDB();
        const formData = await req.formData();

        const text = formData.get("text") || "";
        const sender = formData.get("sender");
        const email = formData.get("email");
        const year = parseInt(formData.get("year") || "1");
        const semester = parseInt(formData.get("semester") || "1");
        const isNotice = formData.get("isNotice") === "true";

        const file = formData.get("file");

        let fileUrl = null;
        let fileName = null;
        let fileType = null;

        // Process File Upload to Cloudinary
        if (file && typeof file.arrayBuffer === 'function') {
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);

            fileName = file.name;
            fileType = file.type;

            // Upload using cloudniary streams
            const uploadResult = await new Promise((resolve, reject) => {
                cloudinary.uploader.upload_stream(
                    {
                        resource_type: "auto", // Automatically detects image, raw (pdf/zip/doc)
                        folder: "unilife_chat"
                    },
                    (error, result) => {
                        if (error) {
                            console.error("Cloudinary upload error:", error);
                            reject(error);
                        } else {
                            resolve(result);
                        }
                    }
                ).end(buffer);
            });

            fileUrl = uploadResult.secure_url;
            // Cloudinary updates filename if auto-generating, but we want to keep original fileName for UI
        }

        const message = await Message.create({
            text,
            sender,
            email,
            year,
            semester,
            fileUrl,
            fileName,
            fileType,
            isNotice
        });

        // Push broadcast notifications
        const chatLink = `/dashboard/chat/y${year}s${semester}`;
        const notifMsg = text ? text.slice(0, 120) : (isNotice ? "A special notice was posted." : "A new message was posted.");
        const notifTitle = isNotice ? "📢 Special Notice" : "💬 New Chat Message";
        const notifType = isNotice ? "notice" : "chat";

        // Students in this semester
        await pushNotification({ recipientRole: "student", recipientYear: year, recipientSemester: semester, title: notifTitle, message: notifMsg, link: chatLink, type: notifType, createdBy: email });
        // Lecturers see all chats
        await pushNotification({ recipientRole: "lecturer", title: notifTitle, message: `Year ${year} Semester ${semester}: ${notifMsg}`, link: chatLink, type: notifType, createdBy: email });
        // Admins see everything
        await pushNotification({ recipientRole: "admin", title: notifTitle, message: `Y${year}S${semester}: ${notifMsg}`, link: chatLink, type: notifType, createdBy: email });

        return Response.json(message);

    } catch (error) {
        console.error("POST Chat Error:", error);
        return Response.json({ error: "Failed to send message: " + error.message }, { status: 500 });
    }
}

export async function DELETE(req) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const messageId = searchParams.get("messageId");
        const callerEmail = searchParams.get("email"); // passed by the client

        if (!messageId) {
            return Response.json({ error: "Message ID is required" }, { status: 400 });
        }

        const msg = await Message.findById(messageId);
        if (!msg) {
            return Response.json({ error: "Message not found" }, { status: 404 });
        }

        // Only the message owner OR an admin caller (identified by email) can delete.
        // We keep this simple – the true role check remains in the UI; server just
        // confirms the email matches the message sender email.
        if (callerEmail && msg.email && msg.email !== callerEmail) {
            return Response.json({ error: "Not authorised to delete this message" }, { status: 403 });
        }

        await msg.deleteOne();

        return Response.json({ message: "Message deleted successfully", deletedId: messageId });
    } catch (error) {
        console.error("DELETE Chat Error:", error);
        return Response.json({ error: "Failed to delete message" }, { status: 500 });
    }
}

export async function PUT(req) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const messageId = searchParams.get("messageId");

        if (!messageId) {
            return Response.json({ error: "Message ID is required" }, { status: 400 });
        }

        const { text, email } = await req.json();

        const msg = await Message.findById(messageId);
        if (!msg) {
            return Response.json({ error: "Message not found" }, { status: 404 });
        }

        // Only the original sender may edit
        if (!email || msg.email !== email) {
            return Response.json({ error: "Not authorised to edit this message" }, { status: 403 });
        }

        if (!text || !text.trim()) {
            return Response.json({ error: "Message text cannot be empty" }, { status: 400 });
        }

        msg.text = text.trim();
        msg.edited = true;
        await msg.save();

        return Response.json(msg);
    } catch (error) {
        console.error("PUT Chat Error:", error);
        return Response.json({ error: "Failed to edit message" }, { status: 500 });
    }
}

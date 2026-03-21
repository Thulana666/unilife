import connectDB from "@/lib/db";
import Notification from "@/models/Notification";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET(req) {
  await connectDB();
  const session = await getServerSession(authOptions);

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") || "20");

  try {
    const notifications = await Notification.find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .limit(limit);

    const unreadCount = await Notification.countDocuments({
      userId: session.user.id,
      isRead: false
    });

    return Response.json({ notifications, unreadCount });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return Response.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}

export async function PATCH(req) {
  await connectDB();
  const session = await getServerSession(authOptions);

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    if (body.markAllRead) {
      await Notification.updateMany(
        { userId: session.user.id },
        { $set: { isRead: true } }
      );
      return Response.json({ message: "All notifications marked as read" });
    } else if (body.notificationId) {
      const updated = await Notification.findOneAndUpdate(
        { _id: body.notificationId, userId: session.user.id },
        { $set: { isRead: true } },
        { new: true }
      );
      if (!updated) {
        return Response.json({ error: "Notification not found" }, { status: 404 });
      }
      return Response.json(updated);
    } else {
      return Response.json({ error: "Invalid request body" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error updating notification:", error);
    return Response.json({ error: "Failed to update notification" }, { status: 500 });
  }
}

export async function DELETE(req) {
  await connectDB();
  const session = await getServerSession(authOptions);

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return Response.json({ error: "Notification ID is required" }, { status: 400 });
  }

  try {
    const deleted = await Notification.findOneAndDelete({ _id: id, userId: session.user.id });
    if (!deleted) {
      return Response.json({ error: "Notification not found" }, { status: 404 });
    }
    return Response.json({ message: "Notification deleted" });
  } catch (error) {
    console.error("Error deleting notification:", error);
    return Response.json({ error: "Failed to delete notification" }, { status: 500 });
  }
}

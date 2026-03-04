/**
 * pushNotification – lightweight server-side helper (broadcast model).
 *
 * Creates a notification targeted at a role+year+semester combination.
 * The API query engine filters these at read-time per user.
 *
 * Usage:
 *   import { pushNotification } from "@/lib/pushNotification";
 *   await pushNotification({
 *     recipientRole: "student",   // "student" | "lecturer" | "admin" | "all"
 *     recipientYear: 3,           // omit or null → all years
 *     recipientSemester: 2,       // omit or null → all semesters
 *     title: "New Assignment",
 *     message: "Assignment added for Y3S2",
 *     link: "/dashboard/assignments",
 *     type: "assignment",         // assignment | planner | notes | chat | notice | user | system
 *   });
 */

import connectDB from "@/lib/db";
import Notification from "@/models/Notification";

export async function pushNotification({
    recipientRole,
    recipientYear = null,
    recipientSemester = null,
    title,
    message,
    link = "/dashboard",
    type = "system",
    createdBy = null,
}) {
    try {
        await connectDB();
        await Notification.create({
            recipientRole,
            recipientYear: recipientYear ?? null,
            recipientSemester: recipientSemester ?? null,
            title,
            message,
            link,
            type,
            createdBy,
        });
    } catch (err) {
        console.error("[pushNotification] error:", err);
    }
}

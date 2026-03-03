import connectDB from "@/lib/db";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import bcrypt from "bcrypt";

// GET /api/profile — return current user's profile
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return Response.json({ error: "Unauthorised" }, { status: 401 });

        await connectDB();

        const user = await User.findOne({ email: session.user.email }).select("-password");
        if (!user) return Response.json({ error: "User not found" }, { status: 404 });

        return Response.json({
            name: user.name,
            email: user.email,
            role: user.role,
            year: user.year ?? null,
            semester: user.semester ?? null,
            createdAt: user.createdAt,
        });
    } catch (err) {
        console.error("GET /api/profile:", err);
        return Response.json({ error: "Failed to fetch profile" }, { status: 500 });
    }
}

// PUT /api/profile — update name and/or email
export async function PUT(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return Response.json({ error: "Unauthorised" }, { status: 401 });

        await connectDB();

        const { name, email, year, semester } = await req.json();

        // Email domain validation
        const emailRegex = /^[A-Za-z0-9._%+-]+@my\.sliit\.lk$/;
        if (email && !emailRegex.test(email)) {
            return Response.json({ error: "Only @my.sliit.lk emails are allowed" }, { status: 400 });
        }

        if (!name || !name.trim()) {
            return Response.json({ error: "Name is required" }, { status: 400 });
        }

        // Check email uniqueness if it changed
        if (email && email !== session.user.email) {
            const existing = await User.findOne({ email });
            if (existing) {
                return Response.json({ error: "That email is already in use" }, { status: 400 });
            }
        }

        const updateFields = { name: name.trim(), ...(email ? { email } : {}) };

        // Allow students to update year and semester
        if (year) updateFields.year = Number(year);
        if (semester) updateFields.semester = Number(semester);

        const updated = await User.findOneAndUpdate(
            { email: session.user.email },
            updateFields,
            { new: true, select: "-password" }
        );

        return Response.json({
            message: "Profile updated successfully",
            name: updated.name,
            email: updated.email,
            year: updated.year,
            semester: updated.semester,
        });
    } catch (err) {
        console.error("PUT /api/profile:", err);
        return Response.json({ error: "Failed to update profile" }, { status: 500 });
    }
}

// PATCH /api/profile — change password
export async function PATCH(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return Response.json({ error: "Unauthorised" }, { status: 401 });

        await connectDB();

        const { currentPassword, newPassword, confirmPassword } = await req.json();

        if (!currentPassword || !newPassword || !confirmPassword) {
            return Response.json({ error: "All password fields are required" }, { status: 400 });
        }
        if (newPassword.length < 6) {
            return Response.json({ error: "New password must be at least 6 characters" }, { status: 400 });
        }
        if (newPassword !== confirmPassword) {
            return Response.json({ error: "New passwords do not match" }, { status: 400 });
        }

        const user = await User.findOne({ email: session.user.email });
        if (!user) return Response.json({ error: "User not found" }, { status: 404 });

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return Response.json({ error: "Current password is incorrect" }, { status: 403 });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        return Response.json({ message: "Password changed successfully" });
    } catch (err) {
        console.error("PATCH /api/profile:", err);
        return Response.json({ error: "Failed to change password" }, { status: 500 });
    }
}

import connectDB from "@/lib/db";
import Subject from "@/models/Subject";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { NextResponse } from "next/server";

export async function POST(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "admin") {
            return NextResponse.json({ error: "Access denied: Admins only" }, { status: 403 });
        }

        await connectDB();
        const body = await req.json();
        const { name, year, semester } = body;

        if (!name || !year || !semester) {
            return NextResponse.json({ error: "Name, year, and semester are required" }, { status: 400 });
        }

        const subject = await Subject.create({
            name: name.trim(),
            year: parseInt(year),
            semester: parseInt(semester),
            createdBy: session.user.email
        });

        return NextResponse.json({ success: true, subject }, { status: 201 });
    } catch (error) {
        if (error.code === 11000) {
            return NextResponse.json({ error: "A subject with this name already exists in this semester" }, { status: 409 });
        }
        console.error("POST /api/notes/subjects/manage:", error);
        return NextResponse.json({ error: "Failed to create subject" }, { status: 500 });
    }
}

export async function DELETE(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "admin") {
            return NextResponse.json({ error: "Access denied: Admins only" }, { status: 403 });
        }

        await connectDB();
        const { searchParams } = new URL(req.url);
        const name = searchParams.get('name');
        const year = searchParams.get('year');
        const semester = searchParams.get('semester');

        if (!name || !year || !semester) {
            return NextResponse.json({ error: "Name, year, and semester query bounds required" }, { status: 400 });
        }

        await Subject.findOneAndDelete({ name, year: parseInt(year), semester: parseInt(semester) });

        return NextResponse.json({ success: true, message: "Subject explicitly removed" }, { status: 200 });
    } catch (error) {
        console.error("DELETE /api/notes/subjects/manage:", error);
        return NextResponse.json({ error: "Failed to delete subject" }, { status: 500 });
    }
}

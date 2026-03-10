// API route to get distinct subjects for a specific year and semester
import connectDB from "@/lib/db";
import Notes from "@/models/Notes";
import Subject from "@/models/Subject";
import { NextResponse } from "next/server";

export async function GET(req) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const year = searchParams.get('year');
        const semester = searchParams.get('semester');

        if (!year || !semester) {
            return NextResponse.json({ error: "Year and semester required" }, { status: 400 });
        }

        // Distinct subjects from Notes (implicitly created during upload)
        const activeSubjects = await Notes.distinct('subject', { year, semester });

        // Formally registered empty subjects from Admins
        const formalSubjectDocs = await Subject.find({ year, semester }).select('name');
        const formalSubjects = formalSubjectDocs.map(doc => doc.name);

        // Merge array sets ensuring uniqueness
        const uniqueMergedSet = [...new Set([...activeSubjects, ...formalSubjects])];

        // Count notes per subject for rich UI
        const subjectStats = await Promise.all(uniqueMergedSet.map(async (subj) => {
            const count = await Notes.countDocuments({ year, semester, subject: subj });
            return { name: subj, count: count };
        }));

        // Sort alphabetically to maintain clean UI ordering
        subjectStats.sort((a, b) => a.name.localeCompare(b.name));

        return NextResponse.json(subjectStats, { status: 200 });
    } catch (error) {
        console.error("Error fetching subjects:", error);
        return NextResponse.json({ error: "Failed to fetch subjects" }, { status: 500 });
    }
}

import connectDB from "@/lib/db";
import Assignment from "@/models/Assignment";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { pushNotification } from "@/lib/pushNotification";

// Helper to extract semester number from "y1s1" format
const getSemesterNumber = (semStr) => {
    if (!semStr) return null;
    const match = semStr.match(/s(\d+)$/);
    return match ? parseInt(match[1]) : parseInt(semStr);
};

export async function GET(req) {
    try {
        await connectDB();
        const session = await getServerSession(authOptions);
        if (!session) return Response.json({ error: "Unauthorised" }, { status: 401 });

        const { searchParams } = new URL(req.url);
        
        // Admin short-circuit
        if (session.user.role === "admin" && searchParams.get("admin") === "true") {
            const assignments = await Assignment.find({}).sort({ createdAt: -1 });
            return Response.json(assignments);
        }

        const userId = searchParams.get("userId") || session.user.id;
        const reqSemester = searchParams.get("semester"); 
        const semester = reqSemester || String(session.user.semester || "1");
        const userYear = searchParams.get("year") || String(session.user.year || "1");
        const viewAll = searchParams.get("viewAll"); // For lecturers

        let query = {};

        if (session.user.role === "admin") {
            query = {}; // Admins see all by default if not specified
        } else if (session.user.role === "lecturer" || viewAll === "true") {
            // Lecturer sees all, but can filter by semester
            if (reqSemester && reqSemester !== "all") {
                const semesterNumber = getSemesterNumber(reqSemester);
                query = {
                    $or: [
                        { semester: reqSemester },
                        { semester: semesterNumber },
                        { semester: String(semesterNumber) }
                    ]
                };
            } else {
                query = {};
            }
        } else {
            // Student: fetch their own + lecturer assignments for the same semester/year
            const semesterNumber = getSemesterNumber(semester);
            const lecturerConditions = [];
            const semNumStr = semesterNumber !== null ? String(semesterNumber) : null;

            if (userYear) {
                lecturerConditions.push({ isLecturerAssignment: true, year: String(userYear), semester: semester });
                lecturerConditions.push({ isLecturerAssignment: true, year: Number(userYear), semester: semester });

                if (semNumStr) {
                    lecturerConditions.push({ isLecturerAssignment: true, year: String(userYear), semester: semNumStr });
                    lecturerConditions.push({ isLecturerAssignment: true, year: Number(userYear), semester: semNumStr });
                    lecturerConditions.push({ isLecturerAssignment: true, year: String(userYear), semester: semesterNumber });
                    lecturerConditions.push({ isLecturerAssignment: true, year: Number(userYear), semester: semesterNumber });
                }
                
                lecturerConditions.push({ userId: { $ne: userId }, year: String(userYear), semester: semester });
                lecturerConditions.push({ userId: { $ne: userId }, year: Number(userYear), semester: semester });

                if (semNumStr) {
                    lecturerConditions.push({ userId: { $ne: userId }, year: String(userYear), semester: semNumStr });
                    lecturerConditions.push({ userId: { $ne: userId }, year: Number(userYear), semester: semNumStr });
                    lecturerConditions.push({ userId: { $ne: userId }, year: String(userYear), semester: semesterNumber });
                    lecturerConditions.push({ userId: { $ne: userId }, year: Number(userYear), semester: semesterNumber });
                }
            } else {
                lecturerConditions.push({ isLecturerAssignment: true, semester: semester });
                
                if (semNumStr) {
                    lecturerConditions.push({ isLecturerAssignment: true, semester: semNumStr });
                    lecturerConditions.push({ isLecturerAssignment: true, semester: semesterNumber });
                }
                
                lecturerConditions.push({ userId: { $ne: userId }, semester: semester });
                
                if (semNumStr) {
                    lecturerConditions.push({ userId: { $ne: userId }, semester: semNumStr });
                    lecturerConditions.push({ userId: { $ne: userId }, semester: semesterNumber });
                }
            }

            query = {
                $or: [
                    { userId, semester: semester },
                    { userId, semester: semesterNumber },
                    ...lecturerConditions
                ]
            };
        }

        const assignments = await Assignment.find(query).sort({ dueDate: 1 });
        return Response.json(assignments);
    } catch (err) {
        console.error("GET /api/assignments:", err);
        return Response.json({ error: "Failed to fetch assignments" }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        await connectDB();
        const session = await getServerSession(authOptions);
        if (!session) return Response.json({ error: "Access denied" }, { status: 401 });

        const body = await req.json();
        
        // Merge attributes to support both student task creation and lecturer broadcast assignments
        const isLecturerOrAdmin = session.user.role === "lecturer" || session.user.role === "admin";
        
        const assignmentData = {
            ...body,
            userId: session.user.id,
            uploadedBy: session.user.email,
            isLecturerAssignment: isLecturerOrAdmin ? true : (body.isLecturerAssignment || false)
        };

        const assignment = await Assignment.create(assignmentData);

        // If it's a broadcast assignment, send push notifications (from Dev branch)
        if (isLecturerOrAdmin && assignmentData.title && assignmentData.year && assignmentData.semester) {
            const year = assignmentData.year;
            const semester = assignmentData.semester;
            const title = assignmentData.title;

            // Notice to students
            await pushNotification({
                recipientRole: "student",
                recipientYear: Number(year),
                recipientSemester: Number(semester),
                title: "📚 New Assignment",
                message: `"${title}" has been added for Year ${year} Semester ${semester}.`,
                link: "/dashboard/assignments",
                type: "assignment",
                createdBy: session.user.email,
            }).catch(e => console.error("Notification error:", e));

            // Notice to other lecturers
            await pushNotification({
                recipientRole: "lecturer",
                title: "📚 Assignment Posted",
                message: `"${title}" was added for Y${year}S${semester} by ${session.user.name || session.user.email}.`,
                link: "/dashboard/lecturer/assignments",
                type: "assignment",
                createdBy: session.user.email,
            }).catch(e => console.error("Notification error:", e));
            
            // Notice to admins
            await pushNotification({
                recipientRole: "admin",
                title: "📚 Assignment Posted",
                message: `"${title}" added for Y${year}S${semester}.`,
                link: "/dashboard/admin/assignments",
                type: "assignment",
                createdBy: session.user.email,
            }).catch(e => console.error("Notification error:", e));
        }

        return Response.json(assignment, { status: 201 });
    } catch (err) {
        console.error("POST /api/assignments:", err);
        return Response.json({ error: "Failed to create assignment" }, { status: 500 });
    }
}

export async function PUT(req) {
    try {
        await connectDB();
        const session = await getServerSession(authOptions);
        if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

        const { id, status, title, description, dueDate, course, submissionText, submissionUrl, submittedAt } = await req.json();

        const assignment = await Assignment.findById(id);
        if (!assignment) return Response.json({ error: "Assignment not found" }, { status: 404 });

        const isCreator = String(assignment.userId) === String(session.user.id);
        const isAdmin = session.user.role === "admin";
        const isLecturer = session.user.role === "lecturer";

        const isOnlyStatusUpdate = status !== undefined && 
            title === undefined && description === undefined && 
            dueDate === undefined && course === undefined && 
            submissionText === undefined && submissionUrl === undefined && 
            submittedAt === undefined;

        if (!isCreator && !isAdmin && !isLecturer && !isOnlyStatusUpdate) {
            return Response.json({ error: "Forbidden: You don't have permission to edit this assignment" }, { status: 403 });
        }

        const updateFields = {};

        if (status !== undefined) {
            const userId = String(session.user.id);
            const completions = assignment.studentCompletions || [];
            const existingIndex = completions.findIndex(c => String(c.userId) === userId);

            if (existingIndex >= 0) {
                completions[existingIndex].status = status;
                completions[existingIndex].submittedAt = new Date();
            } else {
                completions.push({
                    userId,
                    status,
                    submittedAt: new Date()
                });
            }
            updateFields.studentCompletions = completions;
        }

        if (title !== undefined) updateFields.title = title;
        if (description !== undefined) updateFields.description = description;
        if (dueDate !== undefined) updateFields.dueDate = dueDate;
        if (course !== undefined) updateFields.course = course;
        if (submissionText !== undefined) updateFields.submissionText = submissionText;
        if (submissionUrl !== undefined) updateFields.submissionUrl = submissionUrl;
        if (submittedAt !== undefined) updateFields.submittedAt = submittedAt;

        const updated = await Assignment.findByIdAndUpdate(id, updateFields, { new: true });
        return Response.json(updated);
    } catch (err) {
        console.error("PUT /api/assignments:", err);
        return Response.json({ error: "Failed to update assignment" }, { status: 500 });
    }
}

export async function DELETE(req) {
    try {
        await connectDB();
        const session = await getServerSession(authOptions);
        if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        if (!id) return Response.json({ error: "ID required" }, { status: 400 });

        const assignment = await Assignment.findById(id);
        if (!assignment) return Response.json({ error: "Assignment not found" }, { status: 404 });

        const isCreator = String(assignment.userId) === String(session.user.id);
        const isAdmin = session.user.role === "admin";
        const isLecturer = session.user.role === "lecturer";

        if (!isCreator && !isAdmin && !isLecturer) {
            return Response.json({ error: "Forbidden: You don't have permission to delete this assignment" }, { status: 403 });
        }

        await Assignment.findByIdAndDelete(id);
        return Response.json({ message: "Deleted" });
    } catch (err) {
        console.error("DELETE /api/assignments:", err);
        return Response.json({ error: "Failed to delete assignment" }, { status: 500 });
    }
}

const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config({ path: ".env.local" });

const AssignmentSchema = new mongoose.Schema({
  title: String,
  semester: String,
  year: String,
  isLecturerAssignment: Boolean,
  createdBy: String,
  userId: String
}, { strict: false });

const Assignment = mongoose.models.Assignment || mongoose.model("Assignment", AssignmentSchema);

async function fixDB() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB.");

  const assignments = await Assignment.find({});
  let updatedCount = 0;

  for (const doc of assignments) {
    let changed = false;

    // Fix semester format (convert "2" to "y3s2" based on year)
    if (doc.semester && !doc.semester.startsWith("y")) {
      const year = doc.year || "1";
      const sem = doc.semester; // e.g. "2"
      doc.semester = `y${year}s${sem}`;
      changed = true;
      console.log(`Normalizing semester: ${doc.title} -> ${doc.semester}`);
    }

    // Attempt to retroactively set isLecturerAssignment for lecturer-created ones
    // We assume lecturers have emails like "@my.sliit.lk" or we just set it true if the user's role is lecturer.
    // Actually, student assignments also have "createdBy".
    // Let's just check if it's missing, maybe we can't be sure, but let's at least ensure isLecturerAssignment is a boolean.
    if (doc.isLecturerAssignment === undefined) {
       // Since we don't know for sure, let's leave it, but for testing if the user explicitly created it recently as a lecturer, we can guess based on some logic. 
       // The user said "uploaded by lecturer that belongs to y3s2" isn't showing.
    }

    if (changed) {
      await doc.save();
      updatedCount++;
    }
  }

  console.log(`Updated ${updatedCount} assignments.`);
  process.exit();
}

fixDB();

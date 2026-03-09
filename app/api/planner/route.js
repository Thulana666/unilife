import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Planner from "@/models/Planner";

// 1. GET - Fetch all Tasks
export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const semester = searchParams.get("semester");

    // Fetch tasks for the specific semester, sorted by date and time
    const tasks = await Planner.find({ semester }).sort({ date: 1, time: 1 });
    return NextResponse.json(tasks);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

// 2. POST - Add a new Mission
export async function POST(req) {
  try {
    await connectDB();
    const data = await req.json();

    // Save all data sent from the frontend (subject, title, date, time, priority, semester)
    const newTask = await Planner.create({
      ...data,
      status: "Pending" // Set status to Pending when adding a new task
    });

    return NextResponse.json(newTask, { status: 201 });
  } catch (error) {
    console.error("POST Error:", error);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}

// 3. PATCH - Edit a Task or change its Status (Complete/Pending)
export async function PATCH(req) {
  try {
    await connectDB();
    const { id, ...updates } = await req.json();

    const updatedTask = await Planner.findByIdAndUpdate(id, updates, { new: true });

    if (!updatedTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json(updatedTask);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}

// 4. DELETE - Delete a Task
export async function DELETE(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    await Planner.findByIdAndDelete(id);
    return NextResponse.json({ message: "Task Deleted Successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
}
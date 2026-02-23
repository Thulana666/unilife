import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Please define MONGODB_URI in .env.local");
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null };
}

async function connectDB() {

  if (cached.conn) return cached.conn;

  cached.conn = await mongoose.connect(MONGODB_URI);

  console.log("MongoDB Connected");

  return cached.conn;
}

export default connectDB;

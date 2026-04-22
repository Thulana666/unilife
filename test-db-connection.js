// Run this with: node test-db-connection.js
// This will test your MongoDB connection and list users

import mongoose from "mongoose";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI is not defined in .env.local");
  process.exit(1);
}

console.log("🔄 Attempting to connect to MongoDB...");
console.log("📍 Connection string:", MONGODB_URI.replace(/:[^:@]+@/, ":****@")); // Hide password

const opts = {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

async function testConnection() {
  try {
    await mongoose.connect(MONGODB_URI, opts);
    console.log("✅ MongoDB Connected successfully!\n");

    // Get database name
    const dbName = mongoose.connection.db.databaseName;
    console.log("📦 Database name:", dbName);

    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log("\n📂 Collections in database:");
    collections.forEach((col) => console.log(`  - ${col.name}`));

    // Try to count users
    const User = mongoose.model(
      "User",
      new mongoose.Schema({
        name: String,
        email: String,
        password: String,
        role: String,
        year: Number,
        semester: Number,
      })
    );

    const userCount = await User.countDocuments();
    console.log(`\n👥 Total users in database: ${userCount}`);

    if (userCount > 0) {
      console.log("\n📋 Sample users (without passwords):");
      const users = await User.find({}).select("name email role").limit(5);
      users.forEach((user, idx) => {
        console.log(`  ${idx + 1}. ${user.name} (${user.email}) - Role: ${user.role}`);
      });
    } else {
      console.log("\n⚠️  No users found in database. You may need to register a user first.");
    }

    await mongoose.connection.close();
    console.log("\n✅ Connection closed successfully");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Connection failed:");
    console.error("Error:", error.message);

    if (error.name === "MongoServerSelectionError") {
      console.error("\n💡 Possible issues:");
      console.error("  - MongoDB Atlas cluster is paused or stopped");
      console.error("  - Network connectivity issues");
      console.error("  - IP whitelist restrictions (check MongoDB Atlas Network Access)");
      console.error("  - Invalid connection string or credentials");
    }

    process.exit(1);
  }
}

testConnection();

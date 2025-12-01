import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    
    if (!mongoUri) {
      console.error("❌ MONGO_URI is not defined in environment variables");
      console.error("Please create a .env file in the backend directory with:");
      console.error("MONGO_URI=mongodb://localhost:27017/attendance-system");
      process.exit(1);
    }

    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(mongoUri);
    console.log("✅ Database connected successfully");
  } catch (error) {
    console.error("❌ DB Connection failed:", error.message);
    if (error.message.includes("connect ECONNREFUSED")) {
      console.error("💡 Make sure MongoDB is running on your system");
      console.error("   You can start it with: mongod");
    }
    process.exit(1);
  }
};

export default connectDB;

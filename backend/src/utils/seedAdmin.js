import User from "../models/User.js";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, "../../.env") });

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to database for seeding");

    // Check if admin already exists
    const existingAdmin = await User.findOne({ 
      $or: [
        { userId: "admin@gmail.com" },
        { email: "admin@gmail.com" },
        { role: "admin" }
      ]
    });

    if (existingAdmin) {
      console.log("Admin user already exists");
      // Update password to ensure it's correct
      existingAdmin.password = "123456";
      existingAdmin.userId = "admin@gmail.com";
      existingAdmin.email = "admin@gmail.com";
      existingAdmin.name = "Administrator";
      existingAdmin.role = "admin";
      existingAdmin.isActive = true;
      // Mark password as modified to trigger hashing
      existingAdmin.markModified("password");
      await existingAdmin.save();
      console.log("✅ Admin credentials updated");
      console.log("Email: admin@gmail.com");
      console.log("Password: 123456");
    } else {
      // Create admin user
      const admin = await User.create({
        userId: "admin@gmail.com",
        name: "Administrator",
        email: "admin@gmail.com",
        password: "123456",
        role: "admin",
        isActive: true
      });
      console.log("✅ Admin user created successfully");
      console.log("Email: admin@gmail.com");
      console.log("Password: 123456");
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("Error seeding admin:", error);
    process.exit(1);
  }
};

seedAdmin();


import Department from "../models/Department.js";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, "../../.env") });

const DEPARTMENTS = [
  { name: "Computer Science Engineering", code: "CSE" },
  { name: "Electronics and Communication Engineering", code: "ECE" },
  { name: "Electrical Engineering", code: "EE" },
  { name: "Mechanical Engineering", code: "ME" },
  { name: "Civil Engineering", code: "CE" },
  { name: "Information Technology", code: "IT" },
  { name: "Aerospace Engineering", code: "AE" },
  { name: "Chemical Engineering", code: "CHE" },
  { name: "Biomedical Engineering", code: "BME" },
  { name: "Automobile Engineering", code: "AUTO" },
  { name: "Industrial Engineering", code: "IE" }
];

const seedDepartments = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to database for seeding departments");

    for (const dept of DEPARTMENTS) {
      const existing = await Department.findOne({
        $or: [{ name: dept.name }, { code: dept.code }]
      });

      if (!existing) {
        await Department.create(dept);
        console.log(`✅ Created department: ${dept.name} (${dept.code})`);
      } else {
        console.log(`⏭️  Department already exists: ${dept.name}`);
      }
    }

    console.log("✅ Department seeding completed");
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("Error seeding departments:", error);
    process.exit(1);
  }
};

seedDepartments();



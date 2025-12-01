import express from "express";
import { SEMESTERS } from "../utils/departments.js";
import Department from "../models/Department.js";

const router = express.Router();

// Get departments list (from database) - accessible to all authenticated users
router.get("/departments", async (req, res) => {
  try {
    const departments = await Department.find({ isActive: true }).sort({ name: 1 });
    res.json({ 
      departments: departments.map(d => ({
        _id: d._id,
        name: d.name,
        code: d.code,
        description: d.description
      }))
    });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
});

// Get semesters list (default 6 semesters)
router.get("/semesters", (req, res) => {
  res.json({ semesters: SEMESTERS });
});

export default router;


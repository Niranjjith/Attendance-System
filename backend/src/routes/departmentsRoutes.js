import express from "express";
import { DEPARTMENTS, SEMESTERS } from "../utils/departments.js";

const router = express.Router();

// Get departments list
router.get("/departments", (req, res) => {
  res.json({ departments: DEPARTMENTS });
});

// Get semesters list
router.get("/semesters", (req, res) => {
  res.json({ semesters: SEMESTERS });
});

export default router;


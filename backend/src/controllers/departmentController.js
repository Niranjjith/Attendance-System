import Department from "../models/Department.js";
import AuditLog from "../models/AuditLog.js";

// Create audit log helper
const createAuditLog = async (action, entity, entityId, performedBy, changes = {}, req = null) => {
  try {
    await AuditLog.create({
      action,
      entity,
      entityId,
      performedBy,
      changes,
      ipAddress: req?.ip || req?.connection?.remoteAddress,
      userAgent: req?.get("user-agent")
    });
  } catch (error) {
    console.error("Audit log creation failed:", error);
  }
};

// Get all departments
export const getDepartments = async (req, res) => {
  try {
    const { search } = req.query;
    const query = { isActive: true };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { code: { $regex: search, $options: "i" } }
      ];
    }

    const departments = await Department.find(query).sort({ name: 1 });
    res.json({ departments });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

// Get single department
export const getDepartment = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({ msg: "Department not found" });
    }
    res.json({ department });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

// Create department
export const createDepartment = async (req, res) => {
  try {
    const { name, code, description } = req.body;

    if (!name || !code) {
      return res.status(400).json({ msg: "Name and code are required" });
    }

    // Check if department exists (including inactive ones)
    const existing = await Department.findOne({
      $or: [{ name }, { code: code.toUpperCase() }]
    });
    if (existing) {
      if (existing.isActive) {
        return res.status(400).json({ msg: "Department name or code already exists" });
      } else {
        // Reactivate and update
        existing.isActive = true;
        existing.name = name;
        existing.code = code.toUpperCase();
        if (description !== undefined) existing.description = description;
        await existing.save();
        await createAuditLog("create", "department", existing._id, req.user.id, { action: "reactivated" }, req);
        return res.status(201).json({ msg: "Department created successfully", department: existing });
      }
    }

    const department = await Department.create({
      name,
      code: code.toUpperCase(),
      description: description || ""
    });

    await createAuditLog("create", "department", department._id, req.user.id, {}, req);

    res.status(201).json({ msg: "Department created successfully", department });
  } catch (error) {
    console.error("Create department error:", error);
    if (error.code === 11000) {
      // Duplicate key error
      return res.status(400).json({ msg: "Department name or code already exists" });
    }
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

// Update department
export const updateDepartment = async (req, res) => {
  try {
    const { name, code, description } = req.body;
    const department = await Department.findById(req.params.id);

    if (!department) {
      return res.status(404).json({ msg: "Department not found" });
    }

    // Check if new name/code conflicts
    if (name || code) {
      const existing = await Department.findOne({
        $or: [
          ...(name ? [{ name }] : []),
          ...(code ? [{ code: code.toUpperCase() }] : [])
        ],
        _id: { $ne: department._id }
      });
      if (existing) {
        return res.status(400).json({ msg: "Department name or code already exists" });
      }
    }

    if (name) department.name = name;
    if (code) department.code = code.toUpperCase();
    if (description !== undefined) department.description = description;

    await department.save();

    await createAuditLog("update", "department", department._id, req.user.id, { oldData: req.body }, req);

    res.json({ msg: "Department updated successfully", department });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

// Delete department
export const deleteDepartment = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);

    if (!department) {
      return res.status(404).json({ msg: "Department not found" });
    }

    department.isActive = false;
    await department.save();

    await createAuditLog("delete", "department", department._id, req.user.id, {}, req);

    res.json({ msg: "Department deleted successfully" });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};


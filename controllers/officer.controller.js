import Officer from "../models/redressalOfficer.model.js";
import Grievance from "../models/grievance.model.js";
import bcrypt from "bcryptjs";
import generateToken from "../config/token.js";

// ✅ Officer Login
export const loginOfficer = async (req, res) => {
  try {
    const { mobile, password } = req.body;

    if (!mobile || !password) {
      return res.status(400).json({ message: "Mobile and password are required" });
    }

    const officer = await Officer.findOne({ mobile });
    if (!officer) {
      return res.status(404).json({ message: "Officer not found" });
    }

    if (!officer.isActive) {
      return res.status(403).json({ message: "Your account is inactive. Contact Admin." });
    }

    const isMatch = await bcrypt.compare(password, officer.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = generateToken(officer._id);

    res.status(200).json({
      message: "Login successful",
      token,
      officer: {
        _id: officer._id,
        name: officer.name,
        mobile: officer.mobile,
        designation: officer.designation,
        department: officer.department
      }
    });

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ Create Officer
export const createOfficer = async (req, res) => {
  try {
    const { name, mobile, email, password, designation, department } = req.body;

    if (!name || !mobile || !password) {
      return res.status(400).json({ message: "Name, mobile, and password are required" });
    }

    const exists = await Officer.findOne({ mobile });
    if (exists) {
      return res.status(400).json({
        message: "Officer with this mobile number already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const officer = await Officer.create({
      name,
      mobile,
      email,
      password: hashedPassword,
      designation,
      department,
    });

    res.status(201).json({
      message: "Officer created successfully",
      officer: {
        _id: officer._id,
        name: officer.name,
        mobile: officer.mobile,
        email: officer.email,
        designation: officer.designation,
        department: officer.department,
        isActive: officer.isActive
      },
    });

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ Get Officer By ID
export const getOfficerById = async (req, res) => {
  try {
    const officer = await Officer.findById(req.params.id).select("-password");
    if (!officer) return res.status(404).json({ message: "Officer not found" });

    // Fetch grievance stats for this officer
    const [claimed, inProgress, resolved, rejected] = await Promise.all([
      Grievance.countDocuments({ handledBy: officer._id }),
      Grievance.countDocuments({ handledBy: officer._id, status: "In Progress" }),
      Grievance.countDocuments({ handledBy: officer._id, status: "Resolved" }),
      Grievance.countDocuments({ handledBy: officer._id, status: "Rejected" }),
    ]);

    const stats = { claimed, inProgress, resolved, rejected };

    res.status(200).json({ officer, stats });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ Get All Officers with Search, Filter & Pagination
export const getAllOfficers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", status = "" } = req.query;
    const skip = (page - 1) * limit;

    let query = {};

    // Search logic
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { mobile: { $regex: search, $options: "i" } },
        { designation: { $regex: search, $options: "i" } },
        { department: { $regex: search, $options: "i" } },
      ];
    }

    // Status filter
    if (status) {
      query.isActive = status === "true";
    }

    const officersList = await Officer.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select("-password");

    // Add grievance count for each officer
    const officers = await Promise.all(officersList.map(async (off) => {
      const totalClaimed = await Grievance.countDocuments({ handledBy: off._id });
      return { ...off._doc, totalClaimed };
    }));

    const total = await Officer.countDocuments(query);

    // Stats for dashboard
    const stats = {
      total: await Officer.countDocuments(),
      active: await Officer.countDocuments({ isActive: true }),
      inactive: await Officer.countDocuments({ isActive: false })
    };

    res.json({
      officers,
      stats,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalItems: total
    });


  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ Update Officer
export const updateOfficer = async (req, res) => {
  try {
    const { id } = req.params;
    const { password, ...updateData } = req.body;

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updated = await Officer.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).select("-password");

    if (!updated) {
      return res.status(404).json({ message: "Officer not found" });
    }

    res.json({
      message: "Officer updated successfully",
      updated,
    });

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ Toggle Active/Inactive
export const toggleOfficerStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const officer = await Officer.findById(id);

    if (!officer) {
      return res.status(404).json({
        message: "Officer not found",
      });
    }

    officer.isActive = !officer.isActive;
    await officer.save();

    res.json({
      message: `Officer ${officer.isActive ? "activated" : "deactivated"} successfully`,
      isActive: officer.isActive,
    });

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ Delete Officer
export const deleteOfficer = async (req, res) => {
  try {
    const deleted = await Officer.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: "Officer not found" });
    }

    res.json({
      message: "Officer deleted successfully",
    });

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

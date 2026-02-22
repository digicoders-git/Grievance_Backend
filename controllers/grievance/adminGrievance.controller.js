import Grievance from "../../models/grievance.model.js";
import RedressalOfficer from "../../models/redressalOfficer.model.js";

// ✅ 1. Admin Grievance Stats
export const getAdminGrievanceStats = async (req, res) => {
  try {
    const total = await Grievance.countDocuments();
    const pending = await Grievance.countDocuments({ status: "Pending" });
    const inProgress = await Grievance.countDocuments({ status: "In Progress" });
    const resolved = await Grievance.countDocuments({ status: "Resolved" });
    const rejected = await Grievance.countDocuments({ status: "Rejected" });

    // Officer-wise performance
    const officerStats = await Grievance.aggregate([
      { $match: { handledBy: { $ne: null } } },
      {
        $group: {
          _id: "$handledBy",
          totalHandled: { $sum: 1 },
          resolvedCount: {
            $sum: { $cond: [{ $eq: ["$status", "Resolved"] }, 1, 0] }
          }
        }
      },
      {
        $lookup: {
          from: "redressalofficers",
          localField: "_id",
          foreignField: "_id",
          as: "officer"
        }
      },
      { $unwind: "$officer" },
      {
        $project: {
          name: "$officer.name",
          department: "$officer.department",
          totalHandled: 1,
          resolvedCount: 1
        }
      }
    ]);

    res.status(200).json({
      summary: { total, pending, inProgress, resolved, rejected },
      officerPerformance: officerStats
    });

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ 2. Admin Detailed Grievance List with Search, Filter & Pagination
export const getAdminGrievanceList = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {};

    // Status filter
    if (status) query.status = status;

    // Global search — searches in subject and description
    if (search) {
      query.$or = [
        { subject: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const [grievances, total] = await Promise.all([
      Grievance.find(query)
        .populate("studentId", "name enrollmentNumber email branch year")
        .populate("handledBy", "name designation department")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Grievance.countDocuments(query),
    ]);

    // Stats (always full, unaffected by filters)
    const [totalAll, pending, inProgress, resolved, rejected] = await Promise.all([
      Grievance.countDocuments(),
      Grievance.countDocuments({ status: "Pending" }),
      Grievance.countDocuments({ status: "In Progress" }),
      Grievance.countDocuments({ status: "Resolved" }),
      Grievance.countDocuments({ status: "Rejected" }),
    ]);

    res.status(200).json({
      grievances,
      stats: { total: totalAll, pending, inProgress, resolved, rejected },
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      totalItems: total,
    });

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

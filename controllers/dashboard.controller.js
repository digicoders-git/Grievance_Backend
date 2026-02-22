import Student from "../models/student/student.model.js";
import RedressalOfficer from "../models/redressalOfficer.model.js";
import Grievance from "../models/grievance.model.js";

export const getDashboardStats = async (req, res) => {
  try {
    // ── Total counts ──────────────────────────────────────────────────────
    const [totalStudents, totalOfficers, totalGrievances] = await Promise.all([
      Student.countDocuments(),
      RedressalOfficer.countDocuments(),
      Grievance.countDocuments(),
    ]);

    const activeStudents = await Student.countDocuments({ isActive: true });
    const activeOfficers = await RedressalOfficer.countDocuments({ isActive: true });
    const pendingCount = await Grievance.countDocuments({ status: "Pending" });
    const inProgressCount = await Grievance.countDocuments({ status: "In Progress" });
    const resolvedCount = await Grievance.countDocuments({ status: "Resolved" });
    const rejectedCount = await Grievance.countDocuments({ status: "Rejected" });

    // ── Monthly breakdown (last 12 months) ───────────────────────────────
    const now = new Date();
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    const monthlyGrievances = await Grievance.aggregate([
      { $match: { createdAt: { $gte: twelveMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            status: "$status",
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    // Build 12-month labels and series arrays
    const months = [];
    const pendingSeries = [];
    const inProgressSeries = [];
    const resolvedSeries = [];
    const rejectedSeries = [];

    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const yr = d.getFullYear();
      const mo = d.getMonth() + 1;

      const shortMonth = d.toLocaleString("en-US", { month: "short" });
      months.push(shortMonth + " " + String(yr).slice(2));

      const get = (status) => {
        const found = monthlyGrievances.find(
          (x) => x._id.year === yr && x._id.month === mo && x._id.status === status
        );
        return found ? found.count : 0;
      };

      pendingSeries.push(get("Pending"));
      inProgressSeries.push(get("In Progress"));
      resolvedSeries.push(get("Resolved"));
      rejectedSeries.push(get("Rejected"));
    }

    // ── Recent 5 grievances ───────────────────────────────────────────────
    const recentGrievances = await Grievance.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("studentId", "name enrollmentNumber")
      .populate("handledBy", "name designation");

    return res.status(200).json({
      success: true,
      stats: {
        students: {
          total: totalStudents,
          active: activeStudents,
          inactive: totalStudents - activeStudents,
        },
        officers: {
          total: totalOfficers,
          active: activeOfficers,
          inactive: totalOfficers - activeOfficers,
        },
        grievances: {
          total: totalGrievances,
          pending: pendingCount,
          inProgress: inProgressCount,
          resolved: resolvedCount,
          rejected: rejectedCount,
        },
      },
      chart: {
        months,
        series: {
          pending: pendingSeries,
          inProgress: inProgressSeries,
          resolved: resolvedSeries,
          rejected: rejectedSeries,
        },
      },
      recentGrievances,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

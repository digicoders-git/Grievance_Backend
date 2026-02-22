import Grievance from "../../models/grievance.model.js";

// ✅ 1. Get All Grievances (Officer Side)
export const getAllGrievances = async (req, res) => {
  try {
    const grievances = await Grievance.find()
      .populate("studentId", "name enrollmentNumber mobile branch year college")
      .populate("handledBy", "name designation department")
      .sort({ createdAt: -1 });

    res.status(200).json(grievances);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ 2. Claim Grievance (Officer claims it)
export const claimGrievance = async (req, res) => {
  try {
    const { id } = req.params;
    const officerId = req.officer.id;

    const grievance = await Grievance.findById(id);
    if (!grievance) {
      return res.status(404).json({ message: "Grievance not found" });
    }

    if (grievance.status !== "Pending") {
      return res.status(400).json({ message: "This grievance is already in progress or resolved" });
    }

    grievance.handledBy = officerId;
    grievance.status = "In Progress";
    await grievance.save();

    res.status(200).json({ message: "Grievance claimed successfully", grievance });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ 3. Resolve Grievance
export const resolveGrievance = async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks, status } = req.body; // status can be Resolved or Rejected

    if (!remarks) {
      return res.status(400).json({ message: "Remarks are required to resolve/reject" });
    }

    const grievance = await Grievance.findById(id);
    if (!grievance) {
      return res.status(404).json({ message: "Grievance not found" });
    }

    if (grievance.handledBy?.toString() !== req.officer.id) {
      return res.status(403).json({ message: "You are not handling this grievance" });
    }

    grievance.status = status || "Resolved";
    grievance.remarks = remarks;
    grievance.resolvedAt = new Date();
    await grievance.save();

    res.status(200).json({ message: `Grievance mark as ${grievance.status}`, grievance });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

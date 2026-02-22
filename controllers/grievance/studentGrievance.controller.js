import Grievance from "../../models/grievance.model.js";
import cloudinary from "../../config/cloudinary.js";

// ✅ 1. Student Create Grievance
export const createGrievance = async (req, res) => {
  try {
    const { subject, description } = req.body;
    const studentId = req.student.id;

    if (!subject || !description) {
      return res.status(400).json({ message: "Subject and Description are required" });
    }

    let attachmentUrl = null;
    if (req.file) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: "grievances",
        });
        attachmentUrl = result.secure_url;
      } catch (uploadError) {
        return res.status(500).json({ message: "Attachment upload failed" });
      }
    }

    const grievance = await Grievance.create({
      studentId,
      subject,
      description,
      attachment: attachmentUrl
    });

    res.status(201).json({
      message: "Grievance submitted successfully",
      grievance
    });

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ 2. Get My Grievances (Student Side)
export const getMyGrievances = async (req, res) => {
  try {
    const studentId = req.student.id;

    const grievances = await Grievance.find({ studentId })
      .sort({ createdAt: -1 })
      .populate("handledBy", "name designation department");

    res.status(200).json(grievances);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ 3. Get Grievance Details
export const getGrievanceDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const studentId = req.student.id;

    const grievance = await Grievance.findOne({ _id: id, studentId }).populate(
      "handledBy",
      "name designation department"
    );

    if (!grievance) {
      return res.status(404).json({ message: "Grievance not found" });
    }

    res.status(200).json(grievance);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ 4. Withdraw Grievance
export const withdrawGrievance = async (req, res) => {
  try {
    const { id } = req.params;
    const studentId = req.student.id;

    const grievance = await Grievance.findOne({ _id: id, studentId });

    if (!grievance) {
      return res.status(404).json({ message: "Grievance not found" });
    }

    if (grievance.status !== "Pending") {
      return res.status(400).json({ message: "Cannot withdraw once processing starts" });
    }

    await Grievance.findByIdAndDelete(id);

    res.status(200).json({ message: "Grievance withdrawn successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

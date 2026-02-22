import mongoose from "mongoose";

const grievanceSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    subject: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    attachment: {
      type: String, // Cloudinary URL or file path
      default: null,
    },
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Resolved", "Rejected"],
      default: "Pending",
    },
    handledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RedressalOfficer",
      default: null,
    },
    remarks: {
      type: String,
      default: null,
    },
    deadline: {
      type: Date,
      default: function () {
        if (this.deadline) return this.deadline;
        const date = new Date();
        date.setDate(date.getDate() + 7); // Default 7 days deadline
        return date;
      }
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

const Grievance = mongoose.model("Grievance", grievanceSchema);
export default Grievance;

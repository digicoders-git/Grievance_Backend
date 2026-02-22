import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    enrollmentNumber: {
      type: String,
      required: true,
      unique: true,
    },
    dob: {
      type: String, // stored as 24/04/2004
      required: true,
    },
    password: {
      type: String, // custom password (plain text - requested)
      default: "",
    },
    mobile: String,
    email: String,
    branch: String,
    year: String,
    college: String,
    isPasswordCreated: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const Student = mongoose.model("Student", studentSchema);
export default Student;

import express from "express";
console.log("Loading Student Routes...");
import {
  loginStudent,
  createPassword,
  getStudentProfile,
  createStudent,
  getStudentById,
  getAllStudents,
  toggleStudentStatus,
  importStudentsExcel,
  bulkCreateStudents
} from "../../controllers/student/student.controller.js";
import { verifyStudent } from "../../middleware/student/student.middleware.js";
import { verifyAdminToken } from "../../middleware/verifyAdminToken.js";
import upload from "../../middleware/multer.js";

const studentRoute = express.Router();

// Student facing routes
studentRoute.post("/login", loginStudent);
studentRoute.post("/create-password", verifyStudent, createPassword);
studentRoute.get("/profile", verifyStudent, getStudentProfile);

// Admin facing routes (Student management)
studentRoute.post("/admin/create", verifyAdminToken, createStudent);
studentRoute.get("/admin/get-all", verifyAdminToken, getAllStudents);
studentRoute.get("/admin/get/:id", verifyAdminToken, getStudentById);
studentRoute.post("/admin/toggle-status/:id", verifyAdminToken, toggleStudentStatus);
studentRoute.post("/admin/import-excel", verifyAdminToken, upload.single('file'), importStudentsExcel);
studentRoute.post("/admin/bulk-create", verifyAdminToken, bulkCreateStudents);

export default studentRoute;

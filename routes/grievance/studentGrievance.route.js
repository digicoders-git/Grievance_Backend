import express from "express";
import {
  createGrievance,
  getMyGrievances,
  getGrievanceDetails,
  withdrawGrievance,
} from "../../controllers/grievance/studentGrievance.controller.js";
import { verifyStudent } from "../../middleware/student/student.middleware.js";
import upload from "../../middleware/multer.js";

const router = express.Router();

router.post("/create", verifyStudent, upload.single("attachment"), createGrievance);
router.get("/my", verifyStudent, getMyGrievances);
router.get("/details/:id", verifyStudent, getGrievanceDetails);
router.delete("/withdraw/:id", verifyStudent, withdrawGrievance);

export default router;

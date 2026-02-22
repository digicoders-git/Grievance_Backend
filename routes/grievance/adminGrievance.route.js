import express from "express";
import { getAdminGrievanceStats, getAdminGrievanceList } from "../../controllers/grievance/adminGrievance.controller.js";
import { verifyAdminToken } from "../../middleware/verifyAdminToken.js";

const router = express.Router();

router.get("/stats", verifyAdminToken, getAdminGrievanceStats);
router.get("/list", verifyAdminToken, getAdminGrievanceList);

export default router;

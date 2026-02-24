import express from "express";
import { getAllGrievances, claimGrievance, resolveGrievance, getGrievanceById } from "../../controllers/grievance/officerGrievance.controller.js";
import { verifyOfficer } from "../../middleware/verifyOfficerToken.js";

const router = express.Router();

router.get("/list", verifyOfficer, getAllGrievances);
router.get("/get/:id", verifyOfficer, getGrievanceById);
router.patch("/claim/:id", verifyOfficer, claimGrievance);
router.patch("/resolve/:id", verifyOfficer, resolveGrievance);



export default router;

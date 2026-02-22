import express from "express";
import {
  createOfficer,
  getAllOfficers,
  getOfficerById,
  updateOfficer,
  toggleOfficerStatus,
  deleteOfficer,
  loginOfficer
} from "../controllers/officer.controller.js";

import { verifyAdminToken } from "../middleware/verifyAdminToken.js";

const router = express.Router();

router.post("/login", loginOfficer);
router.post("/create", verifyAdminToken, createOfficer);
router.get("/list", verifyAdminToken, getAllOfficers);
router.get("/get/:id", verifyAdminToken, getOfficerById);
router.patch("/update/:id", verifyAdminToken, updateOfficer);
router.patch("/toggle-status/:id", verifyAdminToken, toggleOfficerStatus);
router.delete("/delete/:id", verifyAdminToken, deleteOfficer);

export default router;

import express from "express";
import { getDashboardStats, getOfficerDashboardStats } from "../controllers/dashboard.controller.js";
import { verifyAdminToken } from "../middleware/verifyAdminToken.js";
import { verifyOfficer } from "../middleware/verifyOfficerToken.js";

const dashboardRoute = express.Router();

// GET /admin/dashboard/stats
dashboardRoute.get("/stats", verifyAdminToken, getDashboardStats);

// GET /officer/dashboard/stats
dashboardRoute.get("/officer/stats", verifyOfficer, getOfficerDashboardStats);

export default dashboardRoute;


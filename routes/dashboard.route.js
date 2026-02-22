import express from "express";
import { getDashboardStats } from "../controllers/dashboard.controller.js";
import { verifyAdminToken } from "../middleware/verifyAdminToken.js";

const dashboardRoute = express.Router();

// GET /admin/dashboard/stats
dashboardRoute.get("/stats", verifyAdminToken, getDashboardStats);

export default dashboardRoute;

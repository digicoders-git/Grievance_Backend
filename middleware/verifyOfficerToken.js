import jwt from "jsonwebtoken";

export const verifyOfficer = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Officer Login Required!" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if the decoded token has officer role or just ensure it's not student?
    // According to generateToken, it only takes id.
    // For now, we assume if it's not an admin token, it's either student or officer.
    // The user didn't specify roles in token.
    // I'll just attach it to req.officer.
    req.officer = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or Expired Officer Token!" });
  }
};

import jwt from "jsonwebtoken";

export const verifyStudent = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Login Required!" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.student = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or Expired Token!" });
  }
};

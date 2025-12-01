import jwt from "jsonwebtoken";
import User from "../models/User.js";

export default async function (req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(403).json({ msg: "No token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (user.activeToken !== token)
      return res.status(403).json({ msg: "Session expired - logged in elsewhere" });

    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).json({ msg: "Invalid token" });
  }
}

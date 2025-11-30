const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "No token provided" });

    const user = jwt.verify(token, process.env.JWT_SECRET);

    // Store tenantId in request
    req.tenantId = user.tenantId; // <--- IMPORTANT

    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

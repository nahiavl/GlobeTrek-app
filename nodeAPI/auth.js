const jwt = require("jsonwebtoken");
const secretKey = process.env.JWT_SECRET;
function verifyToken(req, res, next) {
    const header = req.header("Authorization") || "";
    const token = header.split(" ")[1];
    if (!token) {
        return res.status(401).json({ message: "Token not provided" });
    }
    try {
        const payload = jwt.verify(token, secretKey);
        req.user_id = payload.sub;

        next();
    } catch (error) {
        return res.status(401).json({ message: "Token not valid" });
    }
}

module.exports = { verifyToken };
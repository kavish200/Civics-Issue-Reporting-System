const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        // Check whether the token exists
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "Access denied. Token required."
            });
        }

        // Extract the token
        const token = authHeader.split(" ")[1];

        // Verify the token
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        // Attach user information to the request
        req.user = decoded;

        next();

    } catch (error) {
        return res.status(401).json({
            message: "Invalid or expired token"
        });
    }
};

module.exports = { verifyToken };

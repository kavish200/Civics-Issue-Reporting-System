const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middlewares/authMiddleware");
const authorizeRoles = require("../middlewares/roleMiddleware");

//Admin only route
router.get(
    "/admin",
    verifyToken,
    authorizeRoles("admin"),
    (req, res) => {
        res.json({
            message: "Welcome Admin!"
        });
    }
);

module.exports = router;
const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middlewares/authMiddleware");
const authorizeRoles = require("../middlewares/roleMiddleware");
const { createIssue, getAllIssues, getMyIssues, updateIssueStatus, assignIssue, getIssueById, deleteIssue } = require("../controllers/issueController");

// Create a new issue
router.post(
    "/create",
    verifyToken,
    authorizeRoles("citizen"),
    createIssue
);

// Get all issues (Admin specific)
router.get(
    "/getAll",
    verifyToken,
    authorizeRoles("admin"),
    getAllIssues
);

// Get issues reported by a specific user (Citizen specific)
router.get("/myIssues", verifyToken, authorizeRoles("citizen"), getMyIssues);

// Update issue status (Admin specific)
router.put(
    "/updateStatus/:id",
    verifyToken,
    authorizeRoles("admin"),
    updateIssueStatus
);

// Assign issue to a officer (Admin specific)
router.patch(
    "/assign/:id",
    verifyToken,
    authorizeRoles("admin"),
    assignIssue
);

// See a particular issue (Admin and Citizen specific)
router.get("/getIssue/:id", verifyToken, getIssueById);

// Delete an issue
router.delete(
    "/delete/:id",
    verifyToken,
    deleteIssue
);

module.exports = router;
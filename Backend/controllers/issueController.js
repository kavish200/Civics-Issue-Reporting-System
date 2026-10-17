const Issue = require("../models/issueModel");
const User = require("../models/userModel");

// Create a new issue
const createIssue = async (req, res) => {
    try {
        const {title, description, category, location, image} = req.body;

        const issue = await Issue.create({
            title,
            description,
            category,
            location,
            image,
            reportedBy: req.user.id
        })

        issue.save();

        res.status(201).json({
            message: "Issue reported successfully",
            issue
        })
    } catch(err) {
        res.status(500).json({
            message: "Failed to report issue",
            error: err.message
        })
    }
};

// Get all issues (Admin only)
const getAllIssues = async (req, res) => {
    try {
        const issues = await Issue.find().populate("reportedBy", "name email");

        res.status(200).json({
            message: "Issues retrieved successfully",
            count: issues.length,
            issues
        })
    } catch(err) {
        res.status(500).json({
            message: "Failed to retrieve issues",
            error: err.message
        })
    }
};

// Get issues reported by a specific user (Citizen only)
const getMyIssues = async (req, res) => {
    try {
        const issues = await Issue.find({ reportedBy: req.user.id });

        res.status(200).json({
            message: "User issues retrieved successfully",
            count: issues.length,
            issues
        })
    } catch(err) {
        res.status(500).json({
            message: "Failed to retrieve user issues",
            error: err.message
        })
    }
};

// Update issue status (Admin only)
const updateIssueStatus = async (req, res) => {
    try {
        const { status } = req.body;

        const allowedStatuses = [
            "Reported",
            "Assigned",
            "In progress",
            "Resolved",
            "Rejected"
        ];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                message: "Invalid issue status"
            });
        }

        const issue = await Issue.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true, runValidators: true }
        );

        if (!issue) {
            return res.status(404).json({
                message: "Issue not found"
            });
        }

        res.status(200).json({
            message: "Issue status updated successfully",
            issue
        });

    } catch (err) {
        res.status(500).json({
            message: "Failed to update issue status",
            error: err.message
        });
    }
};

// Assign an issue to a offier (Admin only)
const assignIssue = async (req, res) => {
    try {
        const { officerId } = req.body;

        const issue = await Issue.findById(req.params.id);

        if (!issue) {
            return res.status(404).json({
                message: "Issue not found"
            });
        }

        issue.assignedTo = officerId;
        issue.status = "Assigned";

        await issue.save();

        res.status(200).json({
            message: "Issue assigned successfully",
            issue
        });

    } catch (err) {
        res.status(500).json({
            message: "Failed to assign issue",
            error: err.message
        });
    }
};

// See a particular issue (Admin and Citizen)
const getIssueById = async (req, res) => {
    try {
        const issue = await Issue.findById(req.params.id)
            .populate("reportedBy", "username email")
            .populate("assignedTo", "username email");

        if (!issue) {
            return res.status(404).json({
                message: "Issue not found"
            });
        }

        res.status(200).json({
            message: "Issue fetched successfully",
            issue
        });

    } catch (err) {
        res.status(500).json({
            message: "Failed to fetch issue",
            error: err.message
        });
    }
};

// Delete a issue
const deleteIssue = async (req, res) => {
    try {
        const issue = await Issue.findById(req.params.id);

        if (!issue) {
            return res.status(404).json({
                message: "Issue not found"
            });
        }

        // Only the reporter or admin can delete
        if (
            issue.reportedBy.toString() !== req.user.id &&
            req.user.role !== "admin"
        ) {
            return res.status(403).json({
                message: "You are not allowed to delete this issue"
            });
        }

        await issue.deleteOne();

        res.status(200).json({
            message: "Issue deleted successfully",
            issue
        });

    } catch (err) {
        res.status(500).json({
            message: "Failed to delete issue",
            error: err.message
        });
    }
};


module.exports = {
    createIssue,
    getAllIssues, 
    getMyIssues, 
    updateIssueStatus,
    assignIssue,
    getIssueById,
    deleteIssue,
};
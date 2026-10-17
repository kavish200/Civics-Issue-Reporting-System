const mongoose = require("mongoose");

const issueSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        enum: ["road", "water", "electricity", "sanitation", "Drainage", "Street Lighting", "other"],
        required: true
    },
    location: {
        address: {
            type: String,
            required: true,
            trim: true
        },
        latitude: {
            type: Number,
            required: true
        },
        longitude: {
            type: Number,
            required: true
        }
    },
    image: {
        type: String,
    },
    reportedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },
    status: {
        type: String,
        enum: ["Reported", "Assigned", "In progress", "Resolved", "Rejected"],
        default: "Reported"
    }   
}, {
    timestamps: true
})

const Issue = mongoose.model("Issue", issueSchema);
module.exports = Issue;
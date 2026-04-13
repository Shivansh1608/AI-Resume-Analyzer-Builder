const mongoose = require("mongoose");

const resumeSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true
    },
    title: {
        type: String,
        default: "My Resume"
    },
    template: {
        type: String,
        enum: ["modern", "minimal", "ats"],
        default: "ats"
    },
    personalInfo: {
        name: { type: String, required: true },
        email: { type: String, required: true },
        phone: { type: String },
        location: { type: String },
        links: [{ type: String }] // LinkedIn, GitHub, etc.
    },
    summary: {
        type: String,
        default: ""
    },
    experience: [{
        company: { type: String, required: true },
        role: { type: String, required: true },
        location: { type: String },
        startDate: { type: String },
        endDate: { type: String },
        description: { type: String }
    }],
    education: [{
        institution: { type: String, required: true },
        degree: { type: String, required: true },
        field: { type: String },
        startDate: { type: String },
        endDate: { type: String }
    }],
    projects: [{
        name: { type: String, required: true },
        description: { type: String },
        technologies: [{ type: String }],
        link: { type: String }
    }],
    skills: [{ type: String }],
    achievements: [{ type: String }],
    links: [{
        label: { type: String },
        url: { type: String }
    }]
}, { timestamps: true });

const resumeModel = mongoose.model("resumes", resumeSchema);
module.exports = resumeModel;

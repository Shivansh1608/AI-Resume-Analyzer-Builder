const pdfParse = require("pdf-parse")
const { generateInterviewReport, generateResumePdf } = require("../services/ai.service")
const interviewReportModel = require("../models/interviewReport.model")




/**
 * @description Controller to generate interview report based on user self description, resume and job description.
 */
async function generateInterViewReportController(req, res) {
    try {
        const selfDescription = req.body.selfDescription || ""
        const jobDescription = req.body.jobDescription || ""

        if (!jobDescription.trim() || (!req.file && !selfDescription.trim())) {
            return res.status(400).json({
                message: "Please provide a job description and either a resume or self description."
            })
        }

        let resumeText = ""
        if (req.file && req.file.buffer) {
            const isPdf = req.file.mimetype === "application/pdf" || req.file.originalname?.toLowerCase().endsWith(".pdf")

            if (isPdf) {
                try {
                    const pdfData = await pdfParse(req.file.buffer)
                    resumeText = (pdfData?.text || "").trim()
                } catch (pdfErr) {
                    console.error("Failed to parse uploaded resume PDF:", pdfErr)
                    resumeText = ""
                }
            } else {
                console.warn("Unsupported resume file type. Only PDF parsing is supported.", req.file.mimetype)
                resumeText = ""
            }
        }

        const interViewReportByAi = await generateInterviewReport({
            resume: resumeText,
            selfDescription: selfDescription.trim(),
            jobDescription: jobDescription.trim()
        })

        const safeReport = {
            title: interViewReportByAi?.title || jobDescription.trim().slice(0, 120) || "Interview Report",
            matchScore: typeof interViewReportByAi?.matchScore === "number" ? interViewReportByAi.matchScore : 0,
            technicalQuestions: Array.isArray(interViewReportByAi?.technicalQuestions) ? interViewReportByAi.technicalQuestions : [],
            behavioralQuestions: Array.isArray(interViewReportByAi?.behavioralQuestions) ? interViewReportByAi.behavioralQuestions : [],
            skillGaps: Array.isArray(interViewReportByAi?.skillGaps) ? interViewReportByAi.skillGaps : [],
            preparationPlan: Array.isArray(interViewReportByAi?.preparationPlan) ? interViewReportByAi.preparationPlan : [],
            user: req.user.id,
            resume: resumeText,
            selfDescription: selfDescription.trim(),
            jobDescription: jobDescription.trim()
        }

        try {
            const interviewReport = await interviewReportModel.create(safeReport)
            return res.status(201).json({
                message: "Interview report generated successfully.",
                interviewReport,
                saved: true
            })
        } catch (saveErr) {
            console.error("Interview report save failed:", saveErr)
            return res.status(201).json({
                message: "Interview report generated successfully, but could not be saved.",
                interviewReport: safeReport,
                saved: false,
                error: saveErr.message
            })
        }
    } catch (err) {
        console.error(err)
        return res.status(500).json({
            message: "Unable to generate interview report.",
            interviewReport: null,
            error: err.message
        })
    }
}

/**
 * @description Controller to get interview report by interviewId.
 */
async function getInterviewReportByIdController(req, res) {
    try {
        const { interviewId } = req.params

        const interviewReport = await interviewReportModel.findOne({ _id: interviewId, user: req.user.id })

        if (!interviewReport) {
            return res.status(404).json({
                message: "Interview report not found.",
                interviewReport: null
            })
        }

        return res.status(200).json({
            message: "Interview report fetched successfully.",
            interviewReport
        })
    } catch (err) {
        console.error(err)
        return res.status(500).json({
            message: "Unable to fetch interview report.",
            interviewReport: null,
            error: err.message
        })
    }
}


/** 
 * @description Controller to get all interview reports of logged in user.
 */
async function getAllInterviewReportsController(req, res) {
    try {
        const interviewReports = await interviewReportModel.find({ user: req.user.id }).sort({ createdAt: -1 }).select("-resume -selfDescription -jobDescription -__v -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan")

        return res.status(200).json({
            message: "Interview reports fetched successfully.",
            interviewReports
        })
    } catch (err) {
        console.error(err)
        return res.status(500).json({
            message: "Unable to fetch interview reports.",
            interviewReports: [],
            error: err.message
        })
    }
}


/**
 * @description Controller to generate resume PDF based on user self description, resume content and job description.
 */
async function generateResumePdfController(req, res) {
    try {
        const { interviewReportId } = req.params

        const interviewReport = await interviewReportModel.findById(interviewReportId)

        if (!interviewReport) {
            return res.status(404).json({
                message: "Interview report not found."
            })
        }

        const { resume, jobDescription, selfDescription } = interviewReport

        const pdfBuffer = await generateResumePdf({ resume, jobDescription, selfDescription })

        res.set({
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename=resume_${interviewReportId}.pdf`
        })

        return res.send(pdfBuffer)
    } catch (err) {
        console.error(err)
        return res.status(500).json({
            message: "Unable to generate resume PDF.",
            error: err.message
        })
    }
}

module.exports = { generateInterViewReportController, getInterviewReportByIdController, getAllInterviewReportsController, generateResumePdfController }
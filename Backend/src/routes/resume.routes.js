const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const resumeController = require("../controllers/resume.controller");

const resumeRouter = express.Router();

/**
 * @route POST /api/resume/
 * @description Create or update a resume via JSON
 * @access private
 */
resumeRouter.post("/", authMiddleware.authUser, resumeController.saveResumeController);

/**
 * @route GET /api/resume/
 * @description Get all saved resumes for logged in user
 * @access private
 */
resumeRouter.get("/", authMiddleware.authUser, resumeController.getResumesController);

/**
 * @route GET /api/resume/:id
 * @description Get a specific resume by ID
 * @access private
 */
resumeRouter.get("/:id", authMiddleware.authUser, resumeController.getResumeByIdController);

/**
 * @route POST /api/resume/enhance
 * @description Enhance a specific content field (skills, experience, etc.) using Gemini
 * @access private
 */
resumeRouter.post("/enhance", authMiddleware.authUser, resumeController.enhanceResumeTextController);

/**
 * @route GET /api/resume/:id/pdf
 * @description Download resume as PDF using Puppeteer
 * @access private
 */
resumeRouter.get("/:id/pdf", authMiddleware.authUser, resumeController.downloadResumePdfController);

module.exports = resumeRouter;

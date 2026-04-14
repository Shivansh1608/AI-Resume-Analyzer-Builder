const resumeModel = require("../models/resume.model");
const { enhanceResumeContent } = require("../services/ai.service");
const puppeteer = require("puppeteer");

/**
 * @description Create or update a resume
 */
async function saveResumeController(req, res) {
    try {
        const resumeData = req.body;
        
        let resume;
        if (resumeData._id) {
            resume = await resumeModel.findOneAndUpdate(
                { _id: resumeData._id, user: req.user.id },
                { $set: resumeData },
                { new: true }
            );
            if (!resume) {
                return res.status(404).json({ message: "Resume not found" });
            }
        } else {
            resumeData.user = req.user.id;
            resume = await resumeModel.create(resumeData);
        }

        return res.status(200).json({
            message: "Resume saved successfully",
            resume
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            message: "Unable to save resume",
            error: err.message
        });
    }
}

/**
 * @description Get all resumes for user
 */
async function getResumesController(req, res) {
    try {
        const resumes = await resumeModel.find({ user: req.user.id }).sort({ createdAt: -1 });
        return res.status(200).json({
            message: "Resumes fetched successfully",
            resumes
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            message: "Unable to fetch resumes",
            error: err.message
        });
    }
}

/**
 * @description Get resume by ID
 */
async function getResumeByIdController(req, res) {
    try {
        const resume = await resumeModel.findOne({ _id: req.params.id, user: req.user.id });
        if (!resume) {
            return res.status(404).json({ message: "Resume not found" });
        }
        return res.status(200).json({
            message: "Resume fetched successfully",
            resume
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            message: "Unable to fetch resume",
            error: err.message
        });
    }
}

/**
 * @description Enhance specific text block using AI
 */
async function enhanceResumeTextController(req, res) {
    try {
        const { field, content, context } = req.body;
        
        if (!field || !content) {
            return res.status(400).json({ message: "Field and content are required for enhancement" });
        }

        const enhancedText = await enhanceResumeContent({ field, content, context });

        return res.status(200).json({
            message: "Content enhanced successfully",
            enhancedText
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            message: "Unable to enhance content",
            error: err.message
        });
    }
}

/**
 * @description Quick template HTML generator based on template style
 */
function getTemplateHtml(resume) {
    const { personalInfo = {}, summary, experience = [], education = [], projects = [], skills = [], links = [] } = resume;

    return `
    <html>
        <head>
            <meta charset="utf-8" />
            <style>
                body { margin: 0; padding: 0; font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif; color: #222; background: #f7f7f7; }
                .page { width: 210mm; min-height: 297mm; margin: 0 auto; padding: 24mm 20mm; background: #fff; box-sizing: border-box; }
                .header { display: flex; flex-direction: column; align-items: center; text-align: center; margin-bottom: 24px; }
                .header h1 { font-size: 34px; letter-spacing: -0.5px; margin: 0; color: #111; }
                .header-line { width: 80px; height: 4px; background: #111; margin: 12px 0; }
                .contact { font-size: 12px; color: #555; display: flex; flex-wrap: wrap; justify-content: center; gap: 12px; }
                .section { margin-bottom: 20px; }
                .section-title { font-size: 13px; letter-spacing: 1px; text-transform: uppercase; color: #111; margin-bottom: 12px; border-bottom: 1px solid #ddd; padding-bottom: 6px; }
                .section-item { margin-bottom: 16px; }
                .item-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
                .item-head h2 { font-size: 15px; margin: 0; color: #111; }
                .item-meta { font-size: 11px; color: #555; margin-top: 4px; }
                .item-sub { font-size: 12px; color: #555; margin-top: 4px; }
                .item-desc { font-size: 12px; line-height: 1.6; color: #333; margin-top: 10px; white-space: pre-line; }
                .tag-list { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
                .tag { background: #ececec; border-radius: 4px; padding: 6px 10px; font-size: 11px; color: #333; }
                .social-links { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; margin-top: 10px; }
                .social-links a { color: #111; font-size: 11px; text-decoration: none; }
                .social-links a:hover { text-decoration: underline; }
            </style>
        </head>
        <body>
            <div class="page">
                <div class="header">
                    <h1>${personalInfo.name || 'Your Name'}</h1>
                    <div class="header-line"></div>
                    <div class="contact">
                        ${personalInfo.email || ''}${personalInfo.email && personalInfo.phone ? ' | ' : ''}${personalInfo.phone || ''}${(personalInfo.email || personalInfo.phone) && personalInfo.location ? ' | ' : ''}${personalInfo.location || ''}
                    </div>
                    ${links.length > 0 ? `<div class="social-links">${links.map(link => `<a href="${link.url}" target="_blank">${link.label}</a>`).join('')}</div>` : ''}
                </div>

                ${summary ? `
                    <div class="section">
                        <div class="section-title">Professional Summary</div>
                        <div class="item-desc">${summary}</div>
                    </div>
                ` : ''}

                ${experience.length > 0 ? `
                    <div class="section">
                        <div class="section-title">Experience</div>
                        ${experience.map(exp => `
                            <div class="section-item">
                                <div class="item-head">
                                    <div>
                                        <h2>${exp.role || 'Role'}</h2>
                                        <div class="item-sub">${exp.company || 'Company'}${exp.location ? ` • ${exp.location}` : ''}</div>
                                    </div>
                                    <div class="item-meta">${exp.startDate || ''}${exp.startDate && exp.endDate ? ' – ' : ''}${exp.endDate || ''}</div>
                                </div>
                                ${exp.description ? `<div class="item-desc">${exp.description}</div>` : ''}
                            </div>
                        `).join('')}
                    </div>
                ` : ''}

                ${projects.length > 0 ? `
                    <div class="section">
                        <div class="section-title">Projects</div>
                        ${projects.map(proj => `
                            <div class="section-item">
                                <div class="item-head">
                                    <div>
                                        <h2>${proj.name || 'Project Name'}</h2>
                                    </div>
                                </div>
                                ${proj.description ? `<div class="item-desc">${proj.description}</div>` : ''}
                            </div>
                        `).join('')}
                    </div>
                ` : ''}

                ${education.length > 0 ? `
                    <div class="section">
                        <div class="section-title">Education</div>
                        ${education.map(edu => `
                            <div class="section-item">
                                <div class="item-head">
                                    <div>
                                        <h2>${edu.institution || 'Institution'}</h2>
                                        <div class="item-sub">${edu.degree || 'Degree'}${edu.field ? ` in ${edu.field}` : ''}</div>
                                    </div>
                                    <div class="item-meta">${edu.startDate || ''}${edu.startDate && edu.endDate ? ' – ' : ''}${edu.endDate || ''}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}

                ${skills.length > 0 ? `
                    <div class="section">
                        <div class="section-title">Skills</div>
                        <div class="tag-list">
                            ${skills.map(skill => `<span class="tag">${skill}</span>`).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        </body>
    </html>
    `;
}

async function generateResumePdfController(req, res) {
    try {
        const resumeData = req.body;
        if (!resumeData || !resumeData.personalInfo) {
            return res.status(400).json({ message: "Resume data is required to generate PDF." });
        }

        const html = getTemplateHtml(resumeData);
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: "networkidle0" });
        const pdfBuffer = await page.pdf({
            format: "A4",
            printBackground: true,
            margin: { top: "20mm", bottom: "20mm", left: "15mm", right: "15mm" }
        });
        await browser.close();

        res.set({
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename=${(resumeData.personalInfo?.name || 'resume').replace(/\s+/g, '_')}.pdf`
        });

        return res.send(pdfBuffer);
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            message: "Unable to generate resume PDF",
            error: err.message
        });
    }
}

/**
 * @description Delete a saved resume
 */
async function deleteResumeController(req, res) {
    try {
        const resume = await resumeModel.findOneAndDelete({ _id: req.params.id, user: req.user.id });
        if (!resume) {
            return res.status(404).json({ message: "Resume not found" });
        }

        return res.status(200).json({
            message: "Resume deleted successfully",
            resumeId: req.params.id
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            message: "Unable to delete resume",
            error: err.message
        });
    }
}

/**
 * @description Export Resume to PDF
 */
async function downloadResumePdfController(req, res) {
    try {
        const resume = await resumeModel.findOne({ _id: req.params.id, user: req.user.id });
        if (!resume) {
            return res.status(404).json({ message: "Resume not found" });
        }

        const html = getTemplateHtml(resume);

        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: "networkidle0" });

        const pdfBuffer = await page.pdf({
            format: "A4",
            printBackground: true,
            margin: { top: "20mm", bottom: "20mm", left: "15mm", right: "15mm" }
        });

        await browser.close();

        res.set({
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename=${resume.personalInfo?.name || 'resume'}.pdf`
        });

        return res.send(pdfBuffer);
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            message: "Unable to generate resume PDF",
            error: err.message
        });
    }
}

module.exports = {
    saveResumeController,
    getResumesController,
    getResumeByIdController,
    enhanceResumeTextController,
    generateResumePdfController,
    downloadResumePdfController,
    deleteResumeController
};

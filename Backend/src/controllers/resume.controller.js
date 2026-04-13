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
    // A simple HTML structure parsing the resume object depending on template type.
    const { personalInfo, summary, experience, education, projects, skills, achievements, links } = resume;
    
    return `
    <html>
        <head>
            <style>
                body { font-family: 'Helvetica', 'Arial', sans-serif; color: #333; line-height: 1.5; padding: 20px; }
                h1 { margin-bottom: 5px; color: #2C3E50; }
                .contact-info { margin-bottom: 5px; font-size: 14px; color: #7F8C8D; }
                .social-links { margin-bottom: 20px; font-size: 13px; color: #3498DB; border-bottom: 1px solid #eee; padding-bottom: 15px; }
                .social-links a { color: #3498DB; text-decoration: none; margin-right: 15px; }
                .section { margin-bottom: 20px; }
                .section-title { font-size: 18px; color: #2C3E50; text-transform: uppercase; border-bottom: 2px solid #2C3E50; padding-bottom: 5px; margin-bottom: 15px; }
                .item-header { display: flex; justify-content: space-between; font-weight: bold; margin-bottom: 5px; }
                .item-sub { font-style: italic; color: #555; margin-bottom: 5px; }
                .item-desc { font-size: 14px; margin-bottom: 15px; white-space: pre-line; }
                .tag-list { display: flex; flex-wrap: wrap; gap: 8px; }
                .tag { background: #ECF0F1; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
            </style>
        </head>
        <body>
            <h1>${personalInfo.name || "Unnamed"}</h1>
            <div class="contact-info">
                ${personalInfo.email} ${personalInfo.phone ? ' | ' + personalInfo.phone : ''} ${personalInfo.location ? ' | ' + personalInfo.location : ''}
            </div>
            ${links && links.length > 0 ? `
            <div class="social-links">
                ${links.map(link => `<a href="${link.url}" target="_blank">${link.label}</a>`).join('')}
            </div>` : '<div style="border-bottom: 1px solid #eee; margin-bottom: 20px;"></div>'}

            ${summary ? `
            <div class="section">
                <div class="section-title">Summary</div>
                <div class="item-desc">${summary}</div>
            </div>` : ''}

            ${experience && experience.length > 0 ? `
            <div class="section">
                <div class="section-title">Experience</div>
                ${experience.map(exp => `
                    <div>
                        <div class="item-header"><span>${exp.role}</span><span>${exp.startDate || ''} - ${exp.endDate || 'Present'}</span></div>
                        <div class="item-sub">${exp.company} ${exp.location ? '- ' + exp.location : ''}</div>
                        <div class="item-desc">${exp.description || ''}</div>
                    </div>
                `).join('')}
            </div>` : ''}

            ${education && education.length > 0 ? `
            <div class="section">
                <div class="section-title">Education</div>
                ${education.map(edu => `
                    <div>
                        <div class="item-header"><span>${edu.institution}</span><span>${edu.startDate || ''} - ${edu.endDate || ''}</span></div>
                        <div class="item-sub">${edu.degree} ${edu.field ? 'in ' + edu.field : ''}</div>
                    </div>
                `).join('')}
            </div>` : ''}

            ${projects && projects.length > 0 ? `
            <div class="section">
                <div class="section-title">Projects</div>
                ${projects.map(proj => `
                    <div>
                        <div class="item-header"><span>${proj.name}</span></div>
                        <div class="item-desc">${proj.description || ''}</div>
                    </div>
                `).join('')}
            </div>` : ''}

            ${skills && skills.length > 0 ? `
            <div class="section">
                <div class="section-title">Skills</div>
                <div class="tag-list">
                    ${skills.map(s => `<span class="tag">${s}</span>`).join('')}
                </div>
            </div>` : ''}
        </body>
    </html>
    `;
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
    downloadResumePdfController
};

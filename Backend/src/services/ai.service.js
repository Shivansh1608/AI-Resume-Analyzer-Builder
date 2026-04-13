const { GoogleGenAI } = require("@google/genai")
const { z } = require("zod")
const { zodToJsonSchema } = require("zod-to-json-schema")
const puppeteer = require("puppeteer")

const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_GENAI_API_KEY
})

const interviewReportSchema = z.object({
    matchScore: z.number().describe("A score between 0 and 100 indicating how well the candidate's profile matches the job describe"),
    technicalQuestions: z.array(z.object({
        question: z.string().describe("The technical question can be asked in the interview"),
        intention: z.string().describe("The intention of interviewer behind asking this question"),
        answer: z.string().describe("How to answer this question, what points to cover, what approach to take etc.")
    })).describe("Technical questions that can be asked in the interview along with their intention and how to answer them"),
    behavioralQuestions: z.array(z.object({
        question: z.string().describe("The technical question can be asked in the interview"),
        intention: z.string().describe("The intention of interviewer behind asking this question"),
        answer: z.string().describe("How to answer this question, what points to cover, what approach to take etc.")
    })).describe("Behavioral questions that can be asked in the interview along with their intention and how to answer them"),
    skillGaps: z.array(z.object({
        skill: z.string().describe("The skill which the candidate is lacking"),
        severity: z.enum([ "low", "medium", "high" ]).describe("The severity of this skill gap, i.e. how important is this skill for the job and how much it can impact the candidate's chances")
    })).describe("List of skill gaps in the candidate's profile along with their severity"),
    preparationPlan: z.array(z.object({
        day: z.number().describe("The day number in the preparation plan, starting from 1"),
        focus: z.string().describe("The main focus of this day in the preparation plan, e.g. data structures, system design, mock interviews etc."),
        tasks: z.array(z.string()).describe("List of tasks to be done on this day to follow the preparation plan, e.g. read a specific book or article, solve a set of problems, watch a video etc.")
    })).describe("A day-wise preparation plan for the candidate to follow in order to prepare for the interview effectively"),
    title: z.string().describe("The title of the job for which the interview report is generated"),
})

const fallbackInterviewReport = ({ jobDescription, selfDescription, resume }) => ({
    title: jobDescription.trim().slice(0, 120) || "Interview Report",
    matchScore: 70,
    technicalQuestions: [
        {
            question: "What relevant experience do you have for this role?",
            intention: "Assess practical experience and fit for the technical requirements.",
            answer: "Highlight your most relevant experience, key technologies used, and measurable outcomes."
        },
        {
            question: "How would you approach solving a critical issue in the product?",
            intention: "Evaluate problem solving and debugging process.",
            answer: "Explain how you would investigate the issue, reproduce it, isolate the root cause, and verify a fix."
        }
    ],
    behavioralQuestions: [
        {
            question: "Tell me about a time you worked with a team to deliver a project.",
            intention: "Evaluate collaboration and communication skills.",
            answer: "Describe the project, your role, how you coordinated with the team, and the outcome."
        }
    ],
    skillGaps: [
        {
            skill: "Domain-specific knowledge",
            severity: "medium"
        }
    ],
    preparationPlan: [
        {
            day: 1,
            focus: "Review the job requirements and core skills.",
            tasks: [
                "Map your experience to the job description.",
                "List key technical and behavioral stories to share."
            ]
        },
        {
            day: 2,
            focus: "Practice technical problem solving.",
            tasks: [
                "Solve 3-5 coding problems related to the role.",
                "Review common data structures and algorithms." 
            ]
        }
    ]
})

async function generateInterviewReport({ resume, selfDescription, jobDescription }) {
    if (!process.env.GOOGLE_GENAI_API_KEY) {
        return fallbackInterviewReport({ resume, selfDescription, jobDescription })
    }

    const prompt = `Generate an interview report for a candidate with the following details:
                        Resume: ${resume}
                        Self Description: ${selfDescription}
                        Job Description: ${jobDescription}
`

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: zodToJsonSchema(interviewReportSchema)
            }
        })

        if (!response?.text) {
            throw new Error("AI response text is missing")
        }

        return JSON.parse(response.text)
    } catch (err) {
        console.error("AI interview generation failed:", err)
        return fallbackInterviewReport({ resume, selfDescription, jobDescription })
    }
}

async function generatePdfFromHtml(htmlContent) {
    const browser = await puppeteer.launch()
    const page = await browser.newPage()
    await page.setContent(htmlContent, { waitUntil: "networkidle0" })

    const pdfBuffer = await page.pdf({
        format: "A4",
        margin: {
            top: "20mm",
            bottom: "20mm",
            left: "15mm",
            right: "15mm"
        }
    })

    await browser.close()

    return pdfBuffer
}

async function generateResumePdf({ resume, selfDescription, jobDescription }) {
    const resumePdfSchema = z.object({
        html: z.string().describe("The HTML content of the resume which can be converted to PDF using any library like puppeteer")
    })

    const prompt = `Generate resume for a candidate with the following details:
                        Resume: ${resume}
                        Self Description: ${selfDescription}
                        Job Description: ${jobDescription}

                        the response should be a JSON object with a single field "html" which contains the HTML content of the resume which can be converted to PDF using any library like puppeteer.
                        The resume should be tailored for the given job description and should highlight the candidate's strengths and relevant experience. The HTML content should be well-formatted and structured, making it easy to read and visually appealing.
                        The content of resume should be not sound like it's generated by AI and should be as close as possible to a real human-written resume.
                        you can highlight the content using some colors or different font styles but the overall design should be simple and professional.
                        The content should be ATS friendly, i.e. it should be easily parsable by ATS systems without losing important information.
                        The resume should not be so lengthy, it should ideally be 1-2 pages long when converted to PDF. Focus on quality rather than quantity and make sure to include all the relevant information that can increase the candidate's chances of getting an interview call for the given job description.
                    `

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: zodToJsonSchema(resumePdfSchema)
            }
        })

        const jsonContent = response?.text ? JSON.parse(response.text) : null
        const html = jsonContent?.html || `<html><body><h1>Resume</h1><p>${resume}</p></body></html>`
        return await generatePdfFromHtml(html)
    } catch (err) {
        console.error("AI resume PDF generation failed:", err)
        const html = `<html><body><h1>Resume</h1><p>${resume}</p><p>${selfDescription}</p><p>${jobDescription}</p></body></html>`
        return await generatePdfFromHtml(html)
    }
}

async function enhanceResumeContent({ field, content, context = "" }) {
    if (!process.env.GOOGLE_GENAI_API_KEY) {
        return content // Fallback to returning original content if no API key
    }

    const enhanceSchema = z.object({
        enhancedText: z.string().describe(`Professional, ATS-friendly enhanced version of the provided ${field} content`)
    })

    const prompt = `You are an expert technical resume writer. Enhance the following ${field} content for a resume.
    Original Content: ${content}
    Additional Context: ${context}
    
    Make it sound professional, action-oriented, and metric-driven where applicable. Keep it concise.
    Return ONLY a JSON object with the "enhancedText" field.
    `

    try {
        const response = await ai.models.generateContent({
            model: "gemini-1.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: zodToJsonSchema(enhanceSchema)
            }
        })

        const jsonContent = response?.text ? JSON.parse(response.text) : null
        return jsonContent?.enhancedText || content
    } catch (err) {
        console.error("AI enhancement failed:", err)
        return content
    }
}

module.exports = { generateInterviewReport, generateResumePdf, enhanceResumeContent }
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
    })).min(8).describe("Exactly 8 to 9 technical questions that can be asked in the interview along with their intention and how to answer them"),
    behavioralQuestions: z.array(z.object({
        question: z.string().describe("The behavioral question can be asked in the interview"),
        intention: z.string().describe("The intention of interviewer behind asking this question"),
        answer: z.string().describe("How to answer this question, what points to cover, what approach to take etc.")
    })).min(8).describe("Exactly 8 to 9 behavioral questions that can be asked in the interview along with their intention and how to answer them"),
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
        { question: "What relevant experience do you have for this role?", intention: "Assess practical experience and fit.", answer: "Highlight your most relevant experience, key technologies used, and measurable outcomes." },
        { question: "Explain the difference between synchronous and asynchronous programming.", intention: "Test understanding of concurrency concepts.", answer: "Synchronous code runs sequentially; async allows non-blocking operations using callbacks, promises, or async/await." },
        { question: "How would you design a scalable REST API?", intention: "Evaluate system design thinking.", answer: "Discuss statelessness, versioning, pagination, rate limiting, authentication, and horizontal scaling strategies." },
        { question: "What is the difference between SQL and NoSQL databases?", intention: "Test database knowledge.", answer: "SQL uses structured schemas and ACID transactions; NoSQL offers flexibility, scalability, and multiple data models." },
        { question: "How do you ensure code quality in your projects?", intention: "Assess engineering discipline.", answer: "Mention code reviews, unit/integration tests, linting, CI/CD pipelines, and thorough documentation." },
        { question: "Explain the concept of caching and when you would use it.", intention: "Evaluate performance optimization knowledge.", answer: "Caching stores frequently accessed data to reduce latency. Use it for expensive DB queries, API responses, or computations." },
        { question: "How do you handle errors and exceptions in production applications?", intention: "Check robustness and reliability awareness.", answer: "Discuss try/catch, error boundaries, centralized error logging, alerting, and graceful degradation strategies." },
        { question: "Describe a challenging technical problem you solved recently.", intention: "Assess problem-solving and communication skills.", answer: "Use the STAR method — Situation, Task, Action, Result — with concrete technical details and learnings." }
    ],
    behavioralQuestions: [
        { question: "Tell me about a time you worked with a team to deliver a project.", intention: "Evaluate collaboration and communication.", answer: "Describe the project, your role, how you coordinated, resolved conflicts, and the final outcome." },
        { question: "Describe a situation where you missed a deadline. How did you handle it?", intention: "Assess accountability and time management.", answer: "Be honest, explain reasons, steps taken to communicate proactively, and what you learned to prevent recurrence." },
        { question: "Tell me about a time you disagreed with a team member. How did you resolve it?", intention: "Evaluate conflict resolution skills.", answer: "Explain how you listened, presented your perspective respectfully, and reached a constructive compromise." },
        { question: "How do you prioritize tasks when working on multiple projects simultaneously?", intention: "Assess organizational and time management skills.", answer: "Mention frameworks like Eisenhower Matrix, clear stakeholder communication, and daily planning habits." },
        { question: "Describe a time you received critical feedback. How did you respond?", intention: "Evaluate self-awareness and growth mindset.", answer: "Show you listened without defensiveness, acknowledged the feedback, took specific action, and improved." },
        { question: "Tell me about a time you went above and beyond for a project.", intention: "Assess initiative and work ethic.", answer: "Describe the extra effort, your motivation behind it, and the measurable positive impact it had." },
        { question: "How do you keep yourself updated with the latest trends in your field?", intention: "Evaluate learning mindset and self-improvement.", answer: "Mention blogs, online courses, open source contributions, conferences, or communities you actively follow." },
        { question: "Describe a time you had to learn something new quickly under pressure.", intention: "Assess adaptability and learning agility.", answer: "Explain the situation, your strategy for rapid learning (resources, mentors, docs), and how you applied it successfully." }
    ],
    skillGaps: [
        { skill: "Domain-specific technical knowledge", severity: "medium" },
        { skill: "System design at scale", severity: "high" },
        { skill: "Testing and QA practices", severity: "medium" },
        { skill: "Cloud services (AWS / GCP / Azure)", severity: "low" }
    ],
    preparationPlan: [
        { day: 1, focus: "Analyze the job description and map your skills.", tasks: ["Read the JD carefully and highlight key requirements.", "List matching and missing skills.", "Update your resume to align with the role."] },
        { day: 2, focus: "Core data structures and algorithms.", tasks: ["Revise arrays, linked lists, trees, and graphs.", "Solve 5 coding problems on LeetCode.", "Review time and space complexity analysis."] },
        { day: 3, focus: "System design fundamentals.", tasks: ["Study scalability, load balancing, and caching patterns.", "Practice designing a URL shortener or chat system.", "Watch a system design breakdown video."] },
        { day: 4, focus: "Role-specific technologies and frameworks.", tasks: ["Deep dive into frameworks or tools listed in the JD.", "Build a small demo project using them.", "Read official documentation and best practices."] },
        { day: 5, focus: "Behavioral interview preparation.", tasks: ["Prepare STAR stories for 8 common behavioral questions.", "Practice answering out loud or with a friend.", "Focus on conflict, leadership, failure, and growth stories."] },
        { day: 6, focus: "Mock interviews and feedback.", tasks: ["Do a full mock technical interview (timed).", "Record yourself answering behavioral questions.", "Review answers, identify gaps, and refine."] },
        { day: 7, focus: "Final review and mindset preparation.", tasks: ["Review your notes and key concepts once more.", "Research the company's culture, products, and recent news.", "Prepare 3-5 insightful questions to ask the interviewer."] }
    ]
})

async function generateInterviewReport({ resume, selfDescription, jobDescription }) {
    if (!process.env.GOOGLE_GENAI_API_KEY) {
        return fallbackInterviewReport({ resume, selfDescription, jobDescription })
    }

    const prompt = `You are a senior technical interviewer. Generate a comprehensive interview report for a candidate applying for the following role.

Resume: ${resume}
Self Description: ${selfDescription}
Job Description: ${jobDescription}

IMPORTANT REQUIREMENTS:
- Generate EXACTLY 8 to 9 technical questions covering core concepts, problem solving, system design, and role-specific skills.
- Generate EXACTLY 8 to 9 behavioral questions covering teamwork, conflict resolution, leadership, time management, and situational judgment.
- Each question must have a clear intention and a detailed model answer.
- Skill gaps should list at least 4-6 skills the candidate is missing for this role.
- Preparation plan should cover at least 7 days.
- Match score should accurately reflect the candidate's fit for the role.
`

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash",
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
            model: "gemini-2.0-flash",
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
const express = require("express")
const cookieParser = require("cookie-parser")
const cors = require("cors")

const app = express()

const allowedOrigins = ["http://localhost:5173", "http://localhost:5174"]

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true)
        } else {
            callback(new Error("Not allowed by CORS"))
        }
    },
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
}))

/* require all the routes here */
const authRouter = require("./routes/auth.routes")
const interviewRouter = require("./routes/interview.routes")
const resumeRouter = require("./routes/resume.routes")

/* using all the routes here */
app.use("/api/auth", authRouter)
app.use("/api/interview", interviewRouter)
app.use("/api/resume", resumeRouter)

app.get("/", (req, res) => {
    res.status(200).json({ message: "Interview AI backend is running" })
})

app.use((req, res) => {
    res.status(404).json({
        message: "Route not found"
    })
})



app.use((err, req, res, next) => {
    console.error("Unhandled error:", err)
    res.status(500).json({
        message: "Internal server error",
        error: err?.message || "Unexpected error"
    })
})

module.exports = app
require("dotenv").config()
const app = require("./src/app")
const connectToDB = require("./src/config/database")

const requiredEnv = ["JWT_SECRET", "MONGO_URI"]
const missingEnv = requiredEnv.filter((key) => !process.env[key])

if (missingEnv.length > 0) {
    console.error("Missing required environment variables:", missingEnv.join(", "))
    process.exit(1)
}

connectToDB()
    .then(() => {
        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`)
        })
    })
    .catch((err) => {
        console.error("Server startup failed:", err)
        process.exit(1)
    })
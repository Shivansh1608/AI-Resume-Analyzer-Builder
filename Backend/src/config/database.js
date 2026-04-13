const mongoose = require("mongoose")

async function connectToDB() {
    const uri = process.env.MONGO_URI

    if (!uri) {
        throw new Error("MONGO_URI is not defined in environment variables")
    }

    try {
        await mongoose.connect(uri)
        console.log("Connected to Database")
    } catch (err) {
        console.error("Database connection failed:", err)
        throw err
    }
}

module.exports = connectToDB
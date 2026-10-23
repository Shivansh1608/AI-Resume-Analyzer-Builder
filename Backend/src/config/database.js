
const mongoose = require("mongoose");

async function connectToDB() {
    const uri = process.env.MONGO_URI;

    if (!uri) {
        throw new Error("MONGO_URI is not defined");
    }

    console.log("MONGO_URI exists:", Boolean(uri));
    console.log("URI starts with mongodb://:",
        uri.startsWith("mongodb://"));
    console.log("URI starts with mongodb+srv://:",
        uri.startsWith("mongodb+srv://"));
    console.log("URI has surrounding quotes:",
        uri.startsWith('"') || uri.startsWith("'"));
    console.log("URI has leading/trailing whitespace:",
        uri !== uri.trim());

    try {
        await mongoose.connect(uri.trim().replace(/^["']|["']$/g, ""));
        console.log("Connected to Database");
    } catch (err) {
        console.error("Database connection failed:", err.message);
        throw err;
    }
}

module.exports = connectToDB;

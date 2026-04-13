const jwt = require("jsonwebtoken")
const tokenBlacklistModel = require("../models/blacklist.model")



async function authUser(req, res, next) {
    const authHeader = req.headers.authorization || req.headers.Authorization || ""
    const tokenFromHeader = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : authHeader
    const tokenFromCookie = req.cookies?.token
    const tokenFromHeaderAlt = req.headers["x-access-token"] || req.headers["X-Access-Token"]

    const token = tokenFromHeader || tokenFromCookie || tokenFromHeaderAlt

    if (!token) {
        return res.status(401).json({
            message: "Token not provided."
        })
    }

    if (!process.env.JWT_SECRET) {
        console.error("JWT_SECRET is not defined in environment variables")
        return res.status(500).json({
            message: "Server configuration error."
        })
    }

    const isTokenBlacklisted = await tokenBlacklistModel.findOne({ token })

    if (isTokenBlacklisted) {
        return res.status(401).json({
            message: "Token is invalid."
        })
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        req.user = decoded
        req.token = token
        next()
    } catch (err) {
        console.error(err)
        return res.status(401).json({
            message: "Invalid or expired token."
        })
    }
}


module.exports = { authUser }
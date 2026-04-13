const userModel = require("../models/user.model")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const tokenBlacklistModel = require("../models/blacklist.model")

/**
 * @name registerUserController
 * @description register a new user, expects username, email and password in the request body
 * @access Public
 */
async function registerUserController(req, res) {
    try {
        const { username, email, password } = req.body

        if (!username || !email || !password) {
            return res.status(400).json({
                message: "Please provide username, email and password"
            })
        }

        const normalizedEmail = email.toLowerCase().trim()
        const normalizedUsername = username.trim()

        const isUserAlreadyExists = await userModel.findOne({
            $or: [ { username: normalizedUsername }, { email: normalizedEmail } ]
        })

        if (isUserAlreadyExists) {
            return res.status(400).json({
                message: "Account already exists with this email address or username"
            })
        }

        const hash = await bcrypt.hash(password, 10)

        const user = await userModel.create({
            username: normalizedUsername,
            email: normalizedEmail,
            password: hash
        })

        const token = jwt.sign(
            { id: user._id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        )

        res.cookie("token", token, { httpOnly: true, sameSite: "lax" })

        res.status(201).json({
            message: "User registered successfully",
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        })
    } catch (err) {
        console.error(err)
        res.status(500).json({
            message: "Unable to register user",
            error: err.message
        })
    }
}


/**
 * @name loginUserController
 * @description login a user, expects email and password in the request body
 * @access Public
 */
async function loginUserController(req, res) {
    try {
        const { email, password } = req.body

        if (!email || !password) {
            return res.status(400).json({
                message: "Please provide both email and password"
            })
        }

        const normalizedEmail = email.toLowerCase().trim()
        const user = await userModel.findOne({ email: normalizedEmail })

        if (!user) {
            return res.status(400).json({
                message: "Invalid email or password"
            })
        }

        const isPasswordValid = await bcrypt.compare(password, user.password)

        if (!isPasswordValid) {
            return res.status(400).json({
                message: "Invalid email or password"
            })
        }

        const token = jwt.sign(
            { id: user._id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        )

        res.cookie("token", token, { httpOnly: true, sameSite: "lax" })
        res.status(200).json({
            message: "User logged in successfully.",
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        })
    } catch (err) {
        console.error(err)
        res.status(500).json({
            message: "Unable to login user",
            error: err.message
        })
    }
}


/**
 * @name logoutUserController
 * @description clear token from user cookie and add the token in blacklist
 * @access public
 */
async function logoutUserController(req, res) {
    try {
        const authHeader = req.headers.authorization || ""
        let token = null

        if (authHeader.startsWith("Bearer ")) {
            token = authHeader.split(" ")[1]
        } else if (req.cookies && req.cookies.token) {
            token = req.cookies.token
        }

        if (token) {
            await tokenBlacklistModel.create({ token })
        }

        res.clearCookie("token")

        return res.status(200).json({
            message: "User logged out successfully"
        })
    } catch (err) {
        console.error(err)
        return res.status(500).json({
            message: "Unable to log out user",
            error: err.message
        })
    }
}

/**
 * @name getMeController
 * @description get the current logged in user details.
 * @access private
 */
async function getMeController(req, res) {
    try {
        const user = await userModel.findById(req.user.id)

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            })
        }

        return res.status(200).json({
            message: "User details fetched successfully",
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        })
    } catch (err) {
        console.error(err)
        return res.status(500).json({
            message: "Unable to fetch user details",
            error: err.message
        })
    }
}



module.exports = {
    registerUserController,
    loginUserController,
    logoutUserController,
    getMeController
}
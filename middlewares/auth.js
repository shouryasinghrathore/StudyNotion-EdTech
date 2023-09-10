// authorization
const jwt = require('jsonwebtoken');
require("dotenv").config();
const User = require("../models/User");

exports.auth = async (req, res, next) => {

    try {
        const token = req.cookies.token || req.body.token

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "missing token"
            })
        }

        try {

            const decode = jwt.verify(token, process.env.JWT_S)
            console.log(decode);
            // user.toObject()
            req.user = decode;
        }
        catch (err) {
            return res.status(401).json({
                success: false,
                message: "token is invalid",
            })
        }
        next();

    } catch (e) {
        console.log(e)
        return res.status(500).json({
            success: false,
            message: e.message,
        })
    }
}

// isStudent//
exports.isStudent = async (req, res, next) => {
    try {
        if (req.user.accountType !== "Student") {
            return res.status(401).json({
                success: false,
                message: "this is protected route for student only",
            })

        }
        next();

    } catch (err) {
        console.log(err)
        return res.status(500).json({
            success: false,
            message: err.message,
        })
    }

}


//isInstructor


exports.isInstructor = async (req, res, next) => {
    try {
        if (req.user.accountType !== "Instructor") {
            return res.status(401).json({
                success: false,
                message: "this is protected route for Instructor only",
            })

        }
        next();

    } catch (err) {
        console.log(err)
        return res.status(500).json({
            success: false,
            message: err.message,
        })
    }
}

//isAdmin


exports.isAdmin = async (req, res, next) => {
    try {
        if (req.user.accountType !== "Admin") {
            return res.status(401).json({
                success: false,
                message: "this is protected route for Admin only",
            })

        }
        next();

    } catch (err) {
        console.log(err)
        return res.status(500).json({
            success: false,
            message: err.message,
        })
    }
}












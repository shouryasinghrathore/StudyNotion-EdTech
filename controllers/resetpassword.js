const User = require('../models/User');
const mailSender = require('../utils/mailSender');
const crypto = require('crypto');
const bcrypt = require("bcrypt");
const resetPasswordTemp = require("../mail/templates/resetPasswordTemp")
// resetpasswordtoken -- send link to email//
exports.resetPasswordToken = async (req, res) => {
    // get email from reqbody/
    try {

        const email = req.body.email;
        console.log(" email =>", email)
        const user = await User.findOne({ email: email });
        if (!user) {
            return res.json({
                success: false,
                message: `This Email: ${email} is not Registered With Us Enter a Valid Email `,
            });
        }
        //validation

        console.log("userexist =>", user)

        const token = crypto.randomBytes(20).toString("hex");

        const updatedDetails = await User.findOneAndUpdate({
            email: email
        }, {
            token: token,
            resetPasswordExpires: Date.now() + 5 * 60 * 1000,
        }, { new: true })
        console.log("DETAILS", updatedDetails);

        const url = `https://localhost:3000/update-password/${token} `

        await mailSender(
            email,
            "Password Reset",
            resetPasswordTemp(url),
        );

        res.json({
            success: true,
            message:
                "Email Sent Successfully, Please Check Your Email to Continue Further",
        });
    } catch (err) {
        console.log(err)
        return res.status(500).json({
            error: err.message,
            success: false,
            message: `Some Error in Sending the Reset Message`,
        })
    }
}


exports.resetPassword = async (req,res) => {
    try {
        //data fetch
        const { password, confirmpassword, token } = req.body
        //validation
        console.log("token -> ",token)
        if (confirmpassword !== password) {
			return res.json({
				success: false,
				message: "Password and Confirm Password Does not Match",
			});
		}


        const userDetails = await User.findOne({token: token});
        console.log("userDetails ->",userDetails)

        if (!userDetails) {
            console.log("Token is invalid.");
           return res.json({
                success: false,
                message: `token is invalid`,
            })

        }
       else if (!(userDetails.resetPasswordExpires > Date.now())) {
        console.log("Token has expired.");
           return res.status(403).json({
                success: false,
				message: `Token is Expired, Please Regenerate Your Token`,
			});

        }

        // hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        await User.findOneAndUpdate(
            { token: token }, {
            password: hashedPassword
        }, { new: true }
        )
       return  res.json({
			success: true,
			message: `Password Reset Successful`,
		});

    }
    catch (err) {
        console.log(err);
        return res.status(500).json({
            error: err.message,
			success: false,
			message: `Some Error in Updating the Password`,
		});
    }




}














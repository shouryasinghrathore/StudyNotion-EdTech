// sendotp/
const User = require('../models/User')
const OTP = require('../models/OTP')
const Profile = require('../models/Profile')
const OTPGenerator = require('otp-generator')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mailSender = require('../utils/mailSender');
const { passwordUpdated } = require("../mail/templates/passwordUpdate");

require("dotenv").config();

exports.sendotp = async (req, res) => {
    try {
        const { email } = req.body;
        const checkUserPresent = await User.findOne({ email })

        if (checkUserPresent) {
            return res.status(401).json({
                sucess: false,
                message: "user already exists",
            })
        }
        var otp = OTPGenerator.generate(6, {
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            specialChars: false
        });

        const result = await OTP.findOne({ otp: otp });
        console.log("Result is Generate OTP Func");
		console.log("OTP", otp);
		console.log("Result", result);
        while (result) {
            otp = OTPGenerator.generate(6, {
                upperCaseAlphabets: false,
            });
        }


        const otpPayload = { email, otp }
        const otpBody = await OTP.create( otpPayload )
        console.log("otp body -> ", otpBody)

        res.status(200).json({
            success: true,
            message: "otp send sucessfully",
            otp,
        })

    } catch (err) {
        console.log(err)
        res.status(500).json({
            success: false,
            message:err.message
        })

    }
}

//signup
exports.signup = async (req, res) => {
    try {

        const {
            email,
            firstName,
            lastName,
            password,
            accountType,
            confirmpassword,
            contactNumber ,
            otp, } = req.body;

        //all feilds are required
        if (!email || !firstName || !lastName || !password || !contactNumber || !confirmpassword || !otp) {
            return res.status(403).json({
                success: false,
                message: "All fields are required"
            })
        }

        //2 password match karlo
        if (password !== confirmpassword) {
            return res.status(403).json({
                success: false,
                message: "passwords and confirmpassword do not match"
            })
        }



        // check user already exist or not//
    	const existingUser = await User.findOne({ email });
		if (existingUser) {
			return res.status(400).json({
				success: false,
				message: "User already exists. Please sign in to continue.",
			});
		}


        //find most recent entry of otp in database
        const recentOtp = await OTP.find({ email }).sort({ createdAt: -1 }).limit(1);

        console.log("recentOtp -> ", recentOtp);
        if (recentOtp.length === 0) {
            // OTP not found for the email
            return res.status(404).json({
                sucess: false,
                message: "The OTP is not valid",
            })
        }  else if (otp !== recentOtp[0].otp) {
			// Invalid OTP
			return res.status(400).json({
				success: false,
				message: "The OTP is not valid",
			});
		}

        //------------Hash password------------

        const hashedPassword = await bcrypt.hash(password, 10);
        let approved = "";
		approved === "Instructor" ? (approved = false) : (approved = true);


        const ProfileDetails = await Profile.create({
            gender: null,
            dateofBirth: null,
            about: null,
            contactNumber: null,
        })

        const user = await User.create({
            email, firstName,
            contactNumber,
            lastName,
            password: hashedPassword,
            accountType: accountType,
            approved: approved,
            additionalDetails: ProfileDetails._id,
            image: `https://api.dicebear.com/5.x/initials/svg?seed=${firstName}${lastName}`
        })

        return res.status(200).json({
            success: true,
            user,
            message: "user rejistered successfully",
        })

    } catch (err) {
        console.log(err);
        res.status(500).json({
            success: false,
            error: err.message,
            message: 'User cannot be registered. Please try again..',
        })
    }

}







//login

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(403).json({
                success: false,
                message: "Enter your email address and password correctly try again..."
            })
        }

        const user = await User.findOne({ email: email }).populate("additionalDetails")

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "user is not rejistered Please signup First"
            })
        }

        if (await bcrypt.compare(password, user.password)) {
            const payload = {
                email: user.email,
                id: user._id,
                accountType: user.accountType,
            }
            const token = jwt.sign(payload, process.env.JWT_S, { expiresIn: "2h" });
            user.toObject();

            user.Token = token;
            user.password = undefined;
            const options = {
                expries: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
                httpOnly: true,
            }
            res.cookie("token", token, options).status(200).json({
                success: true,
                token,
                user,
                message: "logged in successfully"
            })

        }
        else {
            return res.status(401).json({
                success: false,
                message: "password is invalid",
            })
        }

    }
    catch (err) {
        console.log(err);
        return res.status(500).json({
            success: false,
            message: err.message,
        })
    }
}





//change password
exports.changePassword = async (req, res) => {
    try {
        //get data from req body
        const userDetails = await User.findById(req.user.id);

        //get oldPassword, newPassword, confirmNewPassowrd
        const { oldPassword, newPassword, confirmNewPassword } = req.body

        //validation
        if (!oldPassword || !newPassword ||
            !confirmNewPassword) {
            return res.status(401).json({
                success: false,
                message: "Please fill all the feilds",
            })
        }

        const isPasswordMatch = await bcrypt.compare(
            oldPassword,
            userDetails.password
        );


        if (!isPasswordMatch) {
            // If old password does not match, return a 401 (Unauthorized) error
            return res
                .status(401)
                .json({ success: false, message: "The password is incorrect" });
        }

        // Match new password and confirm new password
        if (newPassword !== confirmNewPassword) {
            // If new password and confirm new password do not match, return a 400 (Bad Request) error
            return res.status(400).json({
                success: false,
                message: "The password and confirm password does not match",
            });
        }

        // Update password
        const encryptedPassword = await bcrypt.hash(newPassword, 10);
        const updatedUserDetails = await User.findByIdAndUpdate(
            req.user.id,
            { password: encryptedPassword },
            { new: true }
        );

        //send mail - Password updated
        try {
            const emailResponse = await mailSender(
                updatedUserDetails.email,
                passwordUpdated(
                    updatedUserDetails.email,
                    `Password updated successfully for ${updatedUserDetails.firstName} ${updatedUserDetails.lastName}`
                )
            );
            console.log("Email sent successfully:", emailResponse.response);
        } catch (error) {
            // If there's an error sending the email, log the error and return a 500 (Internal Server Error) error
            console.error("Error occurred while sending email:", error);
            return res.status(500).json({
                success: false,
                message: "Error occurred while sending email",
                error: error.message,
            });
        }

        //return response
        return res
            .status(200)
            .json({
                success: true,
                message: "Password updated successfully",

            })


    } catch (error) {
        console.log(err)
        return res.status(500).json({
            success: false,
            message: "Error occurred while updating password",
            error: err.message,
        })
    }

}











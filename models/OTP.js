const mongoose = require('mongoose');
const mailSender = require("../utils/mailSender");
const emailTemplate = require("../mail/templates/emailVerificationTemplate");


const OTPSchema = new mongoose.Schema({
    email: {
        type: String,
    },
    otp: {
        type: String,
        // required: true,

    },
    createdAt: {
        type: Date,
        default: Date.now(),
        expires: 5 * 60,
    }


})

const sendVerificationEmail = async (email, otp) => {

    try {
        console.log("Sending verification email to:", email);
        
        const mailResponse = await mailSender( email ,
            "Verification Email",
               emailTemplate(otp)
               );
               console.log("Email sent successfully:", mailResponse);

                console.log("Email sent successfully: ",   mailResponse.response);
           
    } catch (err) {
		console.log("Error occurred while sending email: ", err);
        throw err;
    }


}

OTPSchema.pre("save", async function (next) {
    console.log("New document saved to database");
    	// Only send an email when a new document is created
        if (this.isNew) {
            console.log("Sending verification email...");
            await sendVerificationEmail(this.email, this.otp);
            console.log("Verification email sent.");
        }
     next();
})



module.exports = mongoose.model("OTP", OTPSchema);
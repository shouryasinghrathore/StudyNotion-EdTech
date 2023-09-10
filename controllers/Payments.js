const { default: mongoose } = require('mongoose');
const { instance } = require('../config/razorpay');
const Course = require("../models/Course")
const User = require("../models/User");
const mailSender = require('../utils/mailSender');
const crypto = require('crypto');


//capture the payment 

exports.capturePayment = async (req, res) => {
    //get courseId and UserID
    const { course_id } = req.body;
    const userId = req.user.id;
    //validation
    //valid courseID
    if (!course_id) {
        return res.json({
            success: false,
            message: 'Please provide valid course ID',
        })
    };
    //valid courseDetail
    let course;
    try {
        course = await Course.findById(course_id);
        if (!course) {
            return res.json({
                success: false,
                message: 'Could not find the course',
            });
        }

        //user already pay for the same course
        const uid = new mongoose.Types.ObjectId(userId);
        if (course.studentsEnrolled.includes(uid)) {
            return res.status(200).json({
                success: false,
                message: 'Student is already enrolled',
            });
        }
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }

    //order create
    const amount = course.price;
    const currency = "INR";

    const options = {
        amount: amount * 100,
        currency,
        receipt: Math.random(Date.now()).toString(),
        notes: {
            courseId: course_id,
            userId,
        }
    };

    try {
        //initiate the payment using razorpay
        const paymentResponse = await instance.orders.create(options);
        console.log(paymentResponse);
        //return response
        return res.status(200).json({
            success: true,
            courseName: course.courseName,
            courseDescription: course.courseDescription,
            thumbnail: course.thumbnail,
            orderId: paymentResponse.id,
            currency: paymentResponse.currency,
            amount: paymentResponse.amount,
        });
    }
    catch (error) {
        console.log(error);
        res.json({
            success: false,
            message: "Could not initiate order",
        });
    }


};

//verify Signature of Razorpay and Server

exports.verifySignature = async (req, res) => {

    const webhookSecret = "12345678";

    const signature = req.headers["x-razorpay-signature"]


    const shasum = crypto.createHmac("sha256", webhookSecret);
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest("hex");
    if (digest === signature) {
        console.log("payment authorized");
        const { courseId, userId } = req.body.payload.payment.entity.notes;


        try {
            //find the course and enroll in it
            const enrolledCourse = await Course.findOneAndUpdate({ _id: courseId }, { $push: { studentEnrolled: userId } },
                { new: true },)


            if (!enrolledCourse) {
                return res.json({
                    success: false,
                    message: 'Course not found',
                })
            }
            //find student add in the course list
            const enrolledStudent = await User.findOneAndUpdate({ _id: userId }, { $push: { courses: courseId } }, { new: true })

            console.log(enrolledStudent);

            const emailResponse = await mailSender(enrolledStudent.email, "Congratulations  from StudyNotion", "Congratulations , you are onboarded into the StudyNotion course")

            console.log(emailResponse)
            return res.status(200).json({
                success: true,
                message: "signature verified and course added successfully"
            })


        } catch (error) {
            console.log(error);
            res.json({
                success: false,
                message: "Could not initiate order",
            });
        }
    }
    else {
        return res.status(404).json({
            success: false,
            message: "invalid  request",
        });
    }

}







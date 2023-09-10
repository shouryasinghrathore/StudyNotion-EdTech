const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema({
    courseName: {
        type: String,
        required: true,
    },
    courseDescription:
    {
        type: String,
        required: true,
    },
    instructor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",	required: true,

    },
    whatYouWillLearn: {
        type: String,
   
    },
    courseContent: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Section"
        },
    ],
    ratingsAndReviews: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "RatingsAndReview"
        },
    ],
    price: {
        type: Number,
    },
    thumbnail: {
        type: String,
    },
    tag: {
        type: [String],
        required: true,
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        // required: true,
        ref: "category",
    },
    studentsEnrolled: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",	required: true,
    }],
    instructions:{
        type:[String],
    },
    status:{
        type:String,
        enum:["Draft", "Published"],
    },  createdAt: { type: Date, default: Date.now },

})

module.exports = mongoose.model("Course", CourseSchema);
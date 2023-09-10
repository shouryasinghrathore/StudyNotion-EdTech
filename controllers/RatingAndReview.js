const RatingAndReview = require('../models/RatingAndReviews');
const Course = require('../models/Course');

//create rating
exports.createRating = async (req, res) => {
    try {
        // get user id
        const userId = req.user.id;
        //fetch data from body
        const { courseId, rating, review } = req.body

        //check if user is enrolled or not
        const courseDetails = await Course.findOne({
            _id: courseId, studentsEnrolled: { $eleMatch: { $eq: userId } },
        });

        if (!courseDetails) {
            return res.status(404).json({
                success: false,
                message: "student is not enrolled in the course",
            })
        }

        //check if user alreaddy reviewd the course
        const alreadyReviewd = await RatingAndReview.findOne({ user: userId, course: courseId });

        if (alreadyReviewd) {
            return res.status(404).json({
                success: false,
                message: " course is already reviewd by the user",
            })
        }

        //create rating and review
        const ratingReview = await RatingAndReview.create({
            rating, review, course: courseId, user: userId,
        });

        //update course with this rating and review
        const updateddetails = await Course.findByIdAndUpdate({ _id: courseId }, {
            $push: {
                ratingsAndReview: ratingReview._id,
            }
        }, { new: true })
        console.log(updateddetails);

        return res.status(200).json({
            success: true,
            message: "rating review created successfully",
            ratingReview
        });

    } catch (error) {
        console.log(error)
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}

//get average rating learing of aggregation

exports.getAverageRating = async (req, res) => {

    try {
        //getcourse id 
        const { courseId } = req.body
        //calculate average rating
        const result = await RatingAndReview.aggregate([
            {
                $match: {
                    course: new mongoose.Types.objectId(courseId),
                },
            },
            {
                $group: {
                    _id: null,
                    averageRating: {
                        $avg: "$rating"
                    },
                }
            }
        ])


        //return average rating
        if (result.length > 0) {
            return res.status(200).json({
                success: true,
                averageRating: result[0].averageRating,

            });
        }
        return res.status(200).json({
            success: true,
            averageRating: "average rating is 0, no rating given till now",
        });



    } catch (err) {
        console.log(error)
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}


//getAllrating

exports.getAllRating = async (req, res) => {
    try {
        const allReviews = await RatingAndReview.find({})
            .sort({ rating: "desc" })
            .populate({
                path: "user",
                select: "firstname lastname email image"
            }).populate({
                path: "course",
                select: "courseName"
            }).exec()

        return res.status(200).json({
            success: true,
            message: " all Reviews frtched successfully",
            data: allReviews,
        })

    } catch (error) {
        console.log(error)
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}
















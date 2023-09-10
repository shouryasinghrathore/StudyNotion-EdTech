const User = require('../models/User');
const Course = require('../models/Course');
const { uploadImageToCloudinary } = require('../utils/imageUploader');
const Category = require('../models/Category');
const Section = require("../models/Section")
const SubSection = require("../models/Subsection")



//create Course handler function

exports.createCourse = async (req, res) => {
    try {
        //fetch data from req body
        let {
			courseName,
			courseDescription,
			whatYouWillLearn,
			price,
			tag,
			category,
			status,
			instructions,
		} = req.body;        // get thumbnail//
        const thumbnail = req.files.thumbnailImage

        //validation
        if (
			!courseName ||
			!courseDescription ||
			!whatYouWillLearn ||
			!price ||
			!tag ||
			!thumbnail ||
			!category
		) {
			return res.status(400).json({
				success: false,
				message: "All Fields are Mandatory",
			});
		}
        if (!status || status === undefined) {
			status = "Draft";
		}
        // check for instuctor
        const userId = req.user.id;
        const instructorDetails = await User.findById(userId, {
			accountType: "Instructor",
		});
        console.log("instructorDetails", instructorDetails)

        if (!instructorDetails) {
            return res.status(400).json({
                success: false,
                message: 'instructor Details not found',
            })
        }


        //check given category is valid
        const categoryDetails = await Category.findById(category);
		if (!categoryDetails) {
			return res.status(404).json({
				success: false,
				message: "Category Details Not Found",
			});
		}
      

		// Upload the Thumbnail to Cloudinary
		const thumbnailImage = await uploadImageToCloudinary(
			thumbnail,
			process.env.FOLDER_NAME
		);
		console.log(thumbnailImage);
		// Create a new course with the given details
		const newCourse = await Course.create({
			courseName,
			courseDescription,
			instructor: instructorDetails._id,
			whatYouWillLearn: whatYouWillLearn,
			price,
			tag: tag,
			category: categoryDetails._id,
			thumbnail: thumbnailImage.secure_url,
			status: status,
			instructions: instructions,
		});

		// Add the new course to the User Schema of the Instructor
		await User.findByIdAndUpdate(
			{
				_id: instructorDetails._id,
			},
			{
				$push: {
					courses: newCourse._id,
				},
			},
			{ new: true }
		);
		// Add the new course to the Categories
		await Category.findByIdAndUpdate(
			{ _id: category },
			{
				$push: {
					courses: newCourse._id,
				},
			},
			{ new: true }
		);
		// Return the new course and a success message
		res.status(200).json({
			success: true,
			data: newCourse,
			message: "Course Created Successfully",
		});
	} catch (error) {
		// Handle any errors that occur during the creation of the course
		console.error(error);
		res.status(500).json({
			success: false,
			message: "Failed to create course",
			error: error.message,
		});
	}

}
//get Allcourse handler function


exports.getAllCourses = async (req, res) => {
    try {

        const allCourse = await Course.find({}, {
            courseName: true,
            courseDescription: true,
            Instructor: true,
            whatYouWillLearn: true,
            price: true,
            tag: true,
            thumbnail: true,
        }).populate("instructor")
            .exec();
        return res.status(200).json({
            success: true,
            message: "data for all courses fetched successfully",
            data: allCourse,
        });


    } catch (error) {
        console.log(error)
        res.status(500).json({
            success: false,
            message: "error in fetching all courses",
            error: error.message,
        })

    }
}


exports.getCourseDetails = async (req, res) => {
    try {

        // get id///
        const { courseId } = req.body;
        const courseDetails = await Course.find(
            { _id: courseId })
            .populate(
                {
                path: "instructor",
                populate: {
                    path: "additionalDetails", 
                },
            }
            ).populate("category")
            //  .populate("ratingsAndReviews")
             .populate({
                path:"courseContent",
                populate: {
                    path:"subsection"
                }
            }) 
            .exec();


if(!courseDetails){
    return res.status(400).json({
        success: false,
        message: `Could not find the curse with ${courseId}`
    })
}

return res.status(200).json({
    success: true,
	message:"Course Details fetched successfully",
	data:courseDetails,
})

    } catch (err) {
        console.log(err)
        return res.status(500).json({
            success: false,
            message: err.message
        })
    }

};

// Get a list of Course for a given Instructor
exports.getInstructorCourses = async (req, res) => {
	try {
	  // Get the instructor ID from the authenticated user or request body
	  const instructorId = req.user.id
  
	  // Find all courses belonging to the instructor
	  const instructorCourses = await Course.find({
		instructor: instructorId,
	  }).sort({ createdAt: -1 })
  
	  // Return the instructor's courses
	  res.status(200).json({
		success: true,
		data: instructorCourses,
	  })
	} catch (error) {
	  console.error(error)
	  res.status(500).json({
		success: false,
		message: "Failed to retrieve instructor courses",
		error: error.message,
	  })
	}
  }
  // Delete the Course
  exports.deleteCourse = async (req, res) => {
	try {
	  const { courseId } = req.body
  
	  // Find the course
	  const course = await Course.findById(courseId)
	  if (!course) {
		return res.status(404).json({ message: "Course not found" })
	  }
  
	//   Unenroll students from the course
	  const studentsEnrolled = course.studentsEnroled
	  for (const studentId of studentsEnrolled) {
		await User.findByIdAndUpdate(studentId, {
		  $pull: { courses: courseId },
		})
	  }
  
	  // Delete sections and sub-sections
	  const courseSections = course.courseContent
	  for (const sectionId of courseSections) {
		// Delete sub-sections of the section
		const section = await Section.findById(sectionId)
		if (section) {
		  const subSections = section.subSection
		  for (const subSectionId of subSections) {
			await SubSection.findByIdAndDelete(subSectionId)
		  }
		}
  
		// Delete the section
		await Section.findByIdAndDelete(sectionId)
	  }
  
	  // Delete the course
	  await Course.findByIdAndDelete(courseId)
  
	  return res.status(200).json({
		success: true,
		message: "Course deleted successfully",
	  })
	} catch (error) {
	  console.error(error)
	  return res.status(500).json({
		success: false,
		message: "Server error",
		error: error.message,
	  })
	}
  }
  




const Section = require("../models/Section");
const Course = require("../models/Course");
const SubSection = require("../models/Subsection")


exports.createSection = async (req, res) => {

    try {
        //data fetch
        const { sectionName, courseId } = req.body;

        //data validation
        if (!sectionName || !courseId) {
            return res.status(401).json({
                success: false,
                message: 'Fill all input feilds'
            })
        }

        //create section
        const newSection = await Section.create({ sectionName });

        // update course with section Id
        const updatedCourseDetails = await Course.findByIdAndUpdate(
            courseId,
            {
                $push: {
                    courseContent: newSection._id,
                }

            }, { new: true },
        )

        //Hw: use populate to replace sections/subsection both in the updateCourse
.populate({
    path:"courseContent",
populate:{
    path: "subsection",
},
}).exec()
        //return response
        return res.status(200).json({
            success: true,
            message: 'section created successfully',
            updatedCourseDetails,
        })


    } catch (error) {
        console.log(error)
        res.status(500).json({
            success: false,
            message: "error in creating section",
            error: error.message,
        })
    }

}





exports.updateSection = async (req, res) => {

    try {
        //data input 
        const { sectionName, sectionId,courseId } = req.body;

        //data validation
        if (!sectionName || !sectionId) {
            return res.status(401).json({
                success: false,
                message: 'Fill all input feilds'
            })
        }
        // update data
        const section = await Section.findByIdAndUpdate(
            sectionId, { sectionName: sectionName }, { new: true });

        const course = await Course.findById(courseId)
        .populate({
            path: "courseContent",
            populate: {
                path: "subSection",
            },
        })
        .exec()
        console.log(course)
        //return res
        res.status(200).json({
			success: true,
			message: section,
            data: course,
		});

    } catch (err) {
        console.error("Error updating section:", error)
        res.status(500).json({
            success: false,
            message: "error in updateSection",
            error: err.message,
        })
    }

}


exports.deleteSection = async (req, res) => {

try {

//get id - assuming we are sending id in params
const {sectionId} = req.body;

//use findbyIdand delete
await Section.findByIdAndDelete(sectionId);
// Todo do we need to delete entry from course schema
//return res
return res.status(200).json({
    success:true,
    message:"Successfully section deleted"
})
    
} catch (err) {
    console.log(err)
    res.status(500).json({
        success: false,
        message: "error in delete Section",
        error: err.message,
    })
}

}
































const Section = require("../models/Section");
const Subsection = require("../models/Subsection");
const { uploadImageToCloudinary } = require("../utils/imageUploader");





exports.createSubSection = async (req, res) => {

    try {
      
        //get data req.body
        const { sectionId, title, timeDuration, description } = req.body;
        // extract video
        const video = req.files.videoFile;
        //validation
        if (!sectionId || !title || !timeDuration || !description || !video) {
            return res.status(403).json({
                success: false,
                message: "all fields are required"
            });
        }
        console.log(video)
        // upload video to cloudinary
        const uploadDetails = await uploadImageToCloudinary(video, process.env.Folder_Name)
        //create subSection
        const SubSectionDetails = await Subsection.create(
            {
                title: title,
                timeDuration: timeDuration,
                description: description,
                videoUrl: uploadDetails.secure_url,
            }
        )
        //insert in section
        const updatedSection = await Section.findByIdAndUpdate(
          { _id: sectionId },

          { $push: { subSection: SubSectionDetails._id } },

          { new: true },
        ).populate({
          path: "subsection",
      })

        //HW Log updated section here


        //return response
        return res.status(200).json({
            success:true,
            message: 'Updated section',
            data : updatedSection,
        })

    }
    catch (err) {
        console.log(err)
        return res.status(500).json({
            success: false,    message: "Internal server error",
            message: err.message,
        })
    }
}



//hw update subsection
exports.updateSubSection = async (req, res) => {
    try {
      const { sectionId, title, description } = req.body
      const subSection = await subSection.findById(sectionId)
  
      if (!subSection) {
        return res.status(404).json({
          success: false,
          message: "SubSection not found",
        })
      }
  
      if (title !== undefined) {
        subSection.title = title
      }
  
      if (description !== undefined) {
        subSection.description = description
      }
      if (req.files && req.files.video !== undefined) {
        const video = req.files.video
        const uploadDetails = await uploadImageToCloudinary(
          video,
          process.env.FOLDER_NAME
        )
        subSection.videoUrl = uploadDetails.secure_url
        subSection.timeDuration = `${uploadDetails.duration}`
      }
  
      await subSection.save()
  
      return res.json({
        success: true,
        message: "Section updated successfully",
      })
    } catch (error) {
      console.error(error)
      return res.status(500).json({
        success: false,
        message: "An error occurred while updating the section",
      })
    }
  }
  
//hw delete subsection
  exports.deleteSubSection = async (req, res) => {
    try {
      const { subSectionId, sectionId } = req.body
      await Section.findByIdAndUpdate(
        { _id: sectionId },
        {
          $pull: {
            subSection: subSectionId,
          },
        }
      )
      const subSection = await Subsection.findByIdAndDelete({ _id: subSectionId })
  
      if (!subSection) {
        return res
          .status(404)
          .json({ success: false, message: "SubSection not found" })
      }
  
      return res.json({
        success: true,
        message: "SubSection deleted successfully",
      })
    } catch (error) {
      console.error(error)
      return res.status(500).json({
        success: false,
        message: "An error occurred while deleting the SubSection",
      })
    }
  }


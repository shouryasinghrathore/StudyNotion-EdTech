const User = require('../models/User')
const Profile = require('../models/Profile')
const Course = require('../models/Course')
const {uploadImageToCloudinary} = require('../utils/imageUploader')
exports.updateProfile = async (req, res) => {
    try {
        // get data form req.body and user id from req.user    
        const { dateofBirth = "", gender = "", about = "", contactNumber } = req.body;
        const id = req.user.id;

        //validation
        if (!contactNumber, !gender, !id) {
            return res.status(400).json({
                success: false,
                message: "Please enter all fields"
            });
        }
        //find profile
        const userDetails = await User.findById(id);
        const profileId = userDetails.additionalDetails;
        const profileDetails = await Profile.findById(profileId);

        //update profile
        profileDetails.about = about;
        profileDetails.dateofBirth = dateofBirth;
        profileDetails.gender = gender;
        profileDetails.contactNumber = contactNumber;
        await profileDetails.save();
        //return response
        return res.status(200).json({
            success: true,
            message: "update profile details successfully",
            profileDetails,
        })
    }
    catch (err) {
        console.log(err)
        return res.status(500).json({
            success: false,
            error: err.message,
        })
    }

}

exports.deleteAccount = async (req, res) => {
    try {
        //get id from req.user.id
        const id = req.user.id;
        //find user with the help of id
        const userDetails = await User.findById(id);

        if (!userDetails) {
            return res.status(200).json({
                success: false,
                message: "user not found",
                error: err.message,
            })

        }

        await Profile.findByIdAndDelete({ _id: userDetails.additionalDetails })
        // await Course.findByIdAndDelete({ _id: userDetails.courses })
        await User.findByIdAndDelete({ _id: id });

        return res.status(200).json({
            success: true,
            message: "Account deleted successfully"
        })


    } catch (err) {

        console.log(err)
        return res
            .status(500)
            .json({
                success: false,
                error: err.message,
            })
    }

}

exports.getAllUserDetails = async (req, res) => {
    try {

        const id = req.user.id;
        const userDetails = await User.findById(id).populate("additionalDetails").exec()
        console.log(userDetails);
        res.status(200).json({
			success: true,
			message: "User Data fetched successfully",
			data: userDetails,
		});

    } catch (err) {
        console.log(err)
        return res
            .status(500)
            .json({
                success: false,
                error: err.message,
            })
    }






}





// copied practice
exports.updateDisplayPicture = async (req, res) => {
    try {
      const displayPicture = req.files.displayPicture
      const userId = req.user.id
      const image = await uploadImageToCloudinary(
        displayPicture,
        process.env.FOLDER_NAME,
        1000,
        1000
      )
      console.log(image)
      const updatedProfile = await User.findByIdAndUpdate(
        { _id: userId },
        { image: image.secure_url },
        { new: true }
      )
      res.send({
        success: true,
        message: `Image Updated successfully`,
        data: updatedProfile,
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      })
    }
};
  
exports.getEnrolledCourses = async (req, res) => {
    try {
      const userId = req.user.id
      const userDetails = await User.findOne({
        _id: userId,
      })
        .populate("courses")
        .exec()
      if (!userDetails) {
        return res.status(400).json({
          success: false,
          message: `Could not find user with id: ${userDetails}`,
        })
      }
      return res.status(200).json({
        success: true,
        data: userDetails.courses,
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      })
    }
};

















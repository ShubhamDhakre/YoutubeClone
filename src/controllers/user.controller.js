import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../services/cloudinary.js";
import jwt from "jsonwebtoken";


const generateAccessAndRefreshToken = async (userId) => {
   try {
      const user = await User.findById(userId);
      if (!user) {
         throw new ApiError(404, "User not found");
      }

      const accessToken = user.generateAccessToken();
      const refreshToken = user.generateRefreshToken();

      user.refreshToken = refreshToken;
      await user.save({ validateBeforeSave: false });

      return { accessToken, refreshToken };
   } catch (error) {
      throw new ApiError(500, "Something went wrong while generating access and refresh token");
   }
};


// ////////////////////Register user /////////////////////
const registerUser = asyncHandler(async (req, res) => {
   //get data rom frontend 
   // validate the data 
   // check if user already exists
   // check FOR IMAGE , CHECKS FOR AVATAR
   // UPLOAD TO CLOUDNARY
   // create user OBJECT - CREATE ENTRY IN DB
   // REMOVE PASSWORD AND REFRESH TOKEN FIELD FROM RESPONSE
   // CHECKS FOR USER CREATION 
   // RETURN res

   const fullName = req.body.fullName?.trim();
   const email = req.body.email?.trim();
   const userName = (req.body.userName || req.body["userName "] || req.body.username)?.trim();
   const password = req.body.password;

   if (!fullName || !email || !userName || !password) {
      throw new ApiError(400, "All fields are required");
   }

   console.log("Body: ", req.body);
   console.log("Files: ", req.files);

   const existingUser = await User.findOne({
    $or: [{ userName }, { email }]
   })

   if (existingUser) {
    throw new ApiError(409, "User with email or username already exists");
   }

   const avatarLocalPath = req.files?.avatar?.[0]?.path;
   const coverImageLocalPath = req.files?.coverImage?.[0]?.path;
   
   if (!avatarLocalPath) {
      throw new ApiError(400, "Avatar is required");
   }

   const avatar = await uploadOnCloudinary(avatarLocalPath);
   if (!avatar) {
      throw new ApiError(500, "Failed to upload avatar to Cloudinary");
   }

   let coverImage;
   if (coverImageLocalPath) {
      coverImage = await uploadOnCloudinary(coverImageLocalPath);
   }

   // CREATE USER OBJECT - CREATE ENTRY IN DB
   const user = await User.create({
    fullName,
    email,
    userName : userName.toLowerCase(),
    password,
    avatar: avatar.url,
    coverImage: coverImage?.url || ""
   })

 

   // REMOVE PASSWORD AND REFRESH TOKEN FIELD FROM RESPONSE
   const createdUser = await User.findById(user._id).select("-password -refreshToken")

   // CHECKS FOR USER CREATION 
   if(!createdUser){
      throw new ApiError(500, "Failed to create user")
   }

   // RETURN res
   return res.status(201).json(
    new ApiResponse(200, createdUser, "user registered successfully")
   )

})



   
/////////////////////////////  login user ////////////////////////////////
const loginUser = asyncHandler(async (req, res) => {
   const email = req.body.email?.trim();
   const userName = (req.body.userName || req.body["userName "] || req.body.username)?.trim();
   const password = req.body.password;

   if (!(userName || email)) {
      throw new ApiError(400, "Username or email is required");
   }

   if (!password) {
      throw new ApiError(400, "Password is required");
   }
   
   const user = await User.findOne({
      $or: [
         ...(userName ? [{ userName: userName.toLowerCase() }] : []),
         ...(email ? [{ email: email.toLowerCase() }] : [])
      ]
   });
   
   if (!user) {
      throw new ApiError(404, "User does not exist");
   }
    
   const isPasswordCorrect = await user.isPasswordCorrect(password);

   if (!isPasswordCorrect) {
      throw new ApiError(401, "Invalid user credentials");
   }

   const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

   const loggedInUser = await User.findById(user._id).select(
      "-password -refreshToken"
   );

   const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production"
   };

   return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
         new ApiResponse(
            200,
            {
               user: loggedInUser,
               accessToken,
               refreshToken
            },
            "User logged in successfully"
         )
      );
});




/////////////////////////////  logout user ////////////////////////////////
const logoutUser = asyncHandler(async (req, res) => {
   await User.findByIdAndUpdate(
      req.user._id,
      {
         $unset: { refreshToken: 1 } // removes refreshToken field from document
      },
      { new: true }
   );

   const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production"
   };

   return res
      .status(200)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .json(
         new ApiResponse(200, {}, "User logged out successfully")
      );
});



/////////////////// Refresh Access TOken ////////////////////////
const refreshAccessToken = asyncHandler(async (req, res) => {

   const refreshTokenFromUser = req.cookies.refreshToken || req.body.refreshToken

   if (!refreshTokenFromUser) {
      throw new ApiError(401, "Unauthorized request");
   }

   try {
      const decodedToken = jwt.verify(refreshTokenFromUser, process.env.REFRESH_TOKEN_SECRET);
      const user = await User.findById(decodedToken?._id).select("-password -refreshToken");
      if (!user) {
         throw new ApiError(401, "Invalid Refresh Token");
      }


      if(user.refreshToken !== refreshTokenFromUser){
         throw new ApiError(401, "Invalid Refresh Token");
      }

      const { newAccessToken, newRefreshToken } = await generateAccessAndRefreshToken(user._id);

      const options = {
         httpOnly: true,
         secure: true
      };

      return res
         .status(200)
         .cookie("newAccessToken", newAccessToken, options)
         .cookie("newRefreshToken", newRefreshToken, options)
         .json(
            new ApiResponse(
               200,
               {
                  user: user,
                  newAccessToken,
                  newRefreshToken
               },
               "User logged in successfully"
            )
         );
   } catch (error) {
      throw new ApiError(401, error?.message || "Invalid Refresh Token");
   }
   
   
});


const changeCurrentPassword = asyncHandler(async (req , res) => {
   
   const {oldPassword , newPassword} = req.body;

   const user = await User.findById(req.user._id);
   const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

   if(!isPasswordCorrect){
      throw new ApiError(401, "Invalid Current Password");
   }

   user.password = newPassword;
   await user.save({ validateBeforeSave: false });

   return res
      .status(200)
      .json(
         new ApiResponse(200, {}, "Password changed successfully")
      );

   });


   const getCurrentUser = asyncHandler(async (req , res) => {
      return res
         .status(200)
         .json(
            new ApiResponse(200, req.user, "Current user fetched successfully")
         );
   });

      
   const updateUserDetails = asyncHandler(async (req , res) => {
      
      const {fullName , email} = req.body;

      if(!fullName || !email){
         throw new ApiError(400, "Full name and email are required");
      }

      const user = await User.findByIdAndUpdate(
         req.user._id,
         {
            $set: {
               fullName,
               email
            }
         },
         { new: true }
      ).select("-password -refreshToken");


      return res
         .status(200)
         .json(
            new ApiResponse(200, user, "User details updated successfully")
         );
   });


   const updateUserAvatar = asyncHandler(async (req , res) => {
      
      const avatarLocalPath = req.file?.path;

      if(!avatarLocalPath){
         throw new ApiError(400, "Avatar is required");
      }

      const avatar = await uploadOnCloudinary(avatarLocalPath);
      if(!avatar){
         throw new ApiError(500, "Failed to upload avatar to Cloudinary");
      }

      const user = await User.findByIdAndUpdate(req.user?._id,
         {

            $set : {avatar : avatar.url}

         },
         { new:true }).select("-password -refreshToken");

      if(!user){
         throw new ApiError(404, "User not found");
      }


      return res
         .status(200)
         .json(
            new ApiResponse(200, user, "Avatar updated successfully")
         );
   });


   const updateUserCoverImage = asyncHandler(async (req , res) => {
      
      const coverImageLocalPath = req.file?.path;

      if(!coverImageLocalPath){
         throw new ApiError(400, "Cover image is required");
      }

      const coverImage = await uploadOnCloudinary(coverImageLocalPath);
      if(!coverImage){
         throw new ApiError(500, "Failed to upload cover image to Cloudinary");
      }

      const user = await User.findByIdAndUpdate(req.user?._id,
         {

            $set : {coverImage : coverImage.url}

         },
         { new:true }).select("-password -refreshToken");

      if(!user){
         throw new ApiError(404, "User not found");
      }

      return res
         .status(200)
         .json(
            new ApiResponse(200, user, "Cover image updated successfully")
         );
   });


export { 
   registerUser, 
   loginUser, 
   logoutUser ,
   refreshAccessToken,
   getCurrentUser,
   changeCurrentPassword,
   updateUserDetails,
   updateUserAvatar,
   updateUserCoverImage,
 };
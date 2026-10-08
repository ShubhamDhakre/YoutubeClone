import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../services/cloudinary.js";

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

   const {fullName, email, userName , password} = req.body

   if (!fullName || !email || !userName || !password){
    throw new ApiError(400, "All fields are required")
   }

   const existingUser = await User.findOne({
    $or: [{ userName }, { email }]
   })

   if (existingUser) {
    throw new ApiError(400, "User already exists")
   }

   const avatarLocalPath = req.files?.avatar?.[0]?.path
   const coverImageLocalPath = req.files?.coverImage?.[0]?.path
   
   if(!avatarLocalPath){
      throw new ApiError(400, "Avatar is required")
   }

   const avatar = await uploadOnCloudinary(avatarLocalPath)
   if(!avatar){
      throw new ApiError(500, "Failed to upload")
   }

   const coverImage = await uploadOnCloudinary(coverImageLocalPath)
   if(!coverImage){
      throw new ApiError(500, "Failed to upload")
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
   

export { registerUser }
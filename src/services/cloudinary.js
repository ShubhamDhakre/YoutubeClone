import {v2 as cloudinary} from "cloudinary";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME?.trim(), 
    api_key: process.env.CLOUDINARY_API_KEY?.trim(),
    api_secret: process.env.CLOUDINARY_API_SECRET?.trim()
});
    

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;

        // Ensure config is applied with current environment variables
        cloudinary.config({ 
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME?.trim(), 
            api_key: process.env.CLOUDINARY_API_KEY?.trim(),
            api_secret: process.env.CLOUDINARY_API_SECRET?.trim()
        });
        
        // upload file on cloudinary
        const uploadResult = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        });

        // file has been uploaded successfully, remove local file
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }

        return uploadResult;
    } catch (error) {
        console.error("Cloudinary upload error: ", error);
        
        // remove the locally saved temporary file on failure
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }
        return null;
    }
}

export  {uploadOnCloudinary}
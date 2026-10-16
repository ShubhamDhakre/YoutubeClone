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
};

const extractPublicId = (url) => {
    if (!url) return null;
    if (!url.startsWith("http://") && !url.startsWith("https://")) return url;
    try {
        const parts = url.split("/");
        const uploadIndex = parts.indexOf("upload");
        if (uploadIndex === -1) return null;

        const publicParts = parts.slice(uploadIndex + 1);
        // If there is a version string (e.g. v1728564821), drop it
        if (publicParts[0] && /^v\d+$/.test(publicParts[0])) {
            publicParts.shift();
        }

        const fileName = publicParts.join("/");
        return fileName.substring(0, fileName.lastIndexOf(".")) || fileName;
    } catch {
        return null;
    }
};

const deleteFromCloudinary = async (publicUrlOrId, resourceType = "image") => {
    try {
        if (!publicUrlOrId) return null;
        const publicId = extractPublicId(publicUrlOrId);
        if (!publicId) return null;

        cloudinary.config({ 
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME?.trim(), 
            api_key: process.env.CLOUDINARY_API_KEY?.trim(),
            api_secret: process.env.CLOUDINARY_API_SECRET?.trim()
        });

        const result = await cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType
        });
        return result;
    } catch (error) {
        console.error("Cloudinary delete error: ", error);
        return null;
    }
};

export { uploadOnCloudinary, deleteFromCloudinary };
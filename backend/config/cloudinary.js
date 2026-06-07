import { v2 as cloudinary } from 'cloudinary'
import fs from "fs"
import path from "path"

const uploadOnCloudinary = async (file) => {
    try {
        if (!file) return null;

        cloudinary.config({ 
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
            api_key: process.env.CLOUDINARY_API_KEY, 
            api_secret: process.env.CLOUDINARY_API_SECRET
        });

        const ext = path.extname(file).toLowerCase()
        const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".svg"]
        const videoExtensions = [".mp4", ".mov", ".mkv", ".webm", ".avi", ".flv"]

        console.log("Cloudinary upload start:", file);

        const result = await cloudinary.uploader.upload(file, {
            resource_type: 'auto',
            chunk_size: 6000000,
        })

        if (fs.existsSync(file)) {
            fs.unlinkSync(file)
        }

        return result.secure_url

    } catch (error) {
        console.log("--- CLOUDINARY UPLOAD CRASH REPORT ---")
        console.error(error)

        if (file && fs.existsSync(file)) {
            fs.unlinkSync(file)
        }
        throw error;
    }
}

export default uploadOnCloudinary
import fs from "fs"
import multer from "multer"
import path from "path"

const publicDir = path.resolve("public")
if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true })
}

const storage = multer.diskStorage({
 destination: (req, file, cb) => {
    cb(null, publicDir)
 },
 filename: (req, file, cb) => {
    // CRITICAL FIX: Filename ko unique banao timestamp jodkar!
    // Agar do users ne same naam ki video daali (jaise 'video.mp4'), toh data overwrite ya crash ho jata hai.
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
 }
})

export const upload = multer({ 
   storage: storage,
   limits: {
      fileSize: 500 * 1024 * 1024 // LIMIT: Max 500MB file allow karega. Loop videos kabhi 100MB se upar hoti hain.
   },
   fileFilter: (req, file, cb) => {
      // SAFEGUARD: Check karo ki incoming file image ho ya video format ho
      if (file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/")) {
         cb(null, true);
      } else {
         cb(new Error("Bhai, sirf images aur videos allowed hain!"), false);
      }
   }
})
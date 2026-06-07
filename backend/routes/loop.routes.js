import express from "express"
import isAuth from "../middlewares/isAuth.js"
import { upload } from "../middlewares/multer.js"
import { comment, getAllLoops, like, uploadLoop, deleteLoop } from "../controllers/loop.controllers.js"

const loopRouter = express.Router()

// 🚀 Media upload route - Front-end FormData key aur upload.single("media") ekdum match hain!
loopRouter.post("/upload", isAuth, upload.single("media"), uploadLoop)

// 📑 Feed fetch route
loopRouter.get("/getAll", isAuth, getAllLoops)

// ❤️ Like route - Isko standard POST kar do taaki front-end ke hit se perfect match ho
loopRouter.post("/like/:loopId", isAuth, like)

// 💬 Comment route
loopRouter.post("/comment/:loopId", isAuth, comment)

// 🗑️ Delete loop
loopRouter.delete("/delete/:loopId", isAuth, deleteLoop)

export default loopRouter
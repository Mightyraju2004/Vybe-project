import uploadOnCloudinary from "../config/cloudinary.js";
import Loop from "../models/loop.model.js";
import Notification from "../models/notification.model.js";
import User from "../models/user.model.js";
import { getSocketId, io } from "../socket.js";

// 🚀 1. UPLOAD LOOP (Photo aur Video dono smoothly chalenge)
export const uploadLoop = async (req, res) => {
    try {
        const { caption } = req.body;
        let media;
        
        if (req.file) {
            if (!req.file.mimetype.startsWith("video/")) {
                return res.status(400).json({ message: "Loop section mein sirf video upload karo. Photo post karne ke liye Post section use karo." });
            }

            media = await uploadOnCloudinary(req.file.path);
        } else {
            return res.status(400).json({ message: "Bhai, media file mandatory hai!" });
        }

        const loop = await Loop.create({
            caption,
            media,
            author: req.userId
        });

        const user = await User.findById(req.userId);
        if (user) {
            user.loops.push(loop._id);
            await user.save();
        }

        const populatedLoop = await Loop.findById(loop._id).populate("author", "name userName profileImage");
        return res.status(201).json(populatedLoop);
    } catch (error) {
        console.error("Upload Loop Error:", error);
        return res.status(500).json({ message: `uploadloop error: ${error.message}` });
    }
};

// ❤️ 2. LIKE / UNLIKE LOOP (With Bug-free Real-time Sockets)
export const like = async (req, res) => {
    try {
        const { loopId } = req.params;
        const loop = await Loop.findById(loopId);
        if (!loop) {
            return res.status(404).json({ message: "Loop nahi mila!" });
        }

        const currentUserId = req.userId.toString();
        const alreadyLiked = loop.likes.some(id => id.toString() === currentUserId);

        if (alreadyLiked) {
            // Unlike logic
            loop.likes = loop.likes.filter(id => id.toString() !== currentUserId);
        } else {
            // Like logic
            loop.likes.push(req.userId);
            
            // Notification handler (Sirf tab bhejenge jab dusre ka loop ho)
            const targetAuthorId = loop.author.toString(); 
            if (targetAuthorId !== currentUserId) {
                const notification = await Notification.create({
                    sender: req.userId,
                    receiver: loop.author,
                    type: "like",
                    loop: loop._id,
                    message: "liked your loop"
                });

                const populatedNotification = await Notification.findById(notification._id).populate("sender receiver loop");
                
                // 🔥 BUG FIX: Target author ID ko properly string mein parse karke socket fetch kiya
                const receiverSocketId = getSocketId(targetAuthorId);
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit("newNotification", populatedNotification);
                }
            }
        }

        await loop.save();
        await loop.populate("author", "name userName profileImage");

        // Broadcast updated likes array globally
        io.emit("likedLoop", {
            loopId: loop._id,
            likes: loop.likes
        });

        return res.status(200).json(loop);
    } catch (error) {
        console.error("Like Loop Error:", error);
        return res.status(500).json({ message: `like loop error: ${error.message}` });
    }
};

// 💬 3. COMMENT ON LOOP (Real-time Sync Update)
export const comment = async (req, res) => {
    try {
        const { message } = req.body;
        const { loopId } = req.params;

        if (!message) {
            return res.status(400).json({ message: "Comment message empty nahi ho sakta!" });
        }

        const loop = await Loop.findById(loopId);
        if (!loop) {
            return res.status(404).json({ message: "Loop nahi mila!" });
        }

        loop.comments.push({
            author: req.userId,
            message
        });

        const currentUserId = req.userId.toString();
        const targetAuthorId = loop.author.toString();

        if (targetAuthorId !== currentUserId) {
            const notification = await Notification.create({
                sender: req.userId,
                receiver: loop.author,
                type: "comment",
                loop: loop._id,
                message: "commented on your loop"
            });

            const populatedNotification = await Notification.findById(notification._id).populate("sender receiver loop");
            
            const receiverSocketId = getSocketId(targetAuthorId);
            if (receiverSocketId) {
                io.to(receiverSocketId).emit("newNotification", populatedNotification);
            }
        }

        await loop.save();
        await loop.populate("author", "name userName profileImage");
        await loop.populate("comments.author");

        // Global broadcast for interactive updates across screens
        io.emit("commentedLoop", {
            loopId: loop._id,
            comments: loop.comments
        });

        return res.status(200).json(loop);
    } catch (error) {
        console.error("Comment Loop Error:", error);
        return res.status(500).json({ message: `comment loop error: ${error.message}` });
    }
};

// 📑 4. DELETE LOOP
export const deleteLoop = async (req, res) => {
    try {
        const { loopId } = req.params;
        const loop = await Loop.findById(loopId);
        if (!loop) {
            return res.status(404).json({ message: "Loop nahi mila" });
        }
        if (loop.author.toString() !== req.userId.toString()) {
            return res.status(403).json({ message: "Sirf apne loops delete kar sakte ho" });
        }

        await Loop.findByIdAndDelete(loopId);
        await User.findByIdAndUpdate(req.userId, { $pull: { loops: loopId } });

        return res.status(200).json({ message: "Loop deleted successfully", loopId });
    } catch (error) {
        console.error("Delete Loop Error:", error);
        return res.status(500).json({ message: `delete loop error: ${error.message}` });
    }
};

// 📑 5. GET ALL LOOPS
export const getAllLoops = async (req, res) => {
    try {
        const loops = await Loop.find({})
            .populate("author", "name userName profileImage")
            .populate("comments.author")
            .sort({ createdAt: -1 }); // Naye loops pehle dikhane ke liye sorting add ki hai
            
        return res.status(200).json(loops);
    } catch (error) {
        console.error("Get All Loops Error:", error);
        return res.status(500).json({ message: `get all loop error: ${error.message}` });
    }
};
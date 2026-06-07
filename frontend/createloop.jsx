import React, { useState } from 'react'
import axios from 'axios'
import { serverUrl } from '../App'
import { RxCross2 } from "react-icons/rx" // Close icon ke liye

function CreateLoop({ isOpen, onClose, onLoopAdded }) {
    // Dynamic media handling ke liye states ko update kiya
    const [mediaFile, setMediaFile] = useState(null)
    const [caption, setCaption] = useState("")
    const [loading, setLoading] = useState(false)
    const [previewUrl, setPreviewUrl] = useState("")
    const [isImage, setIsImage] = useState(false) // Track karega ki image render karni hai ya video

    if (!isOpen) return null; // Agar modal open nahi hai toh kuch render mat karo

    const handleFileChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            setMediaFile(file)
            setPreviewUrl(URL.createObjectURL(file)) // Preview URL generate kiya
            
            // Mimetype check kar rahe hain taaki right tag render ho sake
            if (file.type.startsWith("image/")) {
                setIsImage(true)
            } else {
                setIsImage(false)
            }
        }
    }

    const handleUploadLoop = async (e) => {
        e.preventDefault()
        if (!mediaFile) return alert("Bhai, pehle koi photo ya reel/video select toh kar!")

        const formData = new FormData()
        
        // 🔥 CRITICAL FIX: Key ka naam strictly "media" rakha hai jo backend router expects kar raha hai
        formData.append("media", mediaFile) 
        formData.append("caption", caption)

        try {
            setLoading(true)
            
            const res = await axios.post(`${serverUrl}/api/loop/upload`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                withCredentials: true
            })

            if (res.data) {
                alert("Loop Uploaded Successfully! 🚀")
                setMediaFile(null)
                setPreviewUrl("")
                setCaption("")
                
                if (onLoopAdded) {
                    onLoopAdded(res.data) // Feed refresh handler
                }
                onClose() // Modal close kar do
            }
        } catch (error) {
            console.log("Error uploading loop:", error)
            const errorMsg = error.response?.data?.message || "Upload fail ho gaya bhai."
            alert(`Error: ${errorMsg}`)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="relative w-[90%] max-w-[450px] bg-[#121212] border border-gray-800 text-white rounded-2xl p-6 shadow-2xl">
                
                {/* Close Button */}
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white cursor-pointer">
                    <RxCross2 className="w-[24px] h-[24px]" />
                </button>

                <h2 className="text-xl font-bold mb-4 text-center border-b border-gray-800 pb-2">Create New Loop</h2>
                
                <form onSubmit={handleUploadLoop} className="flex flex-col gap-4">
                    
                    {/* Media Selector / Preview Area */}
                    <div className="w-full h-[220px] border-2 border-dashed border-gray-700 rounded-xl flex flex-col items-center justify-center relative overflow-hidden bg-[#1a1a1a]">
                        {previewUrl ? (
                            /* 🔥 DYNAMIC PREVIEW: Image ho toh img tag, video ho toh video tag */
                            isImage ? (
                                <img src={previewUrl} className="w-full h-full object-cover" alt="Preview" />
                            ) : (
                                <video src={previewUrl} className="w-full h-full object-cover" controls muted />
                            )
                        ) : (
                            <label className="flex flex-col items-center justify-center cursor-pointer text-gray-400 hover:text-gray-200 w-full h-full">
                                <span className="text-sm font-medium">Select Video (MP4) or Image</span>
                                <input 
                                    type="file" 
                                    accept="video/*,image/*" // 🔥 Dono formats frontend window par allow kiye
                                    onChange={handleFileChange} 
                                    className="hidden"
                                />
                            </label>
                        )}
                    </div>

                    {/* Caption Input */}
                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-gray-400 font-semibold px-1">Caption</label>
                        <textarea 
                            placeholder="Write an amazing caption for your reel..." 
                            value={caption}
                            onChange={(e) => setCaption(e.target.value)}
                            className="bg-[#1e1e1e] border border-gray-800 text-sm p-3 rounded-xl outline-none resize-none h-[80px] focus:border-gray-500"
                        />
                    </div>

                    {/* Action Button */}
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full mt-2 bg-white text-black py-3 rounded-xl font-bold hover:bg-gray-200 transition disabled:bg-gray-600 disabled:text-gray-400 cursor-pointer"
                    >
                        {loading ? "Uploading Loop..." : "Post Loop"}
                    </button>
                </form>
            </div>
        </div>
    )
}

export default CreateLoop
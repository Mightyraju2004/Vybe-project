import React, { useState } from 'react'
import axios from 'axios'
import { serverUrl } from '../App'
import { RxCross2 } from "react-icons/rx"

function CreateLoop({ isOpen, onClose, onLoopAdded }) {
    const [mediaFile, setMediaFile] = useState(null)
    const [caption, setCaption] = useState("")
    const [loading, setLoading] = useState(false)
    const [previewUrl, setPreviewUrl] = useState("")

    if (!isOpen) return null;

    const handleFileChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            if (!file.type.startsWith("video/")) {
                return alert("Loop section mein sirf video upload karo. Photo post karne ke liye Upload > Post use karo.")
            }

            setMediaFile(file)
            setPreviewUrl(URL.createObjectURL(file))
        }
    }

    const handleUploadLoop = async (e) => {
        e.preventDefault()
        if (!mediaFile) return alert("Bhai, pehle koi reel, video ya photo select toh kar!")

        const formData = new FormData()
        
        // Multer integration safe match
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
                if (onLoopAdded) onLoopAdded(res.data)
                onClose()
            }
        } catch (error) {
            console.log("Full Error Object:", error)
            const errorMsg = error.response?.data?.message || error.message
            alert(`Upload fail hua bhai: ${errorMsg}`)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="relative w-[90%] max-w-[450px] bg-[#121212] border border-gray-800 text-white rounded-2xl p-6 shadow-2xl">
                
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white cursor-pointer">
                    <RxCross2 className="w-[24px] h-[24px]" />
                </button>

                <h2 className="text-xl font-bold mb-4 text-center border-b border-gray-800 pb-2">Create New Loop</h2>
                
                <form onSubmit={handleUploadLoop} className="flex flex-col gap-4">
                    
                    <div className="w-full h-[320px] border-2 border-dashed border-gray-700 rounded-xl flex flex-col items-center justify-center relative overflow-hidden bg-[#1a1a1a]">
                        {previewUrl ? (
                            <video src={previewUrl} className="w-full h-full object-cover" controls muted />
                        ) : (
                            <label className="flex flex-col items-center justify-center cursor-pointer text-gray-400 hover:text-gray-200 w-full h-full">
                                <span className="text-sm font-medium">Select Video (MP4) for Loop</span>
                                <input 
                                    type="file" 
                                    accept="video/*" // 🔥 Ab sirf video loops allow ho rahe hain
                                    onChange={handleFileChange} 
                                    className="hidden"
                                />
                            </label>
                        )}
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-gray-400 font-semibold px-1">Caption</label>
                        <textarea 
                            placeholder="Write an amazing caption for your reel..." 
                            value={caption}
                            onChange={(e) => setCaption(e.target.value)}
                            className="bg-[#1e1e1e] border border-gray-800 text-sm p-3 rounded-xl outline-none resize-none h-[80px] focus:border-gray-500"
                        />
                    </div>

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
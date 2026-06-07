import React, { useState, useEffect, useRef } from 'react'
import { FiVolume2, FiVolumeX } from "react-icons/fi";
import dp from "../assets/dp.webp"
import FollowButton from './FollowButton';
import { GoHeart, GoHeartFill } from "react-icons/go";
import { useDispatch, useSelector } from 'react-redux';
import { MdOutlineComment, MdDelete } from "react-icons/md";
import { setLoopData } from '../redux/loopSlice';
import axios from 'axios';
import { serverUrl } from '../App';
import { IoSendSharp } from "react-icons/io5";

function LoopCard({ loop }) {
    const videoRef = useRef()
    const [isPlaying, setIsPlaying] = useState(true)
    const [isMute, setIsMute] = useState(false)
    const [progress, setProgress] = useState(0)
    const { userData } = useSelector(state => state.user)
    const { socket } = useSelector(state => state.socket)
    const { loopData } = useSelector(state => state.loop)
    const [showHeart, setShowHeart] = useState(false)
    const [showComment, setShowComment] = useState(false)
    const [message, setMessage] = useState("")
    const dispatch = useDispatch()
    const commentRef = useRef()

    // 🔥 IMAGE VALIDATION CHECK: Pata lagane ke liye ki url image ka hai ya video ka
    const isImage = loop?.media?.match(/\.(jpeg|jpg|gif|png|webp)$/i) != null;

    const handleTimeUpdate = () => {
        const video = videoRef.current
        if (video && video.duration) {
            const percent = (video.currentTime / video.duration) * 100
            setProgress(percent)
        }
    }

    const handleLikeOnDoubleClick = () => {
        setShowHeart(true)
        setTimeout(() => setShowHeart(false), 1500) // 6000ms se kam karke 1500ms kiya taaki animation jaldi gayab ho
        if (!loop.likes?.includes(userData._id)) {
            handleLike()
        }
    }

    const handleClick = () => {
        if (isImage) return; // Images par play/pause logic apply nahi hoga
        if (isPlaying) {
            videoRef.current.pause()
            setIsPlaying(false)
        } else {
            videoRef.current.play()
            setIsPlaying(true)
        }
    }

    // 🔥 FIX 1: axios.get ko badal kar axios.post kiya aur blank body {} bheji
    const handleLike = async () => {
        try {
            const result = await axios.post(`${serverUrl}/api/loop/like/${loop._id}`, {}, { withCredentials: true })
            const updatedLoop = result.data

            const updatedLoops = loopData.map(p => p._id == loop._id ? updatedLoop : p)
            dispatch(setLoopData(updatedLoops))
        } catch (error) {
            console.log("Like request failed:", error)
        }
    }

    const handleComment = async () => {
        try {
            const result = await axios.post(`${serverUrl}/api/loop/comment/${loop._id}`, { message }, { withCredentials: true })
            const updatedLoop = result.data

            const updatedLoops = loopData.map(p => p._id == loop._id ? updatedLoop : p)
            dispatch(setLoopData(updatedLoops))
            setMessage("")
        } catch (error) {
            console.log(error)
        }
    }

    const handleDeleteLoop = async () => {
        if (!window.confirm("Kya aap sach mein is loop ko delete karna chahte ho?")) return
        try {
            await axios.delete(`${serverUrl}/api/loop/delete/${loop._id}`, { withCredentials: true })
            const updatedLoops = loopData.filter(p => p._id !== loop._id)
            dispatch(setLoopData(updatedLoops))
        } catch (error) {
            console.log(error)
        }
    }

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (commentRef.current && !commentRef.current.contains(event.target)) {
                setShowComment(false)
            }
        }
        if (showComment) {
            document.addEventListener("mousedown", handleClickOutside)
        } else {
            document.removeEventListener("mousedown", handleClickOutside)
        }
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [showComment])

    useEffect(() => {
        if (isImage) return; // Images par auto-scroll observer ki koi zarurat nahi hai

        const observer = new IntersectionObserver(([entry]) => {
            const video = videoRef.current
            if (!video) return;
            if (entry.isIntersecting) {
                video.play().catch(err => console.log("Auto-play blocked:", err))
                setIsPlaying(true)
            } else {
                video.pause()
                setIsPlaying(false)
            }
        }, { threshold: 0.6 })

        if (videoRef.current) {
            observer.observe(videoRef.current)
        }

        return () => {
            if (videoRef.current) {
                observer.unobserve(videoRef.current)
            }
        }
    }, [isImage])

    useEffect(() => {
        socket?.on("likedLoop", (updatedData) => {
            const updatedLoops = loopData.map(p => p._id == updatedData.loopId ? { ...p, likes: updatedData.likes } : p)
            dispatch(setLoopData(updatedLoops))
        })
        socket?.on("commentedLoop", (updatedData) => {
            const updatedLoops = loopData.map(p => p._id == updatedData.loopId ? { ...p, comments: updatedData.comments } : p)
            dispatch(setLoopData(updatedLoops))
        })

        return () => {
            socket?.off("likedLoop")
            socket?.off("commentedLoop")
        }
    }, [socket, loopData, dispatch])

    return (
        <div className='w-full lg:w-[480px] h-[100vh] flex items-center justify-center border-l-2 border-r-2 border-gray-800 relative overflow-hidden bg-black'>

            {showHeart && <div className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 animate-ping'>
                <GoHeartFill className='w-[100px] h-[100px] text-red-600 drop-shadow-2xl' />
            </div>}

            {/* Comments Drawer UI */}
            <div ref={commentRef} className={`absolute z-[200] bottom-0 w-full h-[500px] p-[10px] rounded-t-4xl bg-[#0e1718] transform transition-transform duration-500 ease-in-out left-0 shadow-2xl shadow-black ${showComment ? "translate-y-0" : "translate-y-[100%] "}`}>
                <h1 className='text-white text-[20px] text-center font-semibold mb-2'>Comments</h1>
                <div className='w-full h-[350px] overflow-y-auto flex flex-col gap-[20px] pb-12'>
                    {loop.comments.length == 0 && <div className='text-center text-white text-[20px] font-semibold mt-[50px]'>No Comments Yet</div>}
                    {loop.comments?.map((com, index) => (
                        <div key={index} className='w-full flex flex-col gap-[5px] border-b-[1px] border-gray-800 justify-center pb-[10px] mt-[10px]'>
                            <div className='flex justify-start items-center md:gap-[20px] gap-[10px]'>
                                <div className='w-[30px] h-[30px] md:w-[40px] md:h-[40px] border-2 border-black rounded-full cursor-pointer overflow-hidden'>
                                    <img src={com.author?.profileImage || dp} alt="" className='w-full h-full object-cover' />
                                </div>
                                <div className='w-[150px] font-semibold text-white truncate'>{com.author?.userName}</div>
                            </div>
                            <div className='text-white pl-[50px] text-sm'>{com.message}</div>
                        </div>
                    ))}
                </div>
                <div className='w-full absolute bottom-0 left-0 h-[70px] bg-[#0e1718] flex items-center justify-between px-[20px] border-t border-gray-800'>
                    <input type="text" className='px-[10px] w-[85%] text-white outline-none bg-transparent border-b border-gray-600 h-[40px] text-sm focus:border-white transition' placeholder='Write comment...' onChange={(e) => setMessage(e.target.value)} value={message} />
                    {message && <button className='cursor-pointer text-white hover:text-gray-300' onClick={handleComment}><IoSendSharp className='w-[22px] h-[22px]' /></button>}
                </div>
            </div>

            {/* 🔥 FIX 2: DYNAMIC LAYOUT CORE RENDERER */}
            {isImage ? (
                <img src={loop?.media} className='w-full max-h-full object-contain' onClick={handleClick} onDoubleClick={handleLikeOnDoubleClick} alt="Loop Image" />
            ) : (
                <video ref={videoRef} autoPlay muted={isMute} loop src={loop?.media} className='w-full max-h-full' onClick={handleClick} onTimeUpdate={handleTimeUpdate} onDoubleClick={handleLikeOnDoubleClick} />
            )}

            {/* Volume Icons (Videos only) */}
            {!isImage && (
                <div className='absolute top-[20px] z-[100] right-[20px] cursor-pointer' onClick={() => setIsMute(prev => !prev)}>
                    {!isMute ? <FiVolume2 className='w-[20px] h-[20px] text-white font-semibold' /> : <FiVolumeX className='w-[20px] h-[20px] text-white font-semibold' />}
                </div>
            )}

            {userData._id === loop.author._id && (
                <button onClick={handleDeleteLoop} className='absolute top-[20px] left-[20px] z-[100] rounded-full bg-black/80 px-[12px] py-[6px] text-white text-sm hover:bg-red-600'>
                    <MdDelete className='inline-block w-[18px] h-[18px] mr-[6px]' /> Delete
                </button>
            )}

            {/* Video Progress Bar (Videos only) */}
            {!isImage && (
                <div className='absolute bottom-0 w-full h-[5px] bg-gray-900'>
                    <div className='h-full bg-white transition-all duration-200 ease-linear' style={{ width: `${progress}%` }}></div>
                </div>
            )}

            {/* Overlay Meta Details */}
            <div className='w-full absolute h-[110px] bottom-[10px] p-[10px] flex flex-col gap-[10px] bg-gradient-to-t from-black/80 to-transparent'>
                <div className='flex items-center gap-[5px]'>
                    <div className='w-[30px] h-[30px] md:w-[40px] md:h-[40px] border-2 border-black rounded-full cursor-pointer overflow-hidden' >
                        <img src={loop.author?.profileImage || dp} alt="" className='w-full h-full object-cover' />
                    </div>
                    <div className='w-[120px] font-semibold truncate text-white'>{loop.author.userName}</div>
                    <FollowButton targetUserId={loop.author?._id} tailwind={"px-[10px] py-[5px] text-white border-2 text-[14px] rounded-2xl border-white"} />
                </div>
                <div className='text-white px-[10px] text-sm truncate w-[80%]'>
                    {loop.caption}
                </div>

                {/* Engagement Toolbar Icons (Right Side) */}
                <div className='absolute right-0 flex flex-col gap-[20px] text-white bottom-[120px] justify-center px-[10px]'>
                    <div className='flex flex-col items-center cursor-pointer'>
                        <div onClick={handleLike}>
                            {!loop.likes.includes(userData._id) ? <GoHeart className='w-[25px] h-[25px]' /> : <GoHeartFill className='w-[25px] h-[25px] text-red-600' />}
                        </div>
                        <div className='text-xs mt-1'>{loop.likes.length}</div>
                    </div>
                    <div className='flex flex-col items-center cursor-pointer' onClick={() => setShowComment(true)}>
                        <div><MdOutlineComment className='w-[25px] h-[25px]' /></div>
                        <div className='text-xs mt-1'>{loop.comments.length}</div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default LoopCard
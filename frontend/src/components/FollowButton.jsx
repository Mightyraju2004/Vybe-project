import axios from 'axios'
import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { serverUrl } from '../App'
import { setFollowing } from '../redux/userSlice' 

function FollowButton({ targetUserId, tailwind, onFollowChange }) {
    const dispatch = useDispatch()
    const { following } = useSelector(state => state.user) || { following: [] }
    
    // Helper function: Sab cheezon mein se sirf pure string ID nikaal ke dega
    const getCleanIdsArray = (arr) => {
        if (!arr || !Array.isArray(arr)) return [];
        return arr.map(item => {
            if (!item) return '';
            if (typeof item === 'object' && item._id) return item._id.toString();
            return item.toString();
        }).filter(id => id !== '');
    }

    const cleanFollowingIds = getCleanIdsArray(following)
    const [isFollowing, setIsFollowing] = useState(cleanFollowingIds.includes(targetUserId?.toString()))

    // Redux store se sync rakho jab jab state badle
    useEffect(() => {
        setIsFollowing(cleanFollowingIds.includes(targetUserId?.toString()))
    }, [following, targetUserId])

    const handleFollow = async (e) => {
        e.stopPropagation()
        e.preventDefault()

        if (!targetUserId) {
            console.log("Error: targetUserId missing!");
            return;
        }

        // 1. UI aur Local State ko FORCE-REVERSE karo (Bina kisi api ka wait kiye)
        const currentButtonState = isFollowing
        setIsFollowing(!currentButtonState)

        // 2. Redux state ko bhi instantly palat do
        let newFollowing = [...cleanFollowingIds]
        if (currentButtonState) {
            newFollowing = newFollowing.filter(id => id !== targetUserId?.toString())
        } else {
            if (!newFollowing.includes(targetUserId?.toString())) {
                newFollowing.push(targetUserId?.toString())
            }
        }
        dispatch(setFollowing(newFollowing))

        try {
            // 3. Chupchaap backend par request bhej do
            await axios.get(`${serverUrl}/api/user/follow/${targetUserId}`, { withCredentials: true })
            
            if (onFollowChange) {
                onFollowChange()
            }
            
        } catch (error) {
            console.log("API check failed, rolling back frontend logic...", error)
            // Agar API crash bhi ho jaye, toh frontend par handle karne ke liye rollback hata diya hai 
            // taaki tumhara UI na atke! Agar refresh karoge tabhi database se purana status aayega.
        }
    }

    return (
        <button 
            className={`${tailwind} ${isFollowing ? 'bg-gray-600 text-white' : 'bg-white text-black'} font-semibold border border-gray-300 transition-all duration-200`}
            onClick={handleFollow}
        >
            {isFollowing ? "Following" : "Follow"}
        </button>
    )
}

export default FollowButton
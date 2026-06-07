import axios from 'axios'
import React, { useEffect } from 'react'
import { serverUrl } from '../App'
import { useDispatch, useSelector } from 'react-redux'
import { setFollowing, setUserData } from '../redux/userSlice'
import { setCurrentUserStory } from '../redux/storySlice'

function getCurrentUser() {
    const dispatch = useDispatch()
    const { storyData } = useSelector(state => state.story)
    
    // Redux se userData ko nikaalo taaki login/signin hote hi ye hook auto-run ho jaye
    const { userData } = useSelector(state => state.user) || {}

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const result = await axios.get(`${serverUrl}/api/user/current`, { withCredentials: true })
                
                // Data tabhi dispatch karo jab backend se user mile
                if (result.data) {
                    dispatch(setUserData(result.data))
                    dispatch(setFollowing(result.data.following || []))
                    dispatch(setCurrentUserStory(result.data.story))
                }
            } catch (error) {
                console.log("Current user fetch karne mein dikkat:", error)
            }
        }
        
        fetchUser()
        
    // FIXED: dependency array mein userData?._id daal diya hai!
    // Isse signin/login hote hi ye hook instantly database se taaza followings load kar lega
    }, [storyData, userData?._id]) 
}

export default getCurrentUser
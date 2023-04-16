import React, { useEffect, useState } from "react";
import { Route, Routes, useParams } from "react-router-dom";

const VideoPlayer = () => {
    const { videoId } = useParams();
    const [video, setVideo] = useState({});
    
    async function getVideoById() {
        const url = '/api/videos/getVideo?id='+videoId;
        const res = await fetch(url);
        const data = await res.json();
        if(data.error) {
            alert('No video with id' + videoId);
        }else {
            setVideo(data.video);
        }
    }

    useEffect(() => {
        getVideoById();
    }, []);

    return(
        <div>
            <div>{video.basename}</div>
            <video width={1000} controls autoPlay>
                <source src={`/api/videos/videoStream?id=${videoId}`}></source>
            </video> 
        </div>
    )
}

export default VideoPlayer;
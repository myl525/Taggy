import React from "react";
import { useParams } from "react-router-dom";

const VideoStream = () => {
    const {videoId} = useParams();
    return(
        <div>
            <video src={`/api/videos/videoStream?id=${videoId}`} autoPlay controls></video>
        </div>
    )
}

export default VideoStream;
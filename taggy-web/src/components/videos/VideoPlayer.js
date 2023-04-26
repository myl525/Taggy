import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import VideoPlayerTags from "./VideoPlayerTags";
import VideoPlayerSide from "./VideoPlayerSide";
import './style.scss'

const VideoInfo = ({video}) => {
    return(
        <div className="video-top-info">
            {video.basename &&
                <>
                <div className="video-top-title-container">
                    <h1 className="video-top-title">
                        {video.basename}
                    </h1>
                    <span className="tooltip">{video.basename}</span>
                </div>
                <div className="video-top-stats">
                    <span>{'Size: '+video.size + 'MB'}</span>
                    <span>{`Res: ${video.width}*${video.height}`}</span>
                    <span>{'FPS: '+video.fps}</span>
                </div>
                </>
            }         
        </div>
    )
}

const Video = ( { videoId }) => {
    return(
        <div className="video-container">
            <video className="block-player" controls>
                <source src={`/api/videos/videoStream?id=${videoId}`}></source>
            </video>
        </div>
    )
}

const VideoPlayer = () => {
    const { videoId } = useParams();
    const [video, setVideo] = useState({});
    
    useEffect(() => {
        getVideoById();
    }, []);

    async function getVideoById() {
        const url = '/api/videos/getVideo?id='+videoId;
        const res = await fetch(url);
        const data = await res.json();
        if(data.error) {
            alert(`ERROR: ${res.status} \n ${data.error.code}`);
        }else {
           setVideo(data.video);
        }
    }

    return(
        <div className="video-player">
            <main className="video-player-main">
                <VideoInfo video={video} />
                <Video videoId={videoId} />  
                <VideoPlayerTags videoId={videoId}/>
            </main>
            <VideoPlayerSide videoId={videoId} />
        </div>
    )
}

export default VideoPlayer;
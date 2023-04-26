import React, { useEffect, useState, useRef } from 'react';
import './style.scss';
import { PlayCircle, Tag } from 'react-bootstrap-icons';
import { Link } from 'react-router-dom';
const VideoCard = ({video}) => {
    const {id, basename, duration, resolution, numTags} = video;
    const [player, setPlayer] = useState(false);
    const timer = useRef(null);

    function handleCoverOnClick() {
        window.location.href = `/videos/${video.id}`;
    }

    function handleMouseOver() {
        timer.current = setTimeout(() => setPlayer(true), 300);
    }
    function handleMouseLeave() {
        clearTimeout(timer.current);
        setPlayer(false);
    }

    return(
        <div className="video-card">
            <div className="video-card-cover" onClick={handleCoverOnClick} onMouseEnter={handleMouseOver} onMouseLeave={handleMouseLeave}>
                {!player&&
                    <>
                        <PlayCircle className="play-icon" />
                        <div className="num-tags">
                            <Tag />
                            <span>{numTags}</span>
                        </div>
                        <div className="resolution-duration">
                            <span className="resolution">{resolution} </span>
                            <span className="video-duration">{duration}</span> 
                        </div>
                    </>
                }
                {player &&
                    <video className="inline-player" src={`/api/videos/videoStream?id=${video.id}`} autoPlay muted></video>
                }
            </div>
            <div className="video-card-title">
               <a href={`/videos/${id}`}>{basename}</a> 
            </div>
        </div>
    )
}


const PlayList = ({videoId}) => {
    const[videos, setVideos] = useState([]);

    useEffect(() => {
        getVideos();
    }, []);

    // get all other videos' id
    async function getVideos() {
        const url = `/api/videos/getVideos`;
        const res = await fetch(url);
        const data = await res.json();
        if(data.error) {
            alert(`ERROR: ${res.status} \n ${data.error.code}`);
        }else {
            setVideos(data.videos);
        }
    }
       
    const listOfVideos = videos.map((video) => {
        return(
            <VideoCard key={video.id} video={video} />
        )
    })


    return(
        <div className='video-player-side-playlist'>
            {listOfVideos}
        </div>
    )
}


const VideoPlayerSide = ( { videoId }) => {
    //const [curr, setCurr] = useState('');

    return(
        <aside className='video-player-side'>
            <PlayList videoId={videoId} />
        </aside>
    )
}


export default VideoPlayerSide;
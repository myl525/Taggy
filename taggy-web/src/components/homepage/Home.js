import React from "react";
import { useState, useRef, useEffect } from "react";
import { PlayCircle, Tag } from "react-bootstrap-icons";
import './style.scss';

const VideoCard = ({video}) => {
    const {id, basename, duration, resolution, numTags} = video;
    const [player, setPlayer] = useState(false);
    const timer = useRef(null);

    function handleCoverOnClick() {
        window.location.href = `/videos/${id}`;
    }

    function handleMouseOver() {
        timer.current = setTimeout(() => setPlayer(true), 300);
        //setPlayer(true);
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
    );
}

const Home = () => {
    const [videos, setVideos] = useState([]);

    useEffect(() => {
        getVideos();
    }, []);

    async function getVideos() {
        const url = '/api/videos/getRecentVideos';
        const res = await fetch(url);
        const data = await res.json();
        if(data.error) {
            //console.log(data.error);
            alert(`ERROR: ${res.status} \n ${data.error.code}`);
        }else {
            setVideos(data.videos);
        }
    }
    
    function handleViewAllOnClick() {
        window.location.href = '/videos';
    }

    const listOfVideos = videos.map((video) => {
        return(
            <VideoCard key={video.id} video={video} />
        )
    });

    return(
        <div className="home-page">
            <div className="recent-videos">
                <div className="recent-videos-header">
                    <h2>recently added videos</h2>
                    <p onClick={handleViewAllOnClick}>view all</p>
                </div> 
                <div className="recent-videos-video-cards">
                    {listOfVideos}
                </div>

            </div>
           
        </div>
        
    )
}

export default Home;


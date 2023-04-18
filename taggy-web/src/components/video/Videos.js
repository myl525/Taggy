import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const VideoCard = ({ id, basename }) => {
    return(
        <div className="video-card">
            <Link to={`${id}`}>{basename}</Link>
        </div>
    )
}

const Videos = () => {
    const [videos, setVideos] = useState([]);

    async function getVideos() {
        const query = window.location.search;
        const url = '/api/videos/getVideos' + query;
        const res = await fetch(url);
        const data = await res.json();
        if(data.error) {
            //TODO styling error
            alert('ERROR');
        }else {
            setVideos(data.videos);
        }
    }
    
    useEffect(() => {
        // FIXME useEffect is called twice
        getVideos();
    }, [])
    
    const listOfVideos = videos.map((video) => {
        return(
            <VideoCard key={video.id} id={video.id} basename={video.basename} />
        )
    })

    return(
        <div className="videos">
            {listOfVideos}
        </div>
    )
}

export default Videos;
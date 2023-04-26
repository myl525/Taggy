import React, { useState, useEffect, useRef } from "react";
import { X, Tag, PlayCircle } from "react-bootstrap-icons";
import { Link } from "react-router-dom";


const SearchBar = ({setVideos}) => {
    const [val, setVal] = useState(new URL(window.location).searchParams.get("name") || '');
    
    function debounce(func, wait=500) {
        let timeout;

        return function excutedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            }

            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        }
    }

    async function getVideos(searchParams) {
        const url = '/api/videos/getVideos?';
        const res = await fetch(url+searchParams);
        const data = await res.json();
        if(data.error) {
            alert(`ERROR: ${res.status} \n ${data.error.code}`);
        }else {
            setVideos(data.videos || []);
        }
    }

    function updateURL(key, value) {
        const url = new URL(window.location);
        url.searchParams.set(key, value);
        window.history.replaceState({}, "", url);
        getVideos(url.searchParams);
    }
    //const debounceUpdateURL = debounce(updateURL);

    function deleteURL(key) {
        const url = new URL(window.location);
        url.searchParams.delete(key);
        window.history.replaceState({}, "", url);
        getVideos(url.searchParams);
    }
    //const debounceDeleteURL = debounce(deleteURL);
    
    function handleOnChange(evt) {
        // update input
        const value = evt.target.value;
        setVal(value);
    }

    function handleOnKeyUp(evt) {
        const value = evt.target.value;
        if(value) {
            updateURL("name", value);
        }else {
            deleteURL("name");
        }
    }

    const debouncedHandleOnKeyUp = debounce(handleOnKeyUp);

    function handleXOnClick() {
        setVal('');
        debounce(deleteURL)("name");
    }

    return (
        <div className="search-bar">
            <input type="text" value={val} onChange={handleOnChange} onKeyUp={debouncedHandleOnKeyUp} />
            <X onClick={handleXOnClick} className={val?"input-clear-button":"element-hidden"} />
        </div>
    )
}

const VideoCard = ({video}) => {
    const {id, basename, duration, resolution, numTags} = video;
    const [player, setPlayer] = useState(false);
    const timer = useRef(null);


    function handleCoverOnClick() {
        window.location.href = `/videos/${video.id}`;
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
               <Link to={`${id}`}>{basename}</Link> 
            </div>
        </div>
    )
}

const Videos = () => {
    const [videos, setVideos] = useState([]);

    useEffect(() => {
        // FIXME useEffect is called twice
        getVideos();
    }, []);

    async function getVideos() {
        const query = window.location.search;
        const url = '/api/videos/getVideos' + query;
        const res = await fetch(url);
        const data = await res.json();
        if(data.error) {
            //console.log(data.error);
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
        <div className="videos">
            <div className="tool-bar">
                <SearchBar videos={videos} setVideos={setVideos} />
            </div>
            <div className="video-cards">
                {listOfVideos}
            </div>
        </div>
    )
}

export default Videos;
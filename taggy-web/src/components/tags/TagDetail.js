import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
// import { Link } from "react-router-dom";
import { PlayCircle, Tag, X } from "react-bootstrap-icons";
import './style.scss';

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

const TagVideos = ( {tagId} ) => {
    const [videos, setVideos] = useState([]);

    useEffect(() => {
        getTagVideos();
    }, []);

    const listOfVideos = videos.map((video) => {
        return(
            <VideoCard key={video.id} video={video}/>
        );
    })

    async function getTagVideos() {
        const url =  '/api/tags/getTagVideos?tag=' + tagId;
        const res = await fetch(url); 
        const data = await res.json();
        if(data.error) {
            alert('ERROR');
        }else {
            console.log(data.videos);
            setVideos(data.videos);
        }
    }

    return(
        <div className="tag-videos">
            {listOfVideos}
        </div>
    )
}

const TagEditPanel = ( {tagId, setPanel, setTagName} ) => {
    const [val, setVal] = useState('');

    function handleOnChange(evt) {
        setVal(evt.target.value);
    }

    async function handleConfirmOnClick() {
        if(val) {
            const url = '/api/tags/editTagName';
            const body = `tagId=${tagId}&newName=${val}`;
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: body
            });
            const data = await res.json();
            if(data.error) {
                alert('ERROR');
            }else {
                setTagName(val);
                setPanel('options');
            }
        }
    }

    function handleXOnClick() {
        setVal('');
    }

    return(
        <div className="tag-edit-panel">
            <div className="edit-bar">
                <input className="edit-input" type="text" value={val} onChange={handleOnChange} />
                <X onClick={handleXOnClick} className={val?"input-clear-button":"element-hidden"} />
            </div>
            <div className="cancel-confirm">
                <button className="cancel-btn" onClick={() => {setPanel('options')}}>Cancel</button>
                <button className="confirm-btn" onClick={handleConfirmOnClick}>Confirm</button>
            </div>
        </div>
    )
}

const TagDeletePanel = ( {tagId, setPanel} ) => {
    async function handleConfirmOnClick() {
        const url = '/api/tags/deleteTag';
        const body = `tagId=${tagId}`;

        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: body
        });
        const data = await res.json();
        if(data.error) {
            alert('ERROR');
        }else {
            window.location.href = '/tags';
        }
    }
    
    return(
        <div className="cancel-confirm">
            <button className="cancel-btn" onClick={() => {setPanel('options')}}>Cancel</button>
            <button className="confirm-btn" onClick={handleConfirmOnClick}>Confirm</button>
        </div>
    )
}

const TagInfo = ( {tagId} ) => {
    // TODO edit tag name or delete tag
    const [tagName, setTagName] = useState('');
    const [panel, setPanel] = useState('options');

    useEffect(() => {
        getTag();
    }, []);

    async function getTag() {
        const url = '/api/tags/getTag?id='+tagId;
        const res = await fetch(url);
        const data = await res.json();
        if(data.error) {
            alert('ERROR');
        }else {
            setTagName(data.tagName);
        }
    }

    return(
        <div className="tag-info">
            <div className="tag-info-name">
                <Tag />
                <span>{tagName}</span>
            </div>
            
            <div className="options">
                {panel === 'options' &&
                    <>
                    <button className="edit-btn" onClick={() => setPanel('edit')}>Edit</button>
                    <button className="delete-btn" onClick={() => setPanel('delete')} >Delete</button>
                    </>
                }
                {panel === 'edit' &&
                    <TagEditPanel  tagId={tagId} setPanel={setPanel} setTagName={setTagName} />
                }
                {panel === 'delete' &&
                    <TagDeletePanel tagId={tagId} setPanel={setPanel} />
                }
            </div>
            
        </div>
    )
}

const TagDetail = () => {
    const { tagId } = useParams();

    return(
        <div className="tag-detail">
            <main className="tag-detail-main">
                <TagVideos tagId={tagId} />
            </main>
            <aside className="tag-detail-side">
                <TagInfo tagId={tagId} />
            </aside>
            
        </div>
    )
}

export default TagDetail;
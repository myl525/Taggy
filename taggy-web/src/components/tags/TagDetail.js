import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Link } from "react-router-dom";

const VideoCard = ({ id, basename }) => {
    return(
        <div className="video-card">
            <Link to={`/videos/${id}`}>{basename}</Link>
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
            <VideoCard key={video.id} id={video.id} basename={video.basename}/>
        );
    })

    async function getTagVideos() {
        const url =  '/api/tags/getTagVideos?tag=' + tagId;
        const res = await fetch(url); 
        const data = await res.json();
        if(data.error) {
            alert('ERROR');
        }else {
            setVideos(data.videos);
        }
    }

    return(
        <div>
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

    return(
        <div className="tag-edit-panel">
            <input type="text" value={val} onChange={handleOnChange} />
            <button onClick={() => {setPanel('options')}}>Cancel</button>
            <button onClick={handleConfirmOnClick}>Confirm</button>
        </div>
    )
}

const TagDeletePanel = ( {tagId} ) => {
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
        <button onClick={handleConfirmOnClick}>Confirm</button>
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
            {tagName}
            <div className="options">
                {panel === 'options' &&
                    <>
                    <button onClick={() => setPanel('edit')}>Edit</button>
                    <button onClick={() => setPanel('delete')} >Delete</button>
                    </>
                }
                {panel === 'edit' &&
                    <TagEditPanel  tagId={tagId} setPanel={setPanel} setTagName={setTagName} />
                }
                {panel === 'delete' &&
                    <TagDeletePanel tagId={tagId} />
                }
            </div>
            
        </div>
    )
}

const TagDetail = () => {
    const { tagId } = useParams();

    return(
        <div className="tag-detail">
            <TagInfo tagId={tagId} />
            <TagVideos tagId={tagId} />
        </div>
    )
}

export default TagDetail;
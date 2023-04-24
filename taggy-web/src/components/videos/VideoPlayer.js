import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { PlusCircle, PlusLg, X } from "react-bootstrap-icons";
import './style.scss'

const Tag = ( {tagName, videoId, setTags} ) => {
    const tags = JSON.stringify([tagName]);

    async function handleXOnClick() {
        const url = '/api/videos/deleteTag';
        const body = `videoId=${videoId}&tag=${tagName}`;
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: body
        });
        const data = await res.json();
        if(data.error) {
            alert('ERROR, delete not successful');
        }else {
            setTags((tags) => {
                const copy = tags.slice();
                const ret = copy.filter((tag) => {
                    return tag !== tagName;
                });
                return ret;
            })
        }
    }

    return(
        <div className="tag">
            <Link id='tagName' className="tagLink" to={`/videos?tags=${tags}`}>{tagName}</Link>
            <X  onClick={handleXOnClick}/>
        </div>
        
    )
}

const AddTagModalBody = ({tagExist, tags, setTags}) => {
    const [inputVal, setInputVal] = useState('');

    const listOfTags = tags.map((tag) => {
        return(
            <div key={tag} className="tag">
                {tag}
                <X onClick={handleXOnClick}/>
            </div>
        )
    })

    function handleOnChange(evt) {
        setInputVal(evt.target.value);
    }

    // handle click add button
    function handlePlusOnClick() {
        if(inputVal) {
            if(!tagExist(inputVal) && !tags.includes(inputVal)) {
                setTags((tags) => {
                    const copy = tags.slice();
                    copy.push(inputVal);
                    return copy;
                })
                setInputVal('');
            }else {
                //TODO better error handlling
                alert('this tag already existed!');
            }
        }
    }
    function handleEnterPress(evt) {
        if(evt.key === 'Enter') {
            handlePlusOnClick();
        }
    }

    function handleXOnClick(evt) {
        const tag = evt.target.parentNode.textContent;
        setTags((tags) => {
            const copy = tags.slice();
            const filtered = copy.filter((ele) => {
                return ele !== tag;
            })
            return filtered;
        })
    }

    return(
        <div className="modal-body">
            <div className="input-bar">
                <input type="text" placeholder="enter tag" onChange={handleOnChange} onKeyUp={(evt) => handleEnterPress(evt)}  value={inputVal}></input>
                <PlusLg onClick={handlePlusOnClick}/>
            </div>
            <div className="tags">
                {listOfTags}
            </div>
        </div>
    )
}

const AddTagModal = ( {handleCloseModal, tagExist, videoId, setParentTags} ) => {
    const [tags, setTags] = useState([]);

    async function handleConfirmOnClick() {
        if(tags.length !== 0) {
            const url = '/api/videos/addTags';
            const body = `id=${videoId}&tags=${JSON.stringify(tags)}`;
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: body
            }) 
            const data = await res.json();
            if(data.error) {
                alert('ERROR');
            }else {
                handleCloseModal();
                setParentTags((parentTags) => {
                    const copy = parentTags.slice();
                    copy.push(...tags);
                    return copy;
                })
            }
        }
    }

    return(
        <div className="modal" onClick={handleCloseModal}>
            <div className="modal-content" onClick={evt => {evt.stopPropagation()}}>
                <div className="modal-header">Add Tags</div>
                <AddTagModalBody tagExist={tagExist} tags={tags} setTags={setTags} />
                <div className="modal-footer">
                    <button onClick={handleCloseModal}>Cancel</button>    
                    <button onClick={handleConfirmOnClick}>Confirm</button>
                </div> 
            </div>
        </div>
    )
}

const Tags = ( {videoId} ) => {
    const [tags, setTags] = useState([]);
    const [show, setShow] = useState(false);

    useEffect(() => {
        console.log('trigger');
        getVideoTags();
    }, []);

    const listOfTags = tags?.map((tag) => {
        return(
            <Tag key={tag} tagName={tag} videoId={videoId} setTags={setTags} />
        )
    })
    
    function tagExist(tag) {
        return tags.includes(tag);
    }
    function handleCloseModal() {
        setShow(false);
    }
    async function getVideoTags() {
        const url = '/api/videos/getVideoTags?id=' + videoId;
        const res = await fetch(url);
        const data = await res.json();
        if(data.error) {
            alert('ERROR');
        }else {
            setTags(data.tags);
        }
    }

    return(
        <div className="tags">
            {listOfTags}
            <PlusCircle onClick={evt => setShow(true)} />
            {show && <AddTagModal handleCloseModal={handleCloseModal} tagExist={tagExist} videoId={videoId} setParentTags={setTags} />}
        </div>
    )
}

const VideoInfo = ({videoId}) => {
    const [video, setVideo] = useState({});

    useEffect(() => {
        getVideoById();
    }, []);

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

    return(
        <div>
            <div>{video.basename}</div>
            <div>{video.size + 'MB'}</div>
        </div>
    )
}

const Video = ( { videoId }) => {
    return(
        <figure className="video-container">
            <video controls>
                <source src={`/api/videos/videoStream?id=${videoId}`}></source>
            </video>
        </figure>
    )
}

const VideoPlayer = () => {
    const { videoId } = useParams();
    
    return(
        <div>
            <VideoInfo videoId={videoId}/>
            <Video videoId={videoId}/>
            <Tags videoId={videoId} />
        </div>
    )
}

export default VideoPlayer;
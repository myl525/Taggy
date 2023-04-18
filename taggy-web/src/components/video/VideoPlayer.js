import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { PlusCircle, PlusLg, X } from "react-bootstrap-icons";
import './style.scss'

const Tag = ( {tagName} ) => {
    const tags = JSON.stringify([tagName]);

    return(
        <Link id='tagName' className="tag" to={`/videos?tags=${tags}`}>{tagName}</Link>
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
                <input type="text" placeholder="enter tag" onChange={handleOnChange} value={inputVal}></input>
                <PlusLg onClick={handlePlusOnClick}/>
            </div>
            <div className="tags">
                {listOfTags}
            </div>
        </div>
    )
}

const AddTagModal = ( {handleCloseModal, tagExist, videoId} ) => {
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

const Tags = ( {tags, videoId} ) => {
    const [show, setShow] = useState(false);
     
    const listOfTags = tags?.map((tag) => {
        return(
            <Tag key={tag} tagName={tag} />
        )
    })
    
    function tagExist(tag) {
        return tags.includes(tag);
    }
    function handleCloseModal() {
        setShow(false);
    }

    return(
        <div className="tags">
            {listOfTags}
            <PlusCircle onClick={evt => setShow(true)} />
            {show && <AddTagModal handleCloseModal={handleCloseModal} tagExist={tagExist} videoId={videoId} />}
        </div>
    )
}

const VideoInfo = ({basename, size}) => {
    return(
        <div>
            <div>{basename}</div>
            <div>{size + 'mb'}</div>
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
            <VideoInfo basename={video.basename} size={video.size} />
            <Video videoId={videoId}/>
            <Tags tags={video.tags} videoId={videoId} />
        </div>
    )
}

export default VideoPlayer;
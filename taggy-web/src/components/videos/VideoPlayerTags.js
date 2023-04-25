import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PlusCircle, PlusSquare, X, XOctagonFill } from "react-bootstrap-icons";
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
            alert(`ERROR: ${res.status} \n ${data.error.code}`);
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
        <div className="video-player-tag">
            <Link id='tagName' className="tagLink" to={`/videos?tags=${tags}`}>{tagName}</Link>
            <div className="divider"></div>
            <X  className="video-player-tag-delete-btn" onClick={handleXOnClick}/>
        </div>
    )
}

const AddTagModalBody = ({tagExist, tags, setTags}) => {
    const [inputVal, setInputVal] = useState('');
    const [duplicate, setDuplicate] = useState(false);

    const listOfTags = tags.map((tag) => {
        return(
            <div key={tag} className="modal-tag">
                <span>{tag}</span>
                <div className="divider"></div>
                <X className="modal-tag-delete-btn" onClick={handleXOnClick}/>
            </div>
        )
    })

    function handleOnChange(evt) {
        setInputVal(evt.target.value);
        if(duplicate) {
            setDuplicate(false);
        }
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
                // alert('this tag already existed!');
                setDuplicate(true);
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
    function handleClearInputBtnOnClick() {
        setInputVal('');
        setDuplicate(false);
    }

    return(
        <div className="modal-body">
            <div className={duplicate?"error-input":"input-bar"}>
                <input type="text" autoFocus placeholder="enter tag" onChange={handleOnChange} onKeyUp={(evt) => handleEnterPress(evt)}  value={inputVal}></input>
                <X className="clear-input-btn" onClick={handleClearInputBtnOnClick} />
                <div className="divider"></div>
                <PlusSquare id="addTagModalInput" className="input-bar-btn" onClick={handlePlusOnClick}/>
            </div>
            <span className={duplicate?"input-error-msg":"element-hidden"}>
                <XOctagonFill />
                Error: This tag already exists!
            </span>
            <div className="modal-tags">
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
        <div className="add-tag-modal" onClick={handleCloseModal}>
            <div className="modal-content" onClick={evt => {evt.stopPropagation()}}>
                <div className="modal-header">Add Tags</div>
                <hr></hr>
                <AddTagModalBody tagExist={tagExist} tags={tags} setTags={setTags} />
                <hr></hr>
                <div className="modal-footer">
                    <button className="cancel-button" onClick={handleCloseModal}>Cancel</button>    
                    <button className="confirm-button" onClick={handleConfirmOnClick}>Confirm</button>
                </div> 
            </div>
        </div>
    )
}

const VideoPlayerTags = ( {videoId} ) => {
    const [tags, setTags] = useState([]);
    const [show, setShow] = useState(false);

    useEffect(() => {
        // console.log('trigger');
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
    function handleOpenModal() {
        setShow(true);
    }
    async function getVideoTags() {
        const url = '/api/videos/getVideoTags?id=' + videoId;
        const res = await fetch(url);
        const data = await res.json();
        if(data.error) {
            alert(`ERROR: ${res.status} \n ${data.error.code}`);
        }else {
            setTags(data.tags);
        }
    }

    return(
        <div className="video-player-tags">
            {listOfTags}
            <PlusCircle className="open-modal-btn" onClick={handleOpenModal} />
            {show && <AddTagModal handleCloseModal={handleCloseModal} tagExist={tagExist} videoId={videoId} setParentTags={setTags} />}
        </div>
    )
}

export default VideoPlayerTags;
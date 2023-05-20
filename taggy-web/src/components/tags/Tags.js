import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { X, Tag, PlayCircle } from "react-bootstrap-icons";
import './style.scss'

const TagCard = ({ id, tagName, numVideos }) => {
    function handleCoverOnClick() {
        window.location.href = `/tags/${id}`;
    }

    return(
        <div className="tag-card">
            <div className="tag-card-cover" onClick={handleCoverOnClick}>
                <Tag className="tag-icon" />
                <span className="num-videos">
                    <PlayCircle />
                    {numVideos}
                </span>
            </div>
            <div className="tag-card-name">
                <Link to={`${id}`}>{tagName}</Link>
            </div>
        </div>
    )
}

const SearchBar = ({setTags}) => {
    const [val, setVal] = useState(new URL(window.location).searchParams.get("name") || '');
    
    function debounce(func, wait=700) {
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
        const url = '/api/tags/getTags?';
        const res = await fetch(url+searchParams);
        const data = await res.json();
        if(data.error) {
            alert(`ERROR: ${res.status} \n ${data.error.code}`);
        }else {
            setTags(data.tags || []);
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
        deleteURL('name');
    }

    return (
        <div className="search-bar">
            <input type="text" value={val} onChange={handleOnChange} onKeyUp={debouncedHandleOnKeyUp} />
            <X onClick={handleXOnClick} className={val?"input-clear-button":"element-hidden"} />
        </div>
    )
}

const Tags = () => {
    const [tags, setTags] = useState([]);

    async function getTags() {
        const query = window.location.search;
        const url = '/api/tags/getTags' + query;
        const res = await fetch(url);
        const data = await res.json();
        if(data.error) {
            //TODO styling error
            alert('ERROR');
        }else {
            setTags(data.tags);
        }
    }
    
    useEffect(() => {
        // FIXME useEffect is called twice
        getTags();
    }, [])
    
    const listOfTags = tags ? tags.map((tag) => {
        return(
            <TagCard key={tag.id} id={tag.id} tagName={tag.name} numVideos={tag.numVideos} />
        )
    }) : [];

    return(
        <div className="tags">
            <div className="tool-bar">
                <SearchBar setTags={setTags} />   
            </div>
            <div className="tag-cards">
                {listOfTags}
            </div>
        </div>
    )
}

export default Tags;


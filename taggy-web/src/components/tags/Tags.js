import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const TagCard = ({ id, tagName }) => {
    return(
        <div className="tag-card">
            <Link to={`${id}`}>{tagName}</Link>
        </div>
    )
}

const Tags = () => {
    const [tags, setTags] = useState([]);

    async function getTags() {
        // const query = window.location.search;
        const url = '/api/tags/getTags';
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
    
    const listOfTags = tags.map((tag) => {
        return(
            <TagCard key={tag.id} id={tag.id} tagName={tag.name} />
        )
    })

    return(
        <div className="tags">
            {listOfTags}
        </div>
    )
}

export default Tags;


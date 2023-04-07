import React, {useState} from 'react';
import { Search, Folder } from 'react-bootstrap-icons';
import './style.scss';

// sections, link to video / image / music pages
const Section = (props) => {
    return(
        <a className="navbar-section" href={props.link}>{props.sectionName}</a>
    )
}
const Sections = (props) => {
    const listOfSections = props.sections.map((section) => {
        return(
            <Section link={section.link} sectionName={section.sectionName} />
        )
    });

    return(
        <div className="navbar-sections">
            {listOfSections}
        </div>
    )
}

// search bar
const SearchBar = () => {
    const [val, setVal] = useState('');
    const handleChange = (evt) => {
        setVal(evt.target.value);
    }

    return(
        <div className="navbar-searchBar">
            <Search className="navbar-searchBar-icon" />
            <input 
                id="searchInput" 
                className="navbar-searchBar-input" 
                type="text" 
                value={val} 
                onChange={handleChange}
            />
        </div>
    )
}

// options, link to stats / settings
const Options = (props) => {
    return(
        <div className="navbar-options">
            <button id="dirsBtn" className="navbar-options-btn">
                <Folder />
            </button>
        </div>
    )
}

const Navbar = (props) => {
    const sections = [{link: '#', sectionName: 'video'}];

    return(
        <nav className="navbar">
            <Sections sections={sections} />
            <SearchBar />
            <Options />
        </nav>
    )
}

export default Navbar;
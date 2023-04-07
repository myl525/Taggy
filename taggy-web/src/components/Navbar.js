import React, {useState} from 'react';
import { Link } from 'react-router-dom';
import { Search, Folder } from 'react-bootstrap-icons';
import './style.scss';

// sections, link to video / image / music pages
const Section = (props) => {
    return(
        <Link className="navbar-section" to={props.link}>{props.sectionName}</Link>
    )
}
const Sections = (props) => {
    const listOfSections = props.sections.map((section) => {
        return(
            <Section key={section.sectionName} link={section.link} sectionName={section.sectionName} />
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
            <Link id="dirsBtn" className="navbar-options-btn" to="/settings">
                <Folder />
            </Link>
        </div>
    )
}

const Navbar = (props) => {
    const sections = [{link: '/video', sectionName: 'video'}];

    return(
        <nav className="navbar">
            <Sections sections={sections} />
            <SearchBar />
            <Options />
        </nav>
    )
}

export default Navbar;
import React from 'react';
import { Link } from 'react-router-dom';
import { Folder, ArrowClockwise, PlayCircle, Tags } from 'react-bootstrap-icons';
import './style.scss';

// options, link to library / scan
const Options = (props) => {
    return(
        <div className="navbar-options">
            <Link id="dirsBtn" to="/library">
                <Folder />
            </Link>
            <Link id="scanBtn" to="/scan">
                <ArrowClockwise />
            </Link>
        </div>
    )
}

const Navbar = (props) => {
    return(
        <nav className="navbar">
            <div className="left">
                <a href='/' className='home-button'>Taggy</a>
                <div className="navbar-sections">
                    <a href="/videos">
                        <PlayCircle />
                        videos
                    </a>
                    <a href="/tags">
                        <Tags />
                        tags
                    </a>
                </div> 
            </div>
            <div className='right'>
              <Options />  
            </div>
        </nav>
    )
}

export default Navbar;
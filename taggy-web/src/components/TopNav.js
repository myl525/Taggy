import React from 'react';
import './style.scss';
import { ClipboardData, Gear } from 'react-bootstrap-icons';

const Section = (props) => {
    return(
        <li className='top-nav-section'>
            <a  href={props.link} className="top-nav-section">{props.name}</a> 
        </li>
    )
}

const TopNav = () => {
    return(
        <div className="top-nav">
            <ul className="top-nav-sections">
                <Section link="/" name="taggy" />
                <Section link="/video" name="video" />
            </ul>

            <ul className="top-nav-settings">
                <li>
                   <a href='/stats'><ClipboardData /></a> 
                </li>
                <li>
                   <a href='/setting'><Gear /></a> 
                </li>
            </ul>
        </div>
    )
}

export default TopNav;
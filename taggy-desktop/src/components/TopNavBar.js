import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles.scss';
import Navbar from 'react-bootstrap/Navbar';
import { ClipboardData, Gear } from 'react-bootstrap-icons';

const TopNavBar = () => {
    const tabs = ['videos', 'images', 'tags'];
    const [idxClicked, setIdxClicked] = useState(-1);

    const handleClickTabBtn = (i, evt) => {
        setIdxClicked(i);
    }

    const tabBtns = tabs.map((tab, i) => {
        const className = i === idxClicked ? 'tab-btn-clicked':'tab-btn';

        return(
            <button key={i} className={className} onClick={(evt) => handleClickTabBtn(i, evt)}>
                {tab}
            </button>
        )
    })

    return(
        <Navbar className='top-nav-bar'>
            <div>
               <button className='home-btn'>taggy</button>    
               {tabBtns} 
            </div>
            <div>
                <button className='tab-btn'>
                  <ClipboardData />  
                </button>
                <button className='tab-btn'>
                   <Gear /> 
                </button>
            </div>
        </Navbar>
    )
}

export default TopNavBar;
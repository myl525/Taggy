import React, { useState } from 'react';

const ExistingDir = (props) => {
    return(
        <div className="existing-dir">
            <span>{props.name}</span>
            <div className="options">
                <button className="option">Edit</button>
                <button className="option">Delete</button>
            </div>
        </div>
    )
}

const ExistingDirs = () => {
    // scan database and get all selected directorys
    return(
        <div className="existing-dirs">
        </div>
    )
}

const AddDirsBtn = () => {
    // To Do : handle onclick
    return(
        <button id="addDirsBtn">
            Add Directory
        </button>
    )
}

const SelectDirModal = () => {
    // TODO: handle click dir entry, handle click cancel / confirm button
    const [val, setVal] = useState('');
    const [dirs, setDirs] = useState([]);
    const [dir, setDir] = useState('');

    // handle input change
    const handleInputChange = (evt) => {
        // update val
        setVal(evt.target.value);
        // update directorys based on val
        
    } 
    



    // generate list of directorys
    const listOfDirs = dirs.map((dir) => {
        return(
            <li className="directory">
                {dir}
            </li>
        )
    })

    return(
        <div id="selectDirModal" className="select-dir-modal">
            <div className="modal-header">
                select a directory
            </div>
            <br />
            <div className="modal-body">
                <input type="text" onChange={handleInputChange}/>
                <ul>
                    {listOfDirs}
                </ul>
            </div>
            <br />
            <div className="modal-footer">
                <button>
                    Cancel
                </button>
                <button>
                    Confirm
                </button>
            </div>
        </div>
    )
}



const Library = () => {
    return(
        <div className="library">
           <ExistingDirs /> 
           <AddDirsBtn />
        </div>
    )
}

const Settings = () => {
    return(
        <div className="settings">
            <Library />
        </div>
    )
}
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
    // TODO: handle click cancel / confirm button
    const [val, setVal] = useState('');
    const [dirs, setDirs] = useState([]);
    const [error, setError] = useState(false);

    // handle input change
    const handleInputChange = async (evt) => {
        const newVal = evt.target.value;
        // update val
        setVal(newVal);
        // update directorys based on val
        if(newVal.endsWith('/')) {
            const data = await getChildDirectory(newVal);
            if(data.error) {
                setError(e => true);
            }else {
                if(error) {
                    setError(e => false);
                }
                setDirs(data.children);
            }
        }
    } 
    const getChildDirectory = async (path) => {
        const res = await fetch('/api/settings/library/getChildDirectory?path=' + path);
        const data = await res.json();
        return data;
    }

    // handle click dir entry
    const handleDirClick = async (evt) => {
        const path = evt.target.textContent;
        const data = await getChildDirectory(path);
        if(data.error) {
            setDirs([]);
        }else {
            setDirs(data.children);
        }
        setVal(val => path);
    }

    // generate list of directorys
    const listOfDirs = dirs.map((dir) => {
        return(
            <li key={dir} className="directory" onClick={handleDirClick}>
                {dir}
            </li>
        )
    })


    // modal body
    const modalBody = () => {
        if(!error) {
            return(
                <ul>
                    {listOfDirs}
                </ul>
            )
        }else {
            return(
                <h1>No such file or directory</h1>
            )
        }
    }

    return(
        <div id="selectDirModal" className="select-dir-modal">
            <div className="modal-header">
                select a directory
            </div>
            <br />
            <div className="modal-body">
                <input type="text" onChange={handleInputChange} value={val} />
                {modalBody()}
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
            <h1>Library</h1>
            <ExistingDirs /> 
            <AddDirsBtn />
            <SelectDirModal />
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

export default Settings;
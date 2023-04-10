import React, { useState } from 'react';
import './style.scss';

// added directories, directories that are added to the library 
const AddedDir = (props) => {
    return(
        <div className="added-dir">
            <span>{props.path}</span>
            <div className="options">
                <button className="option">Edit</button>
                <button className="option">Delete</button>
            </div>
        </div>
    )
}
const AddedDirs = (props) => {
    // TODO scan database and get all selected directorys
    return(
        <div className="added-dirs">
        </div>
    )
}

// button for opening select directory modal
const AddDirsBtn = ({ handleOnClick }) => {
    return(
        <button id="addDirsBtn" onClick={handleOnClick}>
            Add Directory
        </button>
    )
}

// modal for selecting directory 
const ModalHeader = () => {
    return(
        <div className="modal-header">
            select a directory
        </div>
    )
}
const ModalBody = (props) => {
    const [path, setPath] = useState('');
    const [dirs, setDirs] = useState([]);
    const [error, setError] = useState(false);

    // get parent directory
    const getParentDirectory = async (path) => {
        
        const pathArr = path.split('/');
        const parentPath = pathArr.slice(0, pathArr.length-1).join('/') || '/';
        const res = await fetch('/api/settings/library/getChildDirectory?path=' + parentPath);
        const data = await res.json();

        setError(false);
        setDirs(data.children);
    }
    // get child directory for specific path
    const getChildDirectory = async (path) => {
        const res = await fetch('/api/settings/library/getChildDirectory?path=' + path);
        const data = await res.json();
        
        if(data.error) {
            if(path.endsWith('/')) {
                setError(true);  
            }else {
                getParentDirectory(path);
            }
        }else {
            if(error) {
                setError(false);
            }
            setDirs(data.children);
        }
    }
    // handle input change
    const handlePathOnChange = async (evt) => {
        const newPath = evt.target.value;
        // update path
        setPath(newPath);
        
        if(newPath) {
            await getChildDirectory(newPath); 
        }else {
            setDirs([]);
        }
    } 
    // handle click directory
    const handleDirOnClick = async (evt) => {
        const dir = evt.target.textContent;
        await getChildDirectory(dir);
        setPath(dir);
    }
    // handle click up button
    const handleUpOnClick = async (evt) => {
        await getParentDirectory(path);
        const pathArr = path.split('/');
        const parentPath = pathArr.slice(0, pathArr.length-1).join('/') || '/';
        setPath(parentPath);
    }

    // create a list of dirs
    const listOfDirs = dirs.map((dir) => {
        return(
            <li key={dir} className="directory" onClick={handleDirOnClick}>
                {dir}
            </li>
        )
    })

    return(
        <div className="modal-body">
            <input type="text" placeholder='path' onChange={handlePathOnChange} value={path} />
            <ul className='dir-list'>
                {!path || path.endsWith('/') ? '' : <button id='parentDirBtn' onClick={handleUpOnClick}>UP</button>}
                {error ? <h1>No such file or directory</h1> : listOfDirs}
            </ul>
        </div>
    )
}
const ModalFooter = ({handleCloseModal}) => {
    return(
        <div className="modal-footer">
            <button onClick={handleCloseModal}>
                Cancel
            </button>
            <button>
                Confirm
            </button>
        </div>
    )
}

const SelectDirModal = ({show, handleCloseModal}) => {
    if(show) {
        return(
            <div id="selectDirModal" className="select-dir-modal" onClick={handleCloseModal}>
                <div className='modal-content' onClick={evt => {evt.stopPropagation()}}>
                    <ModalHeader />
                    <br />
                    <ModalBody />
                    <br />
                    <ModalFooter handleCloseModal={handleCloseModal} /> 
                </div>
            </div>
        )
    }else {
        return null;
    }
}

// library setting
const Library = () => {
    const [show, setShow] = useState(false);
    // TODO get added dirs from database
    return(
        <div className="library">
            <h1>Library</h1>
            <AddedDirs /> 
            <AddDirsBtn handleOnClick={evt => {setShow(true)}}/>
            <SelectDirModal 
                show={show} 
                handleCloseModal={evt => {setShow(false)}}
            />
        </div>
    )
}

// settings
const Settings = () => {
    return(
        <div className="settings">
            <Library />
        </div>
    )
}

export default Settings;
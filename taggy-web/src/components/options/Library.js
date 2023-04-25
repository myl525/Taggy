import React, { useState, useEffect } from 'react';
import './style.scss';
import { Folder2, XOctagonFill, X } from 'react-bootstrap-icons';

// added directories, directories that are added to the library 
const AddedDir = ({path, handleDeleteOnClick}) => {
    return(
        <div className="added-dir">
            <span>{path}</span>
            <span onClick={handleDeleteOnClick.bind(null, path)} className="option">
                Delete
            </span>
        </div>
    )
}
const AddedDirs = ({addedDirs, setAddedDirs}) => {
    async function handleDeleteOnClick(path) {
        const url = '/api/settings/library/deleteDirectory';
        const body = `dir=${path}`
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: body
        });
        const data = await res.json();
        if(data.success) {
            setAddedDirs((addedDirs) => {
                const copy = addedDirs;
                const filtered = copy.filter((ele) => {
                    return ele !== path;
                });
                return filtered;
            })
        } else {
            alert(`ERROR: ${res.status} \n ${data.error.code}`);
        }
    }

    const listOfAddedDirs = addedDirs.map((addedDir) => {
        return(
            <AddedDir key={addedDir} path={addedDir} handleDeleteOnClick={handleDeleteOnClick} />
        )
    })

    return(
        <div className="added-dirs">
            <div className='-header'>
                <div>Path</div>
            </div>
            {listOfAddedDirs}
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
const ModalBody = ({path, setPath, duplicate, setDuplicate}) => {
    const [dirs, setDirs] = useState([]);
    const [error, setError] = useState(false);

    // get parent directory
    async function getParentDirectory(path) {
        
        const pathArr = path.split('/');
        const parentPath = pathArr.slice(0, pathArr.length-1).join('/') || '/';
        const res = await fetch('/api/settings/library/getChildDirectory?path=' + parentPath);
        const data = await res.json();

        setError(false);
        setDirs(data.children);
    }
    // get child directory for specific path
    async function getChildDirectory(path) {
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
    const debounceGetChildDirectory = debounce(getChildDirectory);

    // handle input change
    async function handlePathOnChange(evt) {
        const newPath = evt.target.value;
        // update path
        setPath(newPath);
        
        // if(newPath) {
        //     await debounceGetChildDirectory(newPath); 
        // }else {
        //     setDirs([]);
        // }

        // clear error
        if(duplicate) {
            setDuplicate(false);
        }
    } 
    
    async function handleOnKeyUp(evt) {
        const newPath = evt.target.value;
        await debounceGetChildDirectory(newPath);
    }

    // handle click directory
    async function handleDirOnClick(evt) {
        const dir = evt.target.textContent;
        await getChildDirectory(dir);
        setPath(dir);
    }
    // handle click up button
    async function handleUpOnClick(evt) {
        await getParentDirectory(path);
        const pathArr = path.split('/');
        const parentPath = pathArr.slice(0, pathArr.length-1).join('/') || '/';
        setPath(parentPath);
        setDuplicate(false);
    }
    // debounce
    function debounce (func, wait=300) {
        let timeout;
      
        return function executedFunction(...args) {
          const later = () => {
            //clearTimeout(timeout);
            func(...args);
          };
      
          clearTimeout(timeout);
          timeout = setTimeout(later, wait);
        };
    };
    function handleClearInputBtnOnClick() {
        setPath('');
        setDuplicate(false);
    }


    // create a list of dirs
    const listOfDirs = dirs.map((dir) => {
        return(
            <li key={dir} className="directory" onClick={handleDirOnClick}>
                <Folder2 />
                {dir}
            </li>
        )
    })

    return(
        <div className="modal-body">
            <div className={duplicate?"error-input":"input-bar"}>
               <input 
                    autoFocus
                    type="text" 
                    placeholder='file path' 
                    onChange={handlePathOnChange} 
                    onKeyUp={handleOnKeyUp}
                    value={path} 
                /> 
                <X className='clear-input-btn' onClick={handleClearInputBtnOnClick}/>
            </div>
            <span className={duplicate?"input-error-msg":"element-hidden"}>
                <XOctagonFill />
                Error: This directory already exists!
            </span>
            <ul className='dir-list'>
                {!path || path.endsWith('/') ? '' : <button id='parentDirBtn' onClick={handleUpOnClick}>UP</button>}
                {error ? <h1>No such file or directory</h1> : listOfDirs}
            </ul>
        </div>
    )
}
const ModalFooter = ({handleCloseModal, path, addedDirs, setAddedDirs, setDuplicate}) => {
    // all added dirs path to lower case, to prevent duplicate paths
    const transfromed = addedDirs.map((ele) => ele.toLowerCase());
    const handleConfirmOnClick = async (evt) => {
        if(!transfromed.includes(path.toLowerCase())) {
            // add it to the database and close modal
            const url = "/api/settings/library/addDirectory";
            const body = "newDir="+path;
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: body
            });
            const data = await res.json();
            if(data.success) {
                // update addeddirs
                setAddedDirs((addedDirs) => {
                    const copy = addedDirs.slice();
                    copy.push(path);
                    return copy;
                });
                handleCloseModal();
            }else {
                alert(`ERROR: ${res.status} \n ${data.error.code}`);
            }
        }else {
            setDuplicate(true);
        }
    }

    return(
        <div className="modal-footer">
            <button className="cancel-button" onClick={handleCloseModal}>
                Cancel
            </button>
            <button className="confirm-button" onClick={handleConfirmOnClick}>
                Confirm
            </button>
        </div>
    )
}

const SelectDirModal = ({show, handleCloseModal, addedDirs, setAddedDirs}) => {
    const [path, setPath] = useState('');
    const [duplicate, setDuplicate] = useState(false);

    if(show) {
        document.body.style.overflow = 'hidden';
    }

    if(show) {
        return(
            <div id="selectDirModal" className="select-dir-modal" onClick={handleCloseModal}>
                <div className='modal-content' onClick={evt => {evt.stopPropagation()}}>
                    <ModalHeader />
                    <hr></hr>
                    <ModalBody 
                        path={path} 
                        setPath={setPath}
                        duplicate={duplicate}
                        setDuplicate={setDuplicate}
                    />
                    <hr></hr>
                    <ModalFooter 
                        path={path} 
                        handleCloseModal={handleCloseModal} 
                        addedDirs={addedDirs} 
                        setAddedDirs={setAddedDirs} 
                        setDuplicate={setDuplicate}
                    /> 
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
    const [addedDirs, setAddedDirs] = useState([]);
    
    // get added dirs from database and display
    useEffect(() => {
        getAddedDirectory();
    }, []);

    // get added dirs from database
    async function getAddedDirectory() {
        const url = "/api/settings/library/getAddedDirectory";
        const res = await fetch(url);
        const data = await res.json();
        if(data.dirs) {
            setAddedDirs(data.dirs);
        }else {
            alert(`ERROR: ${res.status} \n ${data.error}`);
        }
    }
    function handleCloseModal() {
        setShow(false);
        document.body.style.overflow = '';
    }

    return(
        <div className="library">
            <h1 className="header">Library</h1>
            <AddedDirs addedDirs={addedDirs} setAddedDirs={setAddedDirs} /> 
            <AddDirsBtn handleOnClick={evt => {setShow(true)}}/>
            {show &&
                <SelectDirModal 
                    addedDirs={addedDirs}
                    setAddedDirs={setAddedDirs}
                    show={show} 
                    handleCloseModal={handleCloseModal}
                />
            }   
        </div>
    )
}

export default Library;
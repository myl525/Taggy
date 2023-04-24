import React, { useState } from "react";
import { ArrowClockwise } from "react-bootstrap-icons";

const Scan = ({addedDirs}) => {
    const [status, setStatus] = useState('Scan');

    const handleScanOnClick = async () => {
        setStatus('Scanning...');
        const url = '/api/settings/scan';
        const res = await fetch(url);
        const data = await res.json();
        if(data.success) {
            //TODO handle success
            setStatus('Scan');
        }else {
            //TODO better error handler
            alert('ERROR!');
        }
    }

    return(
        <div className="scan">
            <button onClick={handleScanOnClick}>{status}</button>
        </div>
    )
}

export default Scan;
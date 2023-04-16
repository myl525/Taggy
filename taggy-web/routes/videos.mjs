import express from 'express';
import path from 'path';
import sqlite3 from "sqlite3";
import fs from 'fs';

// set up sqlite
const dbPath = path.resolve('database', 'taggy.sqlite');
const sqlite = sqlite3.verbose();
const db = new sqlite.Database(dbPath, sqlite.OPEN_READWRITE, (err) => {
    if(err) {
        console.log(err);
    }
})
// set up router
const router = express.Router();



router.get('/api/videos/getVideos', (req, res) => {
    const selectSql = 'SELECT id, basename FROM files';
    db.all(selectSql, (err, rows) => {
        if(err) {
            console.log(err);
            res.json({error: err});
        }else {
            const videos = rows.map((row) => {
                const [id, basename] = [row.id, row.basename];
                //const filePath = generateFileFullPath(basename, parentDirId);
                return {id, basename};
            })
            res.json({videos});
        }
    })
})

router.get('/api/videos/getVideo', async (req, res) => {
    const videoId = req.query.id;
    const video = await getVideoById(videoId);
    res.json({video});
});

router.get('/api/videos/videoStream', async (req, res) => {
    const videoId = req.query.id;
    const videoFile = await getVideoById(videoId);
    // video stream
    const range = req.headers.range;
    const videoPath = videoFile.filePath;
    const videoSize = fs.statSync(videoPath).size;
    const chunkSize = 1 * 1e6;
    const start = Number(range.replace(/\D/g, ""));
    const end = Math.min(start + chunkSize, videoSize - 1);
    const contentLength = end - start + 1;
    const headers = {
        "Content-Range": `bytes ${start}-${end}/${videoSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": contentLength,
        //TODO add more format
        "Content-Type": "video/mp4"
    }
    res.writeHead(206, headers)
    const stream = fs.createReadStream(videoPath, {
        start,
        end
    })
    stream.pipe(res);
})

/** Functions */
// generate full path of a file
function generateFileFullPath(basename, parentDirId) {
    return new Promise((resolve, reject) => {
        const selectSql = 'SELECT path FROM dirs WHERE id = ?';
        db.get(selectSql, [parentDirId], (err, row) => {
            if(err) {
                reject(err);
            }else {
                resolve(path.resolve(row.path, basename));
            }
        }) 
    })
    
}

function getVideoById(id) {
    return new Promise((resolve, reject) => {
        const selectSql = 'SELECT * FROM files WHERE id = ?';
        db.get(selectSql, [id], async (err, row) => {
            if(err) {
                reject(err);
            }else {
                const [basename, parentDirId] = [row.basename, row['parent_dir_id']];
                const filePath = await generateFileFullPath(basename, parentDirId);
                const video = {basename, filePath};
                resolve(video);
            }
        })
    })
}




export default router;
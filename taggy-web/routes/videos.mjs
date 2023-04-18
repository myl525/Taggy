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
    //TODO add tags filter (tags filter is array)
    const tagsFilter = req.query.tags ? JSON.parse(req.query.tags):undefined;
    if(tagsFilter) {
        const selectSql = `SELECT DISTINCT files.id, basename FROM files 
                                    INNER JOIN videos_tags ON files.id = videos_tags.video_id
                                    INNER JOIN tags ON videos_tags.tag_id = tags.id
                                    WHERE tags.name IN (${tagsFilter.map(() => '?').join(",")})`;
        db.all(selectSql, tagsFilter, (err, rows) => {
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
        });
    }else {
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
    }
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

router.get('/api/videos/getVideoTags', async (req, res) => {
    const tags = await getVideoTags(req.query.id);
    res.json({tags});
})


// add tags for video
router.post('/api/videos/addTags', async (req, res) => {
    // first insert(or ignore if exist) tags into TABLE tags,
    // then get tag id and insert into TABLE videos_tags
    const tags = JSON.parse(req.body.tags);
    const videoId = req.body.id;
    
    tags.map((tag) => {
        // check if tag exists, if not, create new tag
       insertTag(tag)
            .then((tag) => {
                return getTagId(tag);
            })
            .then((tagId) => {
                insertVideoTag(videoId, tagId);
            })
            .catch(err => {
                console.log(err);
            });
    });
})

//handle search videos by tag (support multiple tags filter)
// router.get('/api/videos/searchByTags', (req, res) => {
//     const tags = JSON.parse(req.query.tags);
// })

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

function getVideoTags(videoId) {
    return new Promise((resolve, reject) => {
        const selectSql = `SELECT name FROM tags 
                            INNER JOIN videos_tags 
                            ON tags.id = videos_tags.tag_id
                            WHERE videos_tags.video_id = ?`;
        db.all(selectSql, [videoId], (err, rows) => {
            if(err) {
                reject(err);
            }else {
                if(rows) {
                    const tags = rows.map((row) => {
                        return row.name;
                    });
                    resolve(tags);
                }else {
                    resolve([]);
                }
            }
        })
    })
}

function getVideoById(id) {
    //TODO send info(basename, filepath?, size, resolution), tags
    return new Promise((resolve, reject) => {
        const selectSql = 'SELECT * FROM files WHERE id = ?';
        db.get(selectSql, [id], async (err, row) => {
            if(err) {
                reject(err);
            }else {
                const [basename, parentDirId] = [row.basename, row['parent_dir_id']];
                const filePath = await generateFileFullPath(basename, parentDirId);
                const size = (row.size / (1024*1024)).toFixed(2);
                const tags = await getVideoTags(id);
                const video = {basename, filePath, size, tags};
                resolve(video);
            }
        })
    })
}
// insert tag into TABLE tags
function insertTag(tag) {
    return new Promise((resolve, reject) => {
        const insertSql = 'INSERT OR IGNORE INTO tags(name) VALUES(?)';
        db.run(insertSql, [tag], (err) => {
            if(err) {
                reject(err);
            }else {
                resolve(tag);
            }
        })
    })
}
// get tag id from TABLE tags
function getTagId(tag) {
    return new Promise((resolve, reject) => {
        const selectSql = 'SELECT id FROM tags WHERE name = ?';
        db.get(selectSql, [tag], (err, row) => {
            if(err) {
                reject(err);
            }else {
                resolve(row.id);
            }
        });
    })
}
// create video-tag pair in TABLE videos_tags
function insertVideoTag(videoId, tagId) {
    return new Promise((resolve, reject) => {
        const insertSql = 'INSERT INTO videos_tags(video_id, tag_id) VALUES(?, ?)';
        db.run(insertSql, [videoId, tagId], (err) => {
            if(err) {
                reject(err);
            }else {
                resolve();
            }
        });
    })
}

export default router;
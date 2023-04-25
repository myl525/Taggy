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

/**Videos Index Page */
// routes
router.get('/api/videos/getVideos', async (req, res) => {
    const tagsFilter = req.query.tags ? JSON.parse(req.query.tags) : undefined;
    const nameStr = req.query.name;
    let selectSql = `SELECT DISTINCT files.id FROM files`;
    const paras = [];
    if(tagsFilter) {
        selectSql += ` INNER JOIN videos_tags ON files.id = videos_tags.video_id
                    INNER JOIN tags ON videos_tags.tag_id = tags.id
                    WHERE tags.name IN (${tagsFilter.map(() => '?').join(",")})`;
        paras.push(...tagsFilter);
    }
    if(nameStr) {
        const word = tagsFilter ? 'AND' : 'WHERE'
        selectSql += ` ${word} files.basename LIKE ?`;
        paras.push(`%${nameStr}%`);
    }
    db.all(selectSql, paras, async (err, rows) => {
        if(err) {
            console.log(err);
            res.json({error: err});
        }else {
            const videoIds = rows.map((row) => row.id);
            const videos = await getVideosById(videoIds);
            res.json({videos});
        }
    })
    
});
// function
function getVideosById(ids) {
    return new Promise((resolve, reject) => {
        const selectSql = `SELECT id, basename, duration, width, height FROM files 
                            INNER JOIN video_files ON id = file_id 
                            WHERE id IN (${ids.map(() => '?').join(",")})`;
        db.all(selectSql, ids, async (err, rows) => {
            if(err) {
                reject(err);
            }else {
                const videos = await Promise.all(rows.map(async (row) => {
                    const {id, basename, duration, width, height} = row;
                    //const size = (row.size / (1024*1024)).toFixed(2);
                    const resolution = calculateResolution(height, width);
                    const numTags = await getNumberOfTags(id);
                    return {id, basename, duration, resolution, numTags};
                }));
                resolve(videos);
            }
        })
    })
}

function calculateResolution(height, width) {
    const value = Math.min(Number(height), Number(width));
    if(value < 360) {
        return '240P';
    }else if(value < 480) {
        return '360P';
    }else if(value < 720) {
        return '480P';
    }else if(value < 1080) {
        return '720P';
    }else if(value < 1440) {
        return '1080P';
    }else if(value < 2160){
        return '2K';
    }else {
        return '4K';
    }
}

function getNumberOfTags(videoId) {
    return new Promise((resolve, reject) => {
        const selectSql = `SELECT COUNT(*) AS numTags FROM videos_tags WHERE video_id = ? GROUP BY video_id`;
        db.get(selectSql, [String(videoId)], (err, row) => {
            if(err) {
                reject(err);
            }else if(row){
                resolve(row.numTags);
            }else {
                resolve(0);
            }
        })
    })
}

/**Videos Video Player page */
// routes
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
    const videoId = req.query.id;
    const selectSql = `SELECT name FROM tags 
                            INNER JOIN videos_tags 
                            ON tags.id = videos_tags.tag_id
                            WHERE videos_tags.video_id = ?`;
    db.all(selectSql, [videoId], (err, rows) => {
        if(err) {
            console.log(err);
            res.json({error: err});
        }else {
            if(rows) {
                const tags = rows.map((row) => {
                    return row.name;
                });
                res.json({tags});
            }else {
                res.json({tags: []});
            }
        }
    })
})

// add tags for video
router.post('/api/videos/addTags', async (req, res) => {
    // first insert(or ignore if exist) tags into TABLE tags,
    // then get tag id and insert into TABLE videos_tags
    const tags = JSON.parse(req.body.tags);
    const videoId = req.body.id;
    await Promise.all(tags.map((tag) => {
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
                res.json({error: err});
            });
    }));
    res.json({success: true});
})

// delete tags for video
router.post('/api/videos/deleteTag', async (req, res) => {
    const videoId = req.body.videoId;
    const tagName = req.body.tag;
    const deleteSql = `DELETE FROM videos_tags WHERE video_id = ? AND tag_id = 
                            (SELECT id FROM tags WHERE name = ?)`;
    db.run(deleteSql, [videoId, tagName], (err) => {
        if(err) {
            console.log(err);
            res.json({error: err});
        }else {
            res.json({success: true});
        }
    })
})

/** Functions */
// generate full path of a file
// function generateFileFullPath(basename, parentDirId) {
//     return new Promise((resolve, reject) => {
//         const selectSql = 'SELECT path FROM dirs WHERE id = ?';
//         db.get(selectSql, [parentDirId], (err, row) => {
//             if(err) {
//                 reject(err);
//             }else {
//                 resolve(path.resolve(row.path, basename));
//             }
//         }) 
//     })
// }

// function getVideoTags(videoId) {
//     return new Promise((resolve, reject) => {
//         const selectSql = `SELECT name FROM tags 
//                             INNER JOIN videos_tags 
//                             ON tags.id = videos_tags.tag_id
//                             WHERE videos_tags.video_id = ?`;
//         db.all(selectSql, [videoId], (err, rows) => {
//             if(err) {
//                 reject(err);
//             }else {
//                 if(rows) {
//                     const tags = rows.map((row) => {
//                         return row.name;
//                     });
//                     resolve(tags);
//                 }else {
//                     resolve([]);
//                 }
//             }
//         })
//     })
// }

function getVideoById(id) {
    // send info(basename, filepath?, size, 
    // TODO resolution), tags
    return new Promise((resolve, reject) => {
        const selectSql = `SELECT basename, size, fps, width, height, path FROM files 
                            INNER JOIN video_files ON files.id = video_files.file_id 
                            INNER JOIN dirs ON dirs.id = files.parent_dir_id
                            WHERE files.id = ?`;
        db.get(selectSql, [id], async (err, row) => {
            if(err) {
                reject(err);
            }else {
                const {basename, fps, width, height} = row;
                const filePath = path.resolve(row.path, basename);
                const size = (row.size / (1024*1024)).toFixed(2);
                const video = {basename, filePath, size, fps, width, height};
                resolve(video);
            }
        });
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
        const insertSql = 'INSERT OR IGNORE INTO videos_tags(video_id, tag_id) VALUES(?, ?)';
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
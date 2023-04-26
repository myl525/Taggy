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

/** tags index page */
// APIS
router.get('/api/tags/getTag', (req, res) => {
    const tagId = req.query.id;
    const selectSql = 'SELECT name FROM tags WHERE id = ?';
    db.get(selectSql, [Number(tagId)], (err, row) => {
        if(err) {
            console.log(err);
            res.json({error: err});
        }else {
            res.json({tagName: row.name});
        }
    })
})

router.get('/api/tags/getTags', (req, res) => {
    let tagName = req.query.name;
    let selectSql = 'SELECT id, name FROM tags';
    if(tagName) {
        selectSql += ' WHERE name LIKE ?';
        tagName = `%${tagName}%`
    }
    // console.log(selectSql)
    // console.log(tagName)
    db.all(selectSql, [tagName], async (err, rows) => {
        if(err) {
            console.log(err);
            res.json({error: err});
        }else {
            const tags = await Promise.all(rows.map(async (row) => {
                const [id, name] = [row.id, row.name];
                const numVideos = await getNumberOfVideos(row.id);
                //const filePath = generateFileFullPath(basename, parentDirId);
                return {id, name, numVideos};
            }))
            //console.log(tags);
            res.json({tags});
        }
    })
})
// Functions
function getNumberOfVideos(tagId) {
    return new Promise((resolve, reject) => {
        const selectSql = `SELECT COUNT(*) AS numVideos FROM videos_tags WHERE tag_id = ? GROUP BY tag_id`;
        db.get(selectSql, [tagId], (err, row) => {
            if(err) {
                reject(err);
            }else {
                resolve(row.numVideos);
            }
        })
    })
}


/**Tag detail page */
router.get('/api/tags/getTagVideos', (req, res) => {
    const tagId = req.query.tag;
    const selectSql = `SELECT DISTINCT id, basename FROM files 
                        INNER JOIN videos_tags ON files.id = videos_tags.video_id
                        WHERE videos_tags.tag_id = ? `
        db.all(selectSql, [Number(tagId)], (err, rows) => {
            if(err) {
                console.log(err);
                res.json({error: err});
            }else {
                const videos = rows.map((row) => {
                    const [id, basename] = [row.id, row.basename];
                    //const filePath = generateFileFullPath(basename, parentDirId);
                    return {id, basename};
                });
                res.json({videos});
            }
        });
})

router.post('/api/tags/editTagName', (req, res) => {
    const tagId = req.body.tagId;
    const newName = req.body.newName;
    const updateSql = 'UPDATE tags SET name = ? WHERE id = ?';
    db.run(updateSql, [newName, tagId], (err) => {
        if(err) {
            console.log(err);
            res.json({error: err});
        }else {
            res.json({success: true});
        }
    });
})

router.post('/api/tags/deleteTag', (req, res) => {
    const tagId = req.body.tagId;
    deleteTagInTags(tagId)
    .then(() => deleteTagInVideosTags(tagId))
    .then(() => {res.json({success: true})})
    .catch(err => {
        console.log(err);
        res.json({error: err});
    });
})

/** FUNCTIONS */
// delete tag from TABLE tags
function deleteTagInTags(tagId) {
    return new Promise((resolve, reject) => {
        const deleteSql = `DELETE FROM tags WHERE id = ?`;
        db.run(deleteSql, [Number(tagId)], (err) => {
            if(err) {
                reject(err);
            }else {
                resolve();
            }
        });
    })
}
// delete tag from TABLE videos_tags
function deleteTagInVideosTags(tagId) {
    return new Promise((resolve, reject) => {
        const deleteSql = `DELETE FROM videos_tags WHERE tag_id = ?`;
        db.run(deleteSql, [Number(tagId)], (err) => {
            if(err) {
                reject(err);
            }else {
                resolve();
            }
        });
    })
}




export default router;
import express from 'express';
import { readdir } from 'fs/promises';
import fs from 'fs';
import path from 'path';
import sqlite3 from "sqlite3";

// set up sqlite
const dbPath = path.resolve('database', 'taggy.sqlite');
const sqlite = sqlite3.verbose();
const db = new sqlite.Database(dbPath, sqlite.OPEN_READWRITE, (err) => {
    if(err) {
        console.log(err);
    }else {
        console.log("Connected to the Taggy database...");
    }
})
// set up router
const router = express.Router();


// check if directory exists
// router.get('/api/settings/library/existsDir', async (req, res) => {
//     const dir = req.query.path;
//     try {
//         res.json({exist: fs.existsSync(dir)});
//     } catch (error) {
//         console.log(error);
//     }
// } )

// get child directory
router.get('/api/settings/library/getChildDirectory', async (req, res) => {
    const parent = req.query.path;
    try {
        const children = await readdir(parent, { withFileTypes: true});
        const childDirectory = children.filter((dir) => {
            return dir.isDirectory();
        }).map((dir) => {
            return path.resolve(parent, dir.name);
        })
        res.json({children: childDirectory}); 
    } catch (error) {
        res.json({error: error});
    }
});

// get added directory
router.get('/api/settings/library/getAddedDirectory', async (req, res) => {
    const selectSql = "SELECT * FROM libraries";
    db.all(selectSql, (err, rows) => {
        if(err) {
            console.log(err)
            res.json({error: err});
        }else {
            const dirs = rows.map((row) => {
                return row.path;
            })
            res.json({dirs});
        }
    })
})
// add selected directory to the libraries table
router.post('/api/settings/library/addDirectory', async (req, res) => {
    const newDir = req.body.newDir;
    try {
        if(fs.existsSync(newDir)) {
            const insertSql = "INSERT INTO libraries(path) VALUES(?)";
            db.run(insertSql, [newDir]);
            res.json({success: true});
        }else {
            res.json({success: false});
        }
    } catch (error) {
        res.json({error: error});
    }    
})

// scan selected directory and files



export default router;

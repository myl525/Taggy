import express from 'express';
import path from 'path';
import sqlite3 from "sqlite3";

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

/**APIS */

export default router;
import express from 'express';
import { readdir } from 'fs/promises';
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import fs from 'fs';
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

router.get('/api/settings/scan', async (req, res) => {
    try {
        console.log('scanning...');
        const libraries = await getDataFromLibraries();
        await Promise.all(libraries.map(async (record) => {
            await scanDir(record.path);
        }))
        console.log('finish scanning...');
        res.json({success: true});
    } catch (error) {
        res.json({error});
    }
});

/** functions */
function getDataFromLibraries() {
    return new Promise((resolve, reject) => {
        const selectSql = 'SELECT path FROM libraries';
        db.all(selectSql, (err, rows) => {
            if(err) {
                reject(err);
            }else {
                resolve(rows);
            }
        })
    })
}

function selectDir(dir) {
    return new Promise((resolve, reject) => {
        const selectSqlCondition = 'SELECT id, path, mod_time FROM dirs WHERE path = ?';
        db.get(selectSqlCondition, [dir], async (err, row) => {
            if(err) {
                reject(err);
            }else {
                resolve(row);
            }
        });
    });
}
function updateDir(row) {
    return new Promise((resolve, reject) => {
        // this directory is already in the dirs, update mod time if needed
        const stats = fs.statSync(row.path);
        const newMtime = stats.mtime.toISOString();
        if(newMtime !== row['mod_time']) {
            // update mod_time
            // TODO why need to update mod time??
            const updateSql = 'UPDATE dirs SET mod_time = ? WHERE id = ?';
            db.run(updateSql, [newMtime, row.id], (err) => {
                if(err) {
                    reject(err);
                }else {
                    resolve();
                }
            });
        }
    })
}
function insertDir(dir) {
    return new Promise(async (resolve, reject) => {
        const insertSql = 'INSERT INTO dirs(path, parent_dir_id, mod_time) VALUES(?, ?, ?)'
        const stats = fs.statSync(dir);
        const parentDirPath = path.dirname(dir);
        const temp = await getDirId(parentDirPath);
        const parentDirId = temp ? temp : null;
        const modTime = stats.mtime.toISOString();
        db.run(insertSql, [dir, parentDirId, modTime], (err) => {
            if(err) {
                reject(err);
            }else {
                resolve();
            }
        });
    })
}

async function insertOrUpdateDir(dir) {
    const row = await selectDir(dir);
    if(row) {
        await updateDir(row);
    }else{
        await insertDir(dir);
    }
}

async function scanDir(dir) { 
    await insertOrUpdateDir(dir);

    // scan files in this directory
    const children = await readdir(dir, {withFileTypes: true});
    const exts = ['.mp4', '.avi', '.mov'];
    await Promise.all(
        children.map(async (child) => {
            if(child.isDirectory()) { 
                // if child is directory
                const childDir = path.resolve(dir, child.name); // generate full path
                await scanDir(childDir);
            }else { // if child is video file, add to the database
                //TODO support more format
                if(exts.includes(path.extname(child.name))) {
                    await scanFile(child.name, dir); 
                }
            }
        })
    )
}

// scan file
async function scanFile(file, dir) {
    // get parent dir id
    const dirId = await getDirId(dir);
    // quering file by its full path
    const fileRecord = await getFileRecord(file, dirId);
    // generate file's full path
    const fileFullPath = path.resolve(dir, file)
    // generate file's fingerprint
    const fingerprint = await generateFingerprint(fileFullPath);
    // get file's stats
    const fileStats = fs.statSync(fileFullPath);
    const [size, modTime] = [fileStats.size, fileStats.mtime.toISOString()];
    if(fileRecord) { 
        // file exists in the database
        // comparing mod time with existing record, if not the same, then recalculate file fingerprint and update
        const fileRecordModTime = fileRecord['mod_time'];
        if( fileRecordModTime !== modTime ) {
            // mod time are not same
            // update record in TABLE files , mod_time, size
            const updateFileRecordSql = 'UPDATE files SET mod_time = ?, size = ? WHERE id = ?';
            db.run(updateFileRecordSql, [modTime, fileStats.size, fileRecord.id]);
            // update TABLE files_fingerprints
            const updateFileFingerprintSql = 'UPDATE files_fingerprints SET fingerprint = ? WHERE id = ?';
            db.run(updateFileFingerprintSql, [fingerprint, fileRecord.id]);
            //TODO update TABLE video_files
        }
    }else { // file not exist in database (by full path)
        // query by fingerprints to see whether this file exists in database (from TABLE files)
        const fpFileRecords = await getFilesByFingerPrint(fingerprint);
        if(fpFileRecords) {
            // records exist (same fingerprint), check whether these files are missing in the file system
            const fpFileObjs = fpFileRecords.map((fpFileRecord) => {
                const obj = {};
                obj.id = fpFileRecord.id;
                obj.path = generateFileFullPath(fpFileRecord.basename, fpFileRecord['parent_dir_id']);
                return obj;
            });
            const missingFileObjs = fpFileObjs.filter((fpFileObj) => {
                return !fs.existsSync(fpFileObj.path);
            });
            if(missingFileObjs.length === 1) {
                // only one file is missing in the file system, consider this file as the renamed file of the missing one
                // update its path (basename, parent_dir_id)
                const updateMissingFileSql = 'UPDATE files SET basename = ?, parent_dir_id = ? WHERE id = ?';
                db.run(updateMissingFileSql, [file, dirId, missingFileObjs[0].id]);
            }else {
                // TODO delete all missing records?
                // none missing or too many missing, treat this file as a new file
                // create new record in TABLE files, files_fingerprints
                createNewFileRecords(file, dirId, size, modTime, 'md5', fingerprint);
                // TODO create record for video_files
            }
        }else {
            // file not exist, new file
            // create record for TABLE files
            createNewFileRecords(file, dirId, size, modTime, 'md5', fingerprint);
            //TODO create record for video_files
        }
    }
}

// create new file records in TABLE files, files_fingerprints
function createNewFileRecords(basename, parentDirId, size, modTime, type, fingerprint) {
    const insertNewFileSql = 'INSERT INTO files(basename, parent_dir_id, size, mod_time) VALUES(?, ?, ?, ?)';
    db.run(insertNewFileSql, [basename, parentDirId, size, modTime], function (err) {
        if(err) {
            console.log(err);
        }else {
            const insertSql = 'INSERT INTO files_fingerprints(file_id, type, fingerprint) VALUES(?, ?, ?)';
            db.run(insertSql, [this.lastID, type, fingerprint]);
        }
    });
}
// get directory id from TABLE dirs
function getDirId(dir) {
    return new Promise((resolve, reject) => {
        const selectDirIdSql = 'SELECT id FROM dirs WHERE path = ?';
        db.get(selectDirIdSql, [dir], (err, row) => {
            if(err) {
                reject(err);
            }else {
                resolve(row ? row.id : undefined);
            }
        })
    })
}

// get file record from TABLE files
function getFileRecord(file, dirId) {
    return new Promise((resolve, reject) => {
        const selectFileSql = 'SELECT * FROM files WHERE basename = ? AND parent_dir_id = ?';
        db.get(selectFileSql, [file, dirId], (err, row) => {
            if(err) {
                reject(err);
            }else {
                resolve(row);
            }
        })
    })
}

// get files from TABLE files and files_fingerprints by fingerprint
function getFilesByFingerPrint(fingerprint) {
    return new Promise(async (resolve, reject) => {
        const selectByFpSql = `SELECT id, basename, parent_dir_id FROM files 
                        INNER JOIN files_fingerprints on files.id = files_fingerprints.file_id 
                        WHERE files_fingerprints.fingerprint = ?`;
        db.all(selectByFpSql, [fingerprint], (err, rows) => {
            if(err) {
                reject(err);
            }else {
                resolve(rows);
            }
        })
    })
}
// generate full path of a file
function generateFileFullPath(basename, parentDirId) {
    const selectSql = 'SELECT path FROM dirs WHERE id = ?';
    db.get(selectSql, [parentDirId], (err, row) => {
        if(err) {
            console.log(err);
        }else {
            return path.resolve(row.path, basename);
        }
    })
}
// generate fingerprint for file
async function generateFingerprint(path, algo='md5') {
    const hashFunc = createHash(algo);   

    const contentStream = createReadStream(path);
    const updateDone = new Promise((resolve, reject) => {
        contentStream.on('data', (data) => hashFunc.update(data));
        contentStream.on('close', resolve);
        contentStream.on('error', reject);
    });

    await updateDone;
    const result =  await hashFunc.digest('hex');       // will return hash, formatted to HEX
    return result;
}

//TODO create video file stats
function generateVideoFileStats(file) {

}

export default router;
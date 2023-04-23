import express from 'express';
import { readdir } from 'fs/promises';
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import fs from 'fs';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
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
        const libraries = await getDirsFromLibraries();
        await Promise.all(libraries.map(async (record) => {
            return scanDir(record.path);
        }))
        console.log('finish scanning...');
        res.json({success: true});
    } catch (error) {
        res.json({error});
    }
});

/** functions */
function getDirsFromLibraries() {
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

function selectDir(dirPath) {
    return new Promise((resolve, reject) => {
        const selectSqlCondition = 'SELECT id, path, mod_time FROM dirs WHERE path = ?';
        db.get(selectSqlCondition, [dirPath], async (err, row) => {
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
        }else {
            resolve();
        }
    })
}
function insertDir(dirPath) {
    return new Promise(async (resolve, reject) => {
        // this dir does not exist in the database, add it.
        const insertSql = 'INSERT INTO dirs(path, parent_dir_id, mod_time) VALUES(?, ?, ?)'
        const stats = fs.statSync(dirPath);
        const parentDirPath = path.dirname(dirPath);
        let temp;
        if(parentDirPath && parentDirPath !== '.') {
            temp = await getDirId(parentDirPath);
        }
        const parentDirId = temp ? temp : null;
        const modTime = stats.mtime.toISOString();
        db.run(insertSql, [dirPath, parentDirId, modTime], (err) => {
            if(err) {
                reject(err);
            }else {
                resolve();
            }
        });
    })
}

async function insertOrUpdateDir(dirPath) {
    const row = await selectDir(dirPath);
    if(row) {
        await updateDir(row);
    }else{
        await insertDir(dirPath);
    }
}

async function scanDir(dirPath) {
    await insertOrUpdateDir(dirPath);
    // scan files in this directory
    const children = await readdir(dirPath, {withFileTypes: true});
    const exts = ['.mp4', '.avi', '.mov'];
    await Promise.all(
        children.map(async (child) => {
            if(child.isDirectory()) { 
                // if child is directory
                const childDirPath = path.resolve(dirPath, child.name); // generate full path
                await scanDir(childDirPath);
            }else { // if child is video file, add to the database
                //TODO support more format
                if(exts.includes(path.extname(child.name))) {
                    await scanFile(child.name, dirPath);
                }
            }
        })
    );
}

// scan file
async function scanFile(fileName, dirPath) {
    // get parent dir id
    const dirId = await getDirId(dirPath);
    // quering file by its full path
    const fileRecord = await getFileRecord(fileName, dirId);
    // generate file's full path
    const fileFullPath = path.resolve(dirPath, fileName)
    // generate file's fingerprint
    const fingerprint = await generateFingerprint(fileFullPath);
    // get file's stats
    const fileStats = fs.statSync(fileFullPath);
    const [size, modTime] = [fileStats.size, fileStats.mtime.toISOString()];
    if(fileRecord) { 
        // file exists in the database
        // comparing mod time with existing record, if not the same, then recalculate file fingerprint and update
        const fileRecordModTime = fileRecord['mod_time'];
        if(fileRecordModTime !== modTime) {
            // mod time are not same
            // update record in TABLE files , mod_time, size
            const updateFileRecordSql = 'UPDATE files SET mod_time = ?, size = ? WHERE id = ?';
            db.run(updateFileRecordSql, [modTime, fileStats.size, fileRecord.id]);
            // update TABLE files_fingerprints
            const updateFileFingerprintSql = 'UPDATE files_fingerprints SET fingerprint = ? WHERE id = ?';
            db.run(updateFileFingerprintSql, [fingerprint, fileRecord.id]);
            // update TABLE video_files
            await createOrUpdateVideoFilesRecord(fileFullPath, fileRecord.id, 'update');
        }
    }else { // file not exist in database (by full path)
        // query by fingerprints to see whether this file exists in database (from TABLE files)
        const fpFileRecords = await getFilesByFingerPrint(fingerprint);
        if(fpFileRecords) {
            // records exist (same fingerprint), check whether these files are missing in the file system
            const missingFiles= fpFileRecords.filter((fpFileRecord) => {
                return !fs.existsSync(fpFileRecord.path);
            });
            if(missingFiles.length === 1) {
                const missingFile = missingFiles[0];
                // only one file is missing in the file system, consider this file as the renamed file of the missing one
                // update its path (basename, parent_dir_id)
                const updateMissingFileSql = 'UPDATE files SET basename = ?, parent_dir_id = ? WHERE id = ?';
                db.run(updateMissingFileSql, [fileName, dirId, missingFile.id]);
                // update video file record
                await createOrUpdateVideoFilesRecord(fileFullPath, missingFile.id, 'update');
            }else {
                // TODO delete all missing records?
                // none missing or too many missing, treat this file as a new file
                // create new record in TABLE files, files_fingerprints
                const newFileRecordId = await createNewFileRecords(fileName, dirId, size, modTime, 'md5', fingerprint);
                // create record for video_files
                await createOrUpdateVideoFilesRecord(fileFullPath, newFileRecordId, 'insert');
            }
        }else {
            // file not exist, new file
            // create record for TABLE files
            await createNewFileRecords(fileName, dirId, size, modTime, 'md5', fingerprint);
            // create record for video_files
            //await createOrUpdateVideoFilesRecord(file, id, 'insert');
        }
    }
}

// create new file records in TABLE files, files_fingerprints
function createNewFileRecords(basename, parentDirId, size, modTime, type, fingerprint) {
    return new Promise((resolve, reject) => {
        const insertNewFileSql = 'INSERT INTO files(basename, parent_dir_id, size, mod_time) VALUES(?, ?, ?, ?)';
        db.run(insertNewFileSql, [basename, parentDirId, size, modTime], function (err) {
            if(err) {
                reject(err);
            }else {
                const insertSql = 'INSERT INTO files_fingerprints(file_id, type, fingerprint) VALUES(?, ?, ?)';
                db.run(insertSql, [this.lastID, type, fingerprint]);
                resolve(this.lastID);
            }
        });  
    });
}
// get directory id from TABLE dirs
function getDirId(dirPath) {
    return new Promise((resolve, reject) => {
        const selectDirIdSql = 'SELECT id FROM dirs WHERE path = ?';
        db.get(selectDirIdSql, [dirPath], (err, row) => {
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
        const selectByFpSql = `SELECT files.id, basename, path FROM files 
                        INNER JOIN files_fingerprints on files.id = files_fingerprints.file_id 
                        INNER JOIN dirs on dirs.id = files.parent_dir_id
                        WHERE files_fingerprints.fingerprint = ?`;
        db.all(selectByFpSql, [fingerprint], (err, rows) => {
            if(err) {
                reject(err);
            }else {
                const ret = rows.map((row) => {
                    const obj = {};
                    obj.id = row.id;
                    obj.path = path.resolve(row.path, row.basename);
                    return obj;
                })
                resolve(ret);
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

function generateVideoFileStats(file) {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(file, (err, metadata) => {
            if(err) {
                reject(err);
            }else {
                const rawData = metadata.streams[0];
                const totalSeconds = rawData.duration;
                const totalMinutes = Math.floor(totalSeconds / 60);
                const seconds = totalSeconds % 60;
                const minutes = totalMinutes % 60;
                const hours = Math.floor(totalMinutes / 60);
               
                const duration = `${hours>0?hours+':':''}${minutes>0?minutes:'0'}:${seconds.toFixed(0)}`;
                const width = rawData.width;
                const height = rawData.height;
                const rawFps = rawData.r_frame_rate.split('/');
                const fps = (Number(rawFps[0]) / Number(rawFps[1])).toFixed(2);
                resolve({duration, width, height, fps});
            }
        })
    })
}

function createOrUpdateVideoFilesRecord(filePath, fileId, operation) {
    return new Promise(async (resolve, reject) => {
        const stats = await generateVideoFileStats(filePath);
        const format = path.extname(filePath).split('.')[1];
        
        if(operation === 'insert') {
            const insertSql = `INSERT INTO video_files(file_id, duration, format, width, height, fps) VALUES(?, ?, ?, ?, ?, ?)`;
            const paras = [fileId, stats.duration, format, stats.width, stats.height, stats.fps];
            db.run(insertSql, paras, (err) => {
                if(err) {
                    reject(err);
                }else {
                    resolve();
                }
            });
        }else if(operation === 'update') {
            const updateSql = `UPDATE video_files SET duration = ?, format = ?, width = ?, height = ?, fps = ? WHERE file_id = ?`;
            const paras = [stats.duration, format, stats.width, stats.height, stats.fps, fileId];
            db.run(updateSql, paras, (err) => {
                if(err) {
                    reject(err);
                }else {
                    resolve();
                }
            });
        }
    })
}

export default router;
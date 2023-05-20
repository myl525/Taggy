import sqlite3 from "sqlite3";
const sqlite = sqlite3.verbose();
const dbPath = './taggy.sqlite';
const db = new sqlite.Database(dbPath, sqlite.OPEN_READWRITE, (err) => {
    if(err) {
        console.log(err);
    }

    console.log("Connected to the Taggy database...");
})

// command for creating tables
const dirsSql = `CREATE TABLE IF NOT EXISTS dirs(id INTEGER PRIMARY KEY, path, parent_dir_id, mod_time, created_at)`;
const filesSql = `CREATE TABLE IF NOT EXISTS files(id INTEGER PRIMARY KEY, basename, parent_dir_id, size, mod_time, created_at)`;
const videoFilesSql = `CREATE TABLE IF NOT EXISTS video_files(file_id INTEGER PRIMARY KEY, duration, format, fps, width, height)`;
const filesFingerprintsSql = `CREATE TABLE IF NOT EXISTS files_fingerprints(file_id INTEGER PRIMARY KEY, type, fingerprint)`;
const tagsSql = `CREATE TABLE IF NOT EXISTS tags(id INTEGER PRIMARY KEY, name UNIQUE)`;
const videoTagsSql = `CREATE TABLE IF NOT EXISTS videos_tags(video_id, tag_id, PRIMARY KEY(video_id, tag_id))`;
const librariesSql = `CREATE TABLE IF NOT EXISTS libraries(id INTEGER PRIMARY KEY, path)`;

// initialize database
db.run(dirsSql);
db.run(filesSql);
db.run(videoFilesSql);
db.run(filesFingerprintsSql);
db.run(tagsSql);
db.run(videoTagsSql);
db.run(librariesSql);


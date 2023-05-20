import sqlite3 from "sqlite3";
const sqlite = sqlite3.verbose();

const db = new sqlite.Database('./taggy.sqlite', sqlite.OPEN_READWRITE, (err) => {
    if(err) {
        console.log(err);
    }else {
        console.log("Connected to the Taggy database...");
    }
})

/** queries */
// add selected directory to database
// const addDirectorySql = ({path, parentDirId, modTime}) => {
//     const sql = "INSERT INTO dirs(path, parent_dir_id, mod_time) VALUES(?, ?, ?)";
//     db.run(sql, [path, parentDirId, modTime]);
// }



// addDirectorySql({path: "testpath", parentDirId: "testParent", modTime: "testTime"});
// db.get("SELECT * FROM dirs WHERE id=1", (err, rows) => {
//     console.log(rows);
// })

 //db.run('DELETE FROM libraries WHERE id=1')

 function getDirId(dir) {
    return new Promise((resolve, reject) => {
        const selectDirIdSql = 'SELECT id FROM dirs WHERE path = ?';
        db.get(selectDirIdSql, [dir], (err, row) => {
            if(err) {
                reject(err);
            }else {
                resolve(row.id);
            }
        })
    })
}
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

// getFileRecord('test.txt', 2)
//     .then((row) => {console.log(row)})
//     .catch((err) => {console.log(err)});
// const selectByFpSql = `SELECT files.id, basename, path FROM files 
// INNER JOIN files_fingerprints on files.id = files_fingerprints.file_id 
// INNER JOIN dirs on dirs.id = files.parent_dir_id`;
const selectSql = `SELECT COUNT(*) AS numTags FROM videos_tags WHERE video_id = ? GROUP BY video_id`
db.get(selectSql, ['1'], (err, row) => {
    console.log(row);
})
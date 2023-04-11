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
const addDirectorySql = ({path, parentDirId, modTime}) => {
    const sql = "INSERT INTO dirs(path, parent_dir_id, mod_time) VALUES(?, ?, ?)";
    db.run(sql, [path, parentDirId, modTime]);
}



// addDirectorySql({path: "testpath", parentDirId: "testParent", modTime: "testTime"});
// db.get("SELECT * FROM dirs WHERE id=1", (err, rows) => {
//     console.log(rows);
// })

 db.run("DELETE FROM libraries WHERE id=1");


export {addDirectorySql};

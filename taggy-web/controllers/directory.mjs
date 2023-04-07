import express from 'express';
import { readdir } from 'fs/promises';
import path from 'path';
const router = express.Router();

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
        if(childDirectory.length === 0) {
            res.json({error: 'No such file or directory'});
        }else {
            res.json({children: childDirectory});
        }
    } catch (error) {
        res.json({error: error});
    }
    
});

export default router;

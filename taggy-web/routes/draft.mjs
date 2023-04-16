import fs from 'fs';
import path from 'path';
import { readdir } from 'fs/promises';

fs.stat('./tests.txt', (err, data) => {
    if(err) {
        console.log(err);
    }
    const [ size, mTime ] = [data.size, data.mtime.toISOString()];
    console.log(size);
    console.log(mTime);
})

// const dir = '/Users/castielliu/Downloads';
// const file = 'stash-go.sqlite';
// console.log(path.resolve(dir, file));

const dir = '/Users/castielliu/Documents/temp';
const data = await readdir(dir, {withFileTypes:true});
console.log('------new-------');
// const videoFiles = data.filter((ele) => {
//     return path.extname(ele.name) === 'mp4';
// })
console.log(data.map((ele) => {
    return path.extname(ele.name);
}))
console.log();

import express from 'express';
import homeAPI from './routes/home.mjs';
import libraryAPI from './routes/settings/library.mjs';
import scanAPI from './routes/settings/scan.mjs';
import videosAPI from './routes/videos.mjs';
import tagsAPI from './routes/tags.mjs';
import bodyParser from 'body-parser';

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use('/', homeAPI);
app.use('/', libraryAPI);
app.use('/', scanAPI);
app.use('/', videosAPI);
app.use('/', tagsAPI);

app.listen(8080, () => {
    console.log('server is listening on port 8080...');
});
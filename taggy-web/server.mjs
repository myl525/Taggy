import express from 'express';
import libraryAPI from './routes/settings/library.mjs';
import scanAPI from './routes/settings/scan.mjs'
import bodyParser from 'body-parser';

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use('/', libraryAPI);
app.use('/', scanAPI);

app.listen(8080, () => {
    console.log('server is listening on port 8080...');
});
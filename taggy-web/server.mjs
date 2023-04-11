import express from 'express';
import api from './controllers/directory.mjs';
import bodyParser from 'body-parser';

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use('/', api);

app.listen(8080, () => {
    console.log('server is listening on port 8080...');
});
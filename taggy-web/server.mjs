import express from 'express';
const app = express();

// routers
import api from './controllers/directory.mjs';

app.use('/', api);

app.listen(8080);
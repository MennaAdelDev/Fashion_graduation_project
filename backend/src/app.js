const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const env = require('./config/env');


const app = express();

const origins = env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN.split(',').map((origin) => origin.trim());

app.use(helmet());
app.use(cors({ origin: origins }));
app.use(express.json({ limit: '1mb' }));


module.exports = app;

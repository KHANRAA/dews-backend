const winston = require('winston');
const express = require('express');
const app = express();
const multer = require('multer');
const bodyParser = require('body-parser');
const chalk = require('chalk');

require('./startup/logging');
require('./startup/db')();
require('./startup/routes')(app);
require('./startup/validation')();
require('./startup/config')();
require('./startup/validation')();

const imageFileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads');
    },
    filename: (req, file, cb) => {
        cb(null, new Date().toISOString() + '-' + file.originalname);
    }
});

const imageFilter = (req, file, cb) => {
    (file.mimetype === 'image/png' ||
        file.mimetype === 'image/jpg' ||
        file.mimetype === 'image/jpeg') ?
        cb(null, true) :
        cb(null, false);
};

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(multer({ storage: imageFileStorage, fileFilter: imageFilter }).single('galleyImage'));
app.use(express.static(__dirname + 'public'));
app.use('/', (req, res, next) => {
    res.setHeader('Access-Control-Origin', '*');
    res.setHeader('Access-Control_Methods', 'GET,POST,PUT,PATCH,DELETE');
    res.setHeader('Access-Control-Headers', 'Content-Type,Authorization');
    next()
});

process.on('unhandledRejection', (ex) => {
    throw ex;
});

if (app.get('env') !== 'production') {
}


const port = process.env.PORT || 3000;
app.listen(port, () => winston.info(`Listening on port ${ port }...`));

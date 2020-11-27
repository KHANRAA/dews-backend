const express = require('express');
const app = express();
const morgan = require('morgan');
// const config = require('config');
const bodyParser = require('body-parser');
const winston = require('winston');
const chalk = require('chalk');

require('./startup/db')();
require('./startup/routes')(app);
require('./startup/validation')();

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));

if (app.get('env') === 'development' || undefined) {
    app.use(morgan('dev'));
    winston.info('Morgan Enabled....');
}
app.use(express.static(__dirname + 'public'));

app.use('/', (req, res, next) => {
    res.setHeader('Access-Control-Origin', '*');
    res.setHeader('Access-Control_Methods', 'GET,POST,PUT,PATCH,DELETE');
    res.setHeader('Access-Control-Headers', 'Content-Type,Authorization');
    next()
});


const port = process.env.PORT || 3000;
app.listen(port, () => winston.info(`Listening on port ${ port }...`));
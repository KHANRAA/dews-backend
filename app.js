const winston = require('winston');
const express = require('express');
const app = express();
// const morgan = require('morgan');
const bodyParser = require('body-parser');
const chalk = require('chalk');

require('./startup/logging');
require('./startup/db')();
require('./startup/routes')(app);
require('./startup/validation')();
require('./startup/config')();
require('./startup/validation')();


app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));

if (app.get('env') !== 'production') {
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

const mongoose = require('mongoose');
const winston = require('winston');
const chalk = require('chalk');

module.exports = () => {
    mongoose.connect('db', {
        useNewUrlParser: true,
        useFindAndModify: false,
        useCreateIndex: true,
        useUnifiedTopology: true
    }).then(() => console.log(chalk.cyan('Connected to mongodb...')));
};

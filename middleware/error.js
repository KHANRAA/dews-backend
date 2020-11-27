const winston = require('winston');

module.exports = (err, req, res, next) => {
    winston.error(err.message, err);
    winston.warn(err.message, err);
    winston.info(err.message, err);
    winston.verbose(err.message, err);
    winston.debug(err.message, err);
    winston.silly(err.message, err);
    //error
    //warn
    //info
    //verbose
    //debug
    //silly
    res.status(500).send(err.message || 'Something went wrong ...');
}
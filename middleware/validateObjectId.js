const mongoose = require('mongoose');
const chalk = require('chalk');

module.exports = async (req, res, next) => {
    console.log(chalk.red(`id from req in validate oobjectId is : ${ req.body.id }`));
    if (!mongoose.Types.ObjectId.isValid(req.body.id)) return res.status(400).json({ status: 401, data: 'Invalid object id...' });
    next();
}

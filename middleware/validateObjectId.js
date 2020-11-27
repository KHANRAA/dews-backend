const mongoose = require('mongoose');
module.exports = async (req, res, next) => {
    if (!mongoose.Types.ObjectID.isValid(req.body.id)) return res.json({ status: 400, data: 'Invalid object id...' });
    next();
}
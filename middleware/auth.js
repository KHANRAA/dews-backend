const jwt = require('jsonwebtoken');
// const config = require('config');
const { User } = require('../models/user');

module.exports = async (req, res, next) => {
    const token = req.header('magic-token');
    if (!token) return res.json({ status: 401, data: 'Access denied, no token provided...' });

    try {
        req.user = await jwt.verify(token, 'secretKey');
        const dbUser = await User.findOne({ _id: req.user._id });
        if (!dbUser || !dbUser.isActive) return res.json({ status: 401, data: 'User not exists or unauthorized ...' }); //todo redirect
        req.user = dbUser;
        next();
    } catch (e) {
        return res.json({ status: 401, data: 'Invalid token...' });
    }
}
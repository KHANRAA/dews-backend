module.exports = (req, res, next) => {
    if (req.user.role !== 'admin') return res.json({
        status: 403, data:
            'Denied...'
    });
    next();
}
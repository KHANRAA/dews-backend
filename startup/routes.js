const express = require('express');
const authController = require('../controllers/authController');
const blogController = require('../controllers/blogController');
const contactController = require('../controllers/contactController');
const galleryController = require('../controllers/gallleryController');
const campaignController = require('../controllers/campaignController');

module.exports = (app) => {
    app.use('/api/auth', authController);
    app.use('/api/blog', blogController);
    app.use('/api/contact', contactController);
    app.use(('/api/gallery'), galleryController);
    app.use('/api/campaign', campaignController);

}

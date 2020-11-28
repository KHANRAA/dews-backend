const fs = require('fs');
const path = require('path');

const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const chalk = require('chalk');

const { Storage } = require('@google-cloud/storage');
const { Gallery, validateGalleryImageUploadSchema } = require('../models/gallery');

const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const validateObjectId = require('../middleware/validateObjectId');

router.get('/', (req, res, next) => {
    res.status(200).send('Hi, From Gallery Controller...');
});


router.post('/submit', auth, admin, async (req, res, next) => {
    const user = req.user;
    const joiValidate = await validateGalleryImageUploadSchema(req.body);
    if (joiValidate.error) return sendErrorResponse(res, joiValidate.error.details[0].message);
    const galleryPhoto = new Gallery({
        title: req.body.title,
        imageUri: req.body.imageUrl,
        uploadedBy: user,
        tags: req.body.tags,

    });
    await galleryPhoto.save().then(() => {
        sendSuccessResponse(res, 'Successfully Uploaded the images...');
    }).catch((err) => {
        next(err);
    });

});

router.put('/upload', auth, admin, upload.single('photo'), async (req, res, next) => {

    if (!req.file) {
        console.log(chalk.red('No file received..'));
        sendErrorResponse(res, 'No File received for upload...');
    }
    const tempUploadPath = req.file.path;
    const storage = new Storage({ keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS });
    const bucketName = 'gallery_bucket';
    await storage.bucket(bucketName).upload(tempUploadPath, {
        gzip: true,
        // By setting the option `destination`, you can change the name of the
        // object you are uploading to a bucket.
        metadata: {
            // Enable long-lived HTTP caching headers
            // Use only if the contents of the file will never change
            // (If the contents will change, use cacheControl: 'no-cache')
            cacheControl: 'public, max-age=31536000',
        },
    }).then(() => {
        console.log(chalk.green()`${ tempUploadPath.toString() } uploaded to ${ bucketName }.`);
        sendSuccessResponse(res, 'Image Upload successful...');
    }).catch((err) => {
        next(err);
    }).finally(() => {
        fs.unlink(tempUploadPath, err => {
            err ? next(err) : '';
        })
    });


});


router.put('/like', auth, validateObjectId, async (req, res, next) => {
    const user = req.user;
    const galleyPhoto = await Gallery.findOne({ _id: req.body.id });
    if (!galleyPhoto) sendErrorResponse(res, `Photo not exists please recheck ... id: ${ req.body.id }`);
    if (galleyPhoto.likedBy.some(userObj => userObj._id === user._id)) sendErrorResponse(res, 'Already Liked ...');
    galleyPhoto.likedBy.push(user);
    await galleyPhoto.save().then(success => { return sendSuccessResponse(res, `${ JSON.stringify(success) }`);}).catch(err => {
        next(err);
    });
});

router.delete('/delete', auth, admin, validateObjectId, async (req, res, next) => {
    await Gallery.findOneAndDelete({ _id: req.body.id }).then(result => {
        return sendSuccessResponse(res, `${ JSON.stringify(result) }`);
    }).catch(err => {
        next(err);
    });

});


const sendSuccessResponse = (res, responseMessage) => {
    res.json({ status: 200, data: responseMessage });
};

const sendRedirectResponse = (res, responseMessage) => {
    res.json({ status: 302, data: responseMessage });
};

const sendErrorResponse = (res, error) => {
    res.json({ status: 400, data: error });
};
module.exports = router;

const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const chalk = require('chalk');

const { Storage } = require('@google-cloud/storage');
const { GalleryPhoto, validateGalleryImageUploadSchema } = require('../models/gallery');

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
    const galleryPhoto = new GalleryPhoto({
        title: req.body.title,
        imageUri: req.body.imageUrl,
        uploadedBy: user,
        tags: req.body.tags,

    });
    await galleryPhoto.save().then(() => {
        sendSuccessResponse(res, 'Successfully Uploaded the images...');
    }).catch((err) => {
        sendErrorResponse(res, 'Something went wrong when saving the image ...');
    });

});

router.put('/upload', auth, admin, upload.single('photo'), async (req, res, next) => {

    if (!req.file) {
        console.log(chalk.red('No file received..'));
        sendErrorResponse(res, 'No File received for upload...');
    }
    const tempUploadPath = req.file.path;
    if (path.extname(req.file.originalname).toLowerCase() === '.png' || path.extname(req.file.originalname).toLowerCase() === '.jpeg') {
        const storage = new Storage({ keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS });
        const bucketName = 'gallery_bucket';
        const filename =
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
            });
        console.log(chalk.green()`${ filename } uploaded to ${ bucketName }.`);
        sendSuccessResponse(res, 'Image Upload successful...');
    } else {
        fs.unlink(tempUploadPath, err => {
            sendErrorResponse(res, 'File not in jpeg or png format');
        })
    }

});


router.put('/like', auth, validateObjectId, async (req, res, next) => {
    const user = req.user;
    const galleyPhoto = await GalleryPhoto.findOne({ _id: req.body.id });
    if (!galleyPhoto) sendErrorResponse(res, `Photo not exists please recheck ... id: ${ req.body.id }`);
    if (galleyPhoto.likedBy.some(userObj => userObj._id === user._id)) sendErrorResponse(res, 'Already Liked ...');
    galleyPhoto.likedBy.push(user);
    await galleyPhoto.save().then(success => { sendSuccessResponse(res, `${ JSON.stringify(success) }`);}).catch(err => {
        sendErrorResponse(res, err.message);
    });
});

router.delete('/delete', auth, admin, validateObjectId, async (req, res, next) => {
    await GalleryPhoto.findOneAndDelete({ _id: req.body.id }).then(result => {
        sendSuccessResponse(res, `${ JSON.stringify(result) }`);
    }).catch(err => {
        sendErrorResponse(res, err.message);
    });

});


sendSuccessResponse = (res, responseMessage) => {
    return res.json({ status: 200, data: responseMessage });
};

sendRedirectResponse = (res, responseMessage) => {
    return res.json({ status: 302, data: responseMessage });
};

sendErrorResponse = (res, error) => {
    return res.json({ status: 400, data: error });
};

module.exports = router;

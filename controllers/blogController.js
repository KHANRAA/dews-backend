const express = require('express');
const router = express.Router();
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const { Blog, validateBlogSchema } = require('../models/blog');
const { TempUploads, validateTempUploadDeleteSchema } = require('../models/upload');
const { Comment, validateCommentSchema } = require('../models/comment');
const { Storage } = require('@google-cloud/storage');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const validateObjectId = require('../middleware/validateObjectId');

router.get('/', (req, res, next) => {
    return res.json({ status: 200, data: 'Hi  from blog Controller' });
});
router.get('/blogs', async (req, res, next) => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr",
        "May", "Jun", "Jul", "Aug",
        "Sep", "Oct", "Nov", "Dec"];
    const blogs = await Blog.aggregate([
        {
            $lookup: {
                from: 'users',
                foreignField: '_id',
                localField: 'author',
                as: 'author',
            },

        }, {
            $project: {
                blogId: '$_id',
                isHighlight: 1,
                likedBy: { $size: '$likedBy' },
                author: { id: '$_id', name: 1, avatarImageUrl: 1 },
                imageUrl: 1,
                content: 1,
                title: 1,
                createdAt: { $convert: { input: '$updatedAt', to: 'date' } },
                tags: 1,
            }
        },
        {
            $sort: {
                createdAt: -1
            }
        }
    ]);
    const blogsResult = [...blogs];
    blogsResult.map(blog => {
        blog.createdAt = new Date(blog.createdAt).getDate() + 'th ' + monthNames[new Date(blog.createdAt).getMonth()];
    })
    return res.json(blogsResult);

});

router.post('/add', auth, admin, async (req, res, next) => {
    const user = req.user;
    const joiValidate = await validateBlogSchema(req.body);
    if (joiValidate.error) return sendErrorResponse(res, joiValidate.error.details[0].message);
    const tempUpload = await TempUploads.findById(req.body.imageUrl);
    if (!tempUpload) return sendErrorResponse(res, { status: 404, data: 'Temp Upload Not Exists ....' });
    const blog = new Blog({
        title: req.body.title,
        author: user,
        content: req.body.content,
        imageUrl: tempUpload.publicUrl,
        isHighlight: req.body.isHighlight,
        tags: req.body.tags,
    });
    await blog.save().then(result => {
        console.log(chalk.green(JSON.stringify(result)));
        return sendSuccessResponse(res, { data: result });
    }).catch(err => {
        console.log(chalk.redBright(err.message));
        sendErrorResponse(err.message);
    });

});

router.put('/like', auth, validateObjectId, async (req, res, next) => {
    const user = req.user;
    const blog = await Blog.findOne({ _id: req.body.id });
    if (!blog) sendErrorResponse(res, `Blog not exists please recheck ... id: ${ req.body.id }`);
    if (user.likes.some(userObj => userObj._id === req.body.id)) return sendSuccessResponse(res, 'Already Liked ...');
    blog.likedBy.push(user);
    await blog.save().then(success => { return sendSuccessResponse(res, `${ JSON.stringify(success) }`);}).catch(err => {
        next(err);
    });
});

router.put('/comment', auth, validateObjectId, async (req, res, next) => {
    const user = req.user;
    const joiValidate = await validateCommentSchema(req.body);
    if (joiValidate.error) return sendErrorResponse(res, joiValidate.error.details[0].message);
    const blog = await Blog.findOne({ _id: req.body.id });
    if (!blog) sendErrorResponse(res, `Blog not exists please recheck ... id: ${ req.body.id }`);
    const comment = new Comment({
        comment: req.body.comment,
        commentBy: user,
    })
    await comment.save().then((commentRes) => {
        console.log(chalk.cyan(JSON.stringify(commentRes)));
        return sendSuccessResponse(res, JSON.stringify(commentRes));
    }).catch();

});

router.post('/upload', auth, admin, async (req, res, next) => {
    if (!req.file) {
        console.log(chalk.red('No file received..'));
        throw new Error('No image provided.....');
    }
    console.log(chalk.green('in Uopload...'));
    const tempUploadPath = req.file.path;
    const storage = new Storage({ keyFilename: '/Volumes/workplace/personal/dews-backend/config/inside-ngo-0af11d83ca0e.json' }); // to dremove...
    const bucketName = 'dews_blog_images';
    const bucket = storage.bucket(bucketName);
    // await storage.bucket(bucketName).makePublic({});
    await bucket.upload(tempUploadPath, {
        gzip: true,
        // By setting the option `destination`, you can change the name of the
        // object you are uploading to a bucket.
        metadata: {
            // Enable long-lived HTTP caching headers
            // Use only if the contents of the file will never change
            // (If the contents will change, use cacheControl: 'no-cache')
            cacheControl: 'public, max-age=31536000',
        },
    }).then(async (saveResult) => {
        // console.log(chalk.green(`${ tempUploadPath.toString() } uploaded to ${ bucketName }.
        // with result https://storage.googleapis.com/${ bucketName }/${ tempUploadPath.substr(15, tempUploadPath.length) } }`));
        saveResult[0].makePublic().then(() => {
        });
        const tempUpload = new TempUploads({
            fileName: tempUploadPath.substr(15, tempUploadPath.length),
            publicUrl: `https://storage.googleapis.com/${ bucketName }/${ tempUploadPath.substr(15, tempUploadPath.length) }`.trim()
        })
        await tempUpload.save().then((saveRes) => {
            return res.json({ id: saveRes._id.toString() });
        })
    }).catch((err) => {
        next(err);
    }).finally(() => {
        fs.unlink(tempUploadPath, err => {
            err ? next(err) : '';
        })
    });


});


router.delete('/upload', auth, admin, async (req, res, next) => {
    const joiValidate = await validateTempUploadDeleteSchema(req.body);
    if (joiValidate.error) return sendErrorResponse(res, joiValidate.error.details[0].message);
    const storage = new Storage({ keyFilename: '/Volumes/workplace/personal/dews-backend/config/inside-ngo-0af11d83ca0e.json' });
    const bucketName = 'dews_blog_images';
    const bucket = storage.bucket(bucketName);
    // await storage.bucket(bucketName).makePublic({});
    const tempUpload = await TempUploads.findById(req.body.id);

    if (!tempUpload) return sendSuccessResponse(res, { status: 404, data: 'Temp Upload Not Exists ....' });
    await bucket.file(tempUpload.fileName).delete().then(async () => {
        await TempUploads.deleteOne({ _id: req.body.id });
        sendSuccessResponse(res, { status: 200, data: 'Temp Upload Deleted Successfully ....' });
    });

});


router.delete('/comment', auth, validateObjectId, async (req, res, next) => {
    const user = req.user;
    const comment = await Comment.findOne({ _id: req.body.id });
    if (!comment) sendErrorResponse(res, 'Comment Not Exists...');
    if (comment.commentBy._id !== user._id || user.role !== 'Admin') sendErrorResponse(res, `You don't have access to remove the comment.`);
    await Comment.findOneAndDelete({ _id: req.body.id })
        .then(() => { return sendSuccessResponse(res, 'Successfully deleted comment'); })
        .catch(err => {sendErrorResponse(res, err.message)});
});

router.delete('/delete', auth, admin, validateObjectId, async (req, res, next) => {
    await Blog.findOneAndDelete({ _id: req.body.id }).then(result => {
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
    res.status(400).json({ status: 400, data: error });
};

module.exports = router;

const express = require('express');
const router = express.Router();
const chalk = require('chalk');

const { Blog, validateBlogSchema } = require('../models/blog');
const { Comment, validateCommentSchema } = require('../models/comment');

const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const validateObjectId = require('../middleware/validateObjectId');

router.get('/', (req, res, next) => {
    return res.json({ status: 200, data: 'Hi  from blog Controller' });
});

router.post('/add', auth, async (req, res, next) => {
    const user = req.user;
    const joiValidate = await validateBlogSchema(req.body);
    if (joiValidate.error) return sendErrorResponse(res, joiValidate.error.details[0].message);
    const blog = new Blog({
        title: req.body.title,
        author: user,
        content: req.body.content,
        imageUrl: req.body.imageUrl,
        isHighlight: req.body.isHighlight,
        tags: req.body.tags,
    });
    await blog.save().then(result => {
        console.log(chalk.green(JSON.stringify(result)));
        sendSuccessResponse(res, 'Successfully inserted blog ...');
    }).catch(err => {
        console.log(chalk.redBright(err.message));
        sendErrorResponse(err.message);
    });

});

router.put('/like', auth, validateObjectId, async (req, res, next) => {
    const user = req.user;
    const blog = await Blog.findOne({ _id: req.body.id });
    if (!blog) sendErrorResponse(res, `Blog not exists please recheck ... id: ${ req.body.id }`);
    if (user.likes.some(userObj => userObj._id === req.body.id)) sendSuccessResponse(res, 'Already Liked ...');
    blog.likedBy.push(user);
    await blog.save().then(success => { sendSuccessResponse(res, `${ JSON.stringify(success) }`);}).catch(err => {
        sendErrorResponse(res, err.message);
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
        sendSuccessResponse(res, JSON.stringify(commentRes));
    }).catch();

});

router.delete('/comment', auth, validateObjectId, async (req, res, next) => {
    const user = req.user;
    const comment = await Comment.findOne({ _id: req.body.id });
    if (!comment) sendErrorResponse(res, 'Comment Not Exists...');
    if (comment.commentBy._id !== user._id || user.role !== 'Admin') sendErrorResponse(res, `You don't have access to remove the comment.`);
    await Comment.findOneAndDelete({ _id: req.body.id })
        .then(() => sendSuccessResponse(res, 'Successfully deleted comment'))
        .catch(err => {sendErrorResponse(res, err.message)});
});

router.delete('/delete', auth, admin, validateObjectId, async (req, res, next) => {
    await Blog.findOneAndDelete({ _id: req.body.id }).then(result => {
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
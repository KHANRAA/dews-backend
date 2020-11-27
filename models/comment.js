const mongoose = require('mongoose');
const Joi = require('joi');
const Schema = mongoose.Schema;
const chalk = require('chalk');

const commentSchema = new Schema({
    commentBy: {
        type: Schema.Types.ObjectID,
        ref: 'User',
        required: true,
    },
    comment: {
        type: String,
        required: true,
    },
}, {
    timestamps: true
});

const Comment = mongoose.model('Comment', commentSchema);

validateCommentSchema = async (commentData) => {
    const schema = Joi.object({
        id: Joi.string().required(),
        comment: Joi.string().min(3).required(),
    });
    try {
        return await schema.validate(commentData);
    } catch (err) {
    }
};


exports.Comment = Comment;
exports.validateCommentSchema = validateCommentSchema;
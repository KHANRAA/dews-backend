const mongoose = require('mongoose');
const Joi = require('joi');
const Schema = mongoose.Schema;
const ObjectId = mongoose.ObjectId;
const chalk = require('chalk');

const blogSchema = new Schema({
    title: {
        type: String,
        minlength: 5,
        required: true
    },
    author: {
        type: Schema.Types.ObjectID,
        ref: 'User',
        required: true,
    },
    content: {
        type: String,
        required: true,
        minlength: 20,
    },
    comments: [{
        type: Schema.Types.ObjectID,
        ref: 'Comment'
    }],
    imageUrl: {
        type: String,
        required: true,
    },
    isHighlight: {
        type: Boolean,
        default: false,
    },
    likedBy: [{
        type: Schema.Types.ObjectID,
        ref: 'User'
    }],
    tags: [
        {
            type: String,
            minlength: 2,
        }
    ],
}, {
    timestamps: true
});

const Blog = mongoose.model('Blog', blogSchema);

validateBlogSchema = async (blogData) => {
    const schema = Joi.object({
        title: Joi.string().min(3).required(),
        content: Joi.string().min(20).required(),
        isHighlight: Joi.boolean().default(false).required(),
        imageUrl: Joi.string().min(24).max(24).required(),
        tags: Joi.array().items(Joi.string().min(2)).empty(),
    });
    try {
        return await schema.validate(blogData);
    } catch (err) {
    }
};


exports.Blog = Blog;
exports.validateBlogSchema = validateBlogSchema;

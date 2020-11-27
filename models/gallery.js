const mongoose = require('mongoose');
const Joi = require('joi');
const Schema = mongoose.Schema;
const chalk = require('chalk');

const gallerySchema = new Schema({
    title: {
        type: String,
    },
    uploadedBy: {
        type: Schema.Types.ObjectID,
        ref: 'User',
        required: true,
    },
    imageUrl: {
        type: String,
        required: true,
    },
    likedBy: [{
        type: Schema.Types.ObjectID,
        ref: 'user'
    }],
    tags: [
        {
            type: String,
            minlength: 3,
        }
    ],
}, {
    timestamps: true
});

const GalleryPhoto = mongoose.model('GalleryPhotos', gallerySchema);

validateGalleryImageUploadSchema = async (blogData) => {
    const schema = Joi.object({
        title: Joi.string().empty().required(),
        imageUrl: Joi.string().uri().empty('').default('acasc').required(),
        tags: Joi.array().items(Joi.string().min(2)).empty().required(),
    });
    try {
        return await schema.validate(blogData);
    } catch (err) {
    }
};

exports.GalleryPhoto = GalleryPhoto;
exports.validateGalleryImageUploadSchema = validateGalleryImageUploadSchema;
const mongoose = require('mongoose');
const Joi = require('joi');
const Schema = mongoose.Schema;
const chalk = require('chalk');

const contactSchema = new Schema({
    name: {
        type: String,
        minlength: 5,
        required: true
    },
    email: {
        type: String,
        minlength: 5,
        maxlength: 255,
        require: true,
    },
    subject: {
        type: String,
        required: true,
        minlength: 5,
    },
    phone: {
        type: String,
        minlength: 10,
        required: true,
    },
    message: [{
        type: String,
        minlength: 10,
        required: true,

    }],
    isResponded: {
        type: Boolean,
        default: false,
    },
    isSpam: {
        type: Boolean,
        default: false,
    },

}, {
    timestamps: true
});

const Contact = mongoose.model('Contact', contactSchema);

validateContactSchema = async (contactData) => {
    const phonePattern = '^[0-9]+$';
    const schema = Joi.object({
        email: Joi.string().email({ minDomainSegments: 2, tlds: { allow: ['com'] } }).required(),
        name: Joi.string().min(3).max(40).required(),
        subject: Joi.string().min(3).required(),
        message: Joi.string().min(3).max(4098).required(),
        phone: Joi.string().length(10).pattern(new RegExp(phonePattern)).required(),
    });
    try {
        return await schema.validate(contactData);
    } catch (err) {
    }
};

exports.Contact = Contact;
exports.validateContactSchema = validateContactSchema;
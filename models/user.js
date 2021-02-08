const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const chalk = require('chalk');
// const {error, warn, info} = require('../middleware/error');

const Schema = mongoose.Schema;

const userSchema = new Schema({
    name: {
        type: String,
        required: true,
        minlength: 3,
        maxlength: 100,
        require: true,
    },
    email: {
        type: String,
        minlength: 5,
        maxlength: 255,
        unique: true,
        require: true,
    },
    password: {
        type: String,
        required: true,
        minlength: 5,
        maxlength: 1024
    },
    designation: {
        type: String,
        minlength: 3,
    },
    role: {
        type: String,
        minlength: 4,
        maxlength: 10,
        default: 'user'
    },
    isActive: { type: Boolean, default: true },
    mobile: {
        type: Number,
        default: 9999999999,
    },
    gender: {
        type: String,
        default: 'Male'
    },
    avatarImageUrl: {
        type: String,
        default: 'https://storage.googleapis.com/dews_avatars/avatars/men.png'
    },
    address: {
        type: String,
    },
    testimonial: {
        type: String,
        minlength: 10,
        maxlength: 20,
    }

}, {
    timestamps: true,
});


userSchema.methods.generateAuthToken = async (user) => {
    return jwt.sign({
        _id: user._id,
        role: user.role,
        name: user.name,
        isActive: user.isActive
    }, 'secretKey', { expiresIn: '24h' });
};

const User = mongoose.model('User', userSchema);

validateUserRegistrationByPassword = async (userData) => {
    console.log(userData);
    const pattern = '^(?=.*\\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$';
    const schema = Joi.object({
        email: Joi.string().email({ minDomainSegments: 2, tlds: { allow: ['com'] } }).required(),
        name: Joi.string().min(3).max(40).required(),
        password: Joi.string().min(6).max(40).pattern(new RegExp(pattern)).required(),
        returnSecureToken: Joi.boolean().invalid(false).required(),
    });
    try {
        return await schema.validate(userData);
    } catch (err) {
    }
};

validateUserRegistrationBySocialLogin = async (userData) => {
    const schema = Joi.object({
        email: Joi.string().email({ minDomainSegments: 2, tlds: { allow: ['com'] } }).required(),
        name: Joi.string().alphanum().min(3).max(30).required(),
        imageUrl: Joi.string().uri().empty('').default('acasc'),
        authToken: Joi.string().token().required()
    });
    try {
        return await schema.validate(userData);
    } catch (err) {
        //todo
    }
};

validatePasswordLogin = async (userData) => {
    const pattern = '^(?=.*\\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$';
    const schema = Joi.object({
        email: Joi.string().email({ minDomainSegments: 2, tlds: { allow: ['com'] } }).required(),
        password: Joi.string().min(6).max(40).pattern(new RegExp(pattern)).required(),
        returnSecureToken: Joi.boolean().invalid(false).required(),
    });
    try {
        return await schema.validate(userData);
    } catch (err) {
    }
};

exports.User = User;
exports.validateByPassword = validateUserRegistrationByPassword;
exports.validateBySocialLogin = validateUserRegistrationBySocialLogin;
exports.validatePasswordLogin = validatePasswordLogin;

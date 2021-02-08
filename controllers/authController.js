const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const chalk = require('chalk');
const _ = require('lodash');

const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const validateObjectId = require('../middleware/validateObjectId');


const { User, validateByPassword, validateBySocialLogin, validatePasswordLogin } = require('../models/user');


router.get('/', (req, res, next) => {
    res.status(200).send('Hi, From User Module');
});

router.post('/register/social', (req, res, next) => {

    //todo

});

router.post('/register/password', async (req, res, next) => {
        const joiValidate = await validateByPassword(req.body);
        if (joiValidate.error) return sendErrorResponse(res, joiValidate.error.details[0].message);
        const data = req.body;
        const salt = await bcrypt.genSalt(10);
        console.log(chalk.red(`Received signup request with : ${ data }`));
        let user = await User.findOne({ email: data.email });
        if (user) return sendErrorResponse(res, 'User already registered please log in .. or reset password');
        const password = await bcrypt.hash(data.password, salt);
        user = new User({
            name: data.name,
            email: data.email,
            isActive: false,
            password,
        });
        await user.save()
            .then(result => {
                console.log(chalk.green(`Wohhooo .. user created with data ${ JSON.stringify(result) }`));
                return sendSuccessResponse(res, _.pick(result, ['_id', 'email', 'role', 'avatarImageUrl']));
            })
            .catch(err => {
                next(err);
            });
    }
);

router.post('/login', async (req, res, next) => {
    const joiValidate = await validatePasswordLogin(req.body);
    if (joiValidate.error) return sendErrorResponse(res, joiValidate.error.details[0].message);
    console.log(chalk.green(`Received login reqeust : ${ JSON.stringify(req.body) }`));
    let user = await User.findOne({ email: req.body.email });
    console.log(chalk.cyan(user));
    if (!user) return sendErrorResponse(res, 'User is not registered... Please Register');
    const validPassword = await bcrypt.compare(req.body.password, user.password);
    if (!validPassword) return sendErrorResponse(res, 'Please check the password and try again...');
    if (!user.isActive) return sendErrorResponse(res, 'User is not active please contact administrator...');
    const token = await user.generateAuthToken(user);
    const returnData = _.pick(user, ['_id', 'email', 'role']);
    return sendSuccessResponse(res, {
        id: returnData._id,
        email: returnData.email,
        role: returnData.role,
        dewsToken: token,
        expiresIn: '86400000'
    });

});


router.post('/profile', validateObjectId, auth, async (req, res, next) => {
    const user = req.user;
    console.log(chalk.cyan(user));
    return sendSuccessResponse(res, _.pick(user, ['name', 'role', 'avatarImageUrl', 'mobile', 'gender', 'testimonial', 'address']));

});

router.put('/profile/save', (req, res, next) => {
    //todo
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

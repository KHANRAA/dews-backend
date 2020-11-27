const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const chalk = require('chalk');

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
        console.log(chalk.red(data.password));
        const password = await bcrypt.hash(data.password, salt);
        const user = new User({
            name: data.name,
            email: data.email,
            password,
        });
        await user.save()
            .then(result => {
                console.log(chalk.green(`Wohhooo .. user created with data ${ JSON.stringify(result) }`));
                return sendSuccessResponse(res, `Wohhooo .. user created with data ${ JSON.stringify(result) }`);
            })
            .catch(err => {
                return sendErrorResponse(res, err.message);
            });

    }
);

router.post('/login', async (req, res) => {
    const joiValidate = await validatePasswordLogin(req.body);
    if (joiValidate.error) return sendErrorResponse(res, joiValidate.error.details[0].message);
    let user = await User.findOne({ email: req.body.email });
    console.log(chalk.cyan(user));
    if (!user) return sendErrorResponse(res, 'User is not registered... Please Register');
    if (!user.isActive) return sendErrorResponse(res, 'User is not active please contact administrator...');
    const validPassword = await bcrypt.compare(req.body.password, user.password);
    if (!validPassword) return sendErrorResponse(res, 'Please check the password and try again...');
    const token = await user.generateAuthToken();
    sendRedirectResponse(res, token);

});



router.put('/update/role', (req, res, next) => {
    //todo
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

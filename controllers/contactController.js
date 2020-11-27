const express = require('express');
const router = express.Router();
const chalk = require('chalk');

const { Contact, validateContactSchema } = require('../models/contact');
const { User } = require('../models/user');

const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const validateObjectId = require('../middleware/validateObjectId');

router.get('/', (req, res, next) => {
    res.status(200).send('Hi, From Contact Controller....');
});


router.post('/submit', async (req, res, next) => {
    const joiValidate = await validateContactSchema(req.body);
    if (joiValidate.error) return sendErrorResponse(res, joiValidate.error.details[0].message);
    const contact = new Contact({
        name: req.body.name,
        email: req.body.email,
        subject: req.body.subject,
        phone: req.body.phone,
        message: req.body.subject,
    });
    await contact.save().then(() => {
        return sendSuccessResponse(res, 'Successfully submitted...');
    }).catch((err) => {
        console.log(chalk.redBright(`${ err.message }`));
       next(err);
    });
});

router.put('/respond', auth, admin, validateObjectId, async (req, res, next) => {
    const contact = Contact.findOne({ _id: req.body.id });
    if (!contact) sendErrorResponse(res, 'No contact req foound for this id...');
    contact.isResponded = true;
    await contact.save().then(() => {
        return sendSuccessResponse(res, 'Successfully responded to the contact...');
    }).catch((err) => {
        console.log(chalk.redBright(`${ err.message }`));
       next(err);
    });
});

router.put('/spam', auth, admin, validateObjectId, async (req, res, next) => {
    const contact = Contact.findOne({ _id: req.body.id });
    if (!contact) sendErrorResponse(res, 'No contact req found for this id...');
    contact.isSpam = true;
    await contact.save().then(async () => {
        const user = await User.findOne({ email: contact.email });
        if (user) user.isActive = false;
        await user.save()
            .then(() => {console.log(chalk.red(`User with: ${ user.email } is marked as inActive `));})
            .catch(err => {
               next(err);
            });
        return sendSuccessResponse(res, 'Successfully marked this email as  spam...');
    }).catch((err) => {
        console.log(chalk.redBright(`${ err.message }`));
        next(err);
    });
});

router.delete('/delete', auth, admin, validateObjectId, async (req, res, next) => {
    await Contact.findOneAndDelete({ _id: req.body.id }).then(result => {
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
    res.json({ status: 400, data: error });
};

module.exports = router;

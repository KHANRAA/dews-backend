const express = require('express');
const router = express.Router();
const chalk = require('chalk');

const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const validateObjectId = require('../middleware/validateObjectId');


const {
    Campaign,
    validateCampaignSchema,
    validateCampaignSchemaForFund,
    validateCampaignUpdateSchema,
    validateCampaignUpdateSchemaForFund
} = require('../models/campaign');


router.get('/', (req, res, next) => {
    res.status(200).send('Hi, From campaign Controller...' +
        ' Module');
});


router.post('/create', auth, admin, async (req, res, next) => {
    const user = req.user;
    let joiValidate = await validateCampaignSchema(req.body);
    if (joiValidate.error) return sendErrorResponse(res, joiValidate.error.details[0].message);
    let campaign;
    if (req.body.campaignType === 'normal') {
        campaign = new Campaign({
            title: req.body.title,
            subtitle: req.body.subtitle,
            content: req.body.content,
            createdBy: user,
            campaignType: req.body.campaignType,
            campaignPhoto: req.body.campaignPhoto,
            campaignDate: req.body.campaignDate,
            tags: req.body.tags,

        });

    } else {
        joiValidate = await validateCampaignSchemaForFund(req.body);
        if (joiValidate.error) return sendErrorResponse(res, joiValidate.error.details[0].message);
        campaign = new Campaign({
            title: req.body.title,
            subtitle: req.body.subtitle,
            content: req.body.content,
            createdBy: user,
            campaignType: req.body.campaignType,
            goalAmount: req.body.goalAmount,
            campaignPhoto: req.body.campaignPhoto,
            campaignDate: req.body.campaignDate,
            tags: req.body.tags,
        });
    }

    await campaign.save().then(() => sendSuccessResponse(res, 'Successfully added campaign..')).catch((err) => {
        next(err);
    });

});


router.put('/update', auth, admin, async (req, res, enext) => {
    let joiValidate = await validateCampaignUpdateSchema(req.body);
    if (joiValidate.error) return sendErrorResponse(res, joiValidate.error.details[0].message);
    let campaign = await Campaign.findOne({ _id: req.body.id });
    if (!campaign) return sendErrorResponse(res, 'Campaign not found...');
    campaign.title = req.body.title;
    campaign.subtitle = req.body.subtitle;
    campaign.content = req.body.content;
    campaign.campaignType = req.body.campaignType;
    campaign.isActive = req.body.isActive;
    campaign.campaignPhoto = req.body.campaignPhoto;
    campaign.campaignDate = req.body.campaignDate;
    campaign.tags = req.body.tags;
    if (campaign.campaignType === 'fund') {
        joiValidate = await validateCampaignUpdateSchemaForFund(req.body);
        if (joiValidate.error) return sendErrorResponse(res, joiValidate.error.details[0].message);
        campaign.goalAmount = req.body.goalAmount;
    }
    campaign.save().then(() => {
        return sendSuccessResponse(res, 'Successfully updated campaign...');
    }).catch((err) => {
        next(err);
    });

});

router.post('/join', auth, validateObjectId, async (req, res, next) => {
    const user = req.user;
    const campaign = await Campaign.findOne({ _id: req.body.id });
    if (!campaign) return sendErrorResponse(res, 'Campaign not exists ....');
    campaign.volunteers.push(user);
    await campaign.save().then(() => {
        return sendSuccessResponse(res, 'See you soon in the campaign...');
    }).catch((err) => {
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

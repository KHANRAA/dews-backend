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


router.post('/upload', auth, admin, async (req, res, next) => {
    if (!req.file) {
        console.log(chalk.red('No file received..'));
        throw new Error('No image provided.....');
    }
    console.log(chalk.green('in Uopload...'));
    const tempUploadPath = req.file.path;
    const storage = new Storage({ keyFilename: '/Volumes/workplace/personal/dews-backend/config/inside-ngo-0af11d83ca0e.json' }); // to dremove...
    const bucketName = 'dews_campaign_images';
    const bucket = storage.bucket(bucketName);
    // await storage.bucket(bucketName).makePublic({});
    await bucket.upload(tempUploadPath, {
        gzip: true,
        // By setting the option `destination`, you can change the name of the
        // object you are uploading to a bucket.
        metadata: {
            // Enable long-lived HTTP caching headers
            // Use only if the contents of the file will never change
            // (If the contents will change, use cacheControl: 'no-cache')
            cacheControl: 'public, max-age=31536000',
        },
    }).then(async (saveResult) => {
        // console.log(chalk.green(`${ tempUploadPath.toString() } uploaded to ${ bucketName }.
        // with result https://storage.googleapis.com/${ bucketName }/${ tempUploadPath.substr(15, tempUploadPath.length) } }`));
        saveResult[0].makePublic().then(() => {
        });
        const tempUpload = new TempUploads({
            fileName: tempUploadPath.substr(15, tempUploadPath.length),
            publicUrl: `https://storage.googleapis.com/${ bucketName }/${ tempUploadPath.substr(15, tempUploadPath.length) }`.trim()
        })
        await tempUpload.save().then((saveRes) => {
            return res.json({ id: saveRes._id.toString() });
        })
    }).catch((err) => {
        next(err);
    }).finally(() => {
        fs.unlink(tempUploadPath, err => {
            err ? next(err) : '';
        })
    });


});


router.delete('/upload', auth, admin, async (req, res, next) => {
    const joiValidate = await validateTempUploadDeleteSchema(req.body);
    if (joiValidate.error) return sendErrorResponse(res, joiValidate.error.details[0].message);
    const storage = new Storage({ keyFilename: '/Volumes/workplace/personal/dews-backend/config/inside-ngo-0af11d83ca0e.json' });
    const bucketName = 'dews_campaign_images';
    const bucket = storage.bucket(bucketName);
    // await storage.bucket(bucketName).makePublic({});
    const tempUpload = await TempUploads.findById(req.body.id);

    if (!tempUpload) return sendSuccessResponse(res, { status: 404, data: 'Temp Upload Not Exists ....' });
    await bucket.file(tempUpload.fileName).delete().then(async () => {
        await TempUploads.deleteOne({ _id: req.body.id });
        sendSuccessResponse(res, { status: 200, data: 'Temp Upload Deleted Successfully ....' });
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

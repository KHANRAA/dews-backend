const mongoose = require('mongoose');
const Joi = require('joi');
const Schema = mongoose.Schema;
const chalk = require('chalk');

const campaignSchema = new Schema({
    title: {
        type: String,
        minlength: 5,
        maxlength: 20,
        required: true
    },
    subtitle: {
        type: String,
        minlength: 5,
        maxlength: 50,
    },
    createdBy: {
        type: Schema.Types.ObjectID,
        ref: 'User',
        required: true,
    },
    content: {
        type: String,
        minlength: 20,
        maxlength: 2048,
        required: true,
    },
    campaignType: {
        type: String,
        required: true,
    },
    campaignPhoto: {
        type: String,
        required: true,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    goalAmount: {
        type: Number,
    },
    campaignDate: {
        type: Date,
        required: true,
    },
    donatedBy: [{
        user: {
            type: Schema.Types.ObjectID,
            ref: 'user'
        },
        amount: {
            type: Number,
            donateDate: {
                type: Date,
            },
            method: {
                type: String,
                minlength: 3,
            },
        }
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

const Campaign = mongoose.model('Campaign', campaignSchema);

validateCampaignSchemaWithOutFund = async (campaignData) => {
    const schema = Joi.object({
        title: Joi.string().min(3).required(),
        subtitle: Joi.string().min(3).required(),
        content: Joi.string().min(20).max(1024).required(),
        campaignType: Joi.string().valid('fund', 'general').required(),
        imageUrl: Joi.string().uri().empty('').default('acasc').required(),
        campaignDate: Joi.date().required()
    });
    try {
        return await schema.validate(campaignData);
    } catch (err) {
    }
};

validateCampaignSchemaWithFund = async (campaignData) => {
    const schema = Joi.object({
        title: Joi.string().min(3).required(),
        subtitle: Joi.string().min(3).required(),
        content: Joi.string().min(20).max(1024).required(),
        campaignType: Joi.string().valid('fund', 'general').required(),
        imageUrl: Joi.string().uri().empty('').default('acasc').required(),
        goalAmount: Joi.number().min(1).required(),
        campaignDate: Joi.date().min(Date.now()).required()
    });
    try {
        return await schema.validate(campaignData);
    } catch (err) {
    }
};

exports.Campaign = Campaign;
exports.validateCampaignSchemaWithOutFund = validateCampaignSchemaWithOutFund;
exports.validateCampaignSchemaWithFund = validateCampaignSchemaWithFund;
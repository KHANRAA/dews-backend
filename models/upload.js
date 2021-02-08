const mongoose = require('mongoose');
const Joi = require('joi');
const Schema = mongoose.Schema;

const uploadScheama = new Schema({
    fileName: {
        type: String,
        required: true,
    },
    publicUrl: {
        type: String,
    }

}, {
    timestamps: true
});

const TempUploads = mongoose.model('TempUploads', uploadScheama);

validateTempUploadDeleteSchema = async (tempUploadData) => {
    const schema = Joi.object({
        id: Joi.string().min(24).max(24).required(),
    });
    try {
        return await schema.validate(tempUploadData);
    } catch (err) {
    }
};


exports.TempUploads = TempUploads;
exports.validateTempUploadDeleteSchema = validateTempUploadDeleteSchema;

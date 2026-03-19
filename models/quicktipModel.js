const mongoose = require('mongoose');

const quickTipSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'A quick tip must have a title'],
        unique: true,
        trim: true
    },
    language: {
        type: String,
        required: [true, 'A quick tip must specify a language'],
        trim: true
    },
    codeSnippet: {
        type: String,
        required: [true, 'A quick tip must have a code snippet']
    },
    description: {
        type: String,
        trim: true
    },
    seniority: {
        type: String,
        enum: ['Junior', 'Semi-Senior', 'Senior'],
        default: 'Junior'
    },
    views: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now,
        select: false
    }
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

const QuickTip = mongoose.model('QuickTip', quickTipSchema);
module.exports = QuickTip;

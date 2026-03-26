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
    slug: {
        type: String,
        unique: true,
        index: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        select: false
    }
}, {
    toJSON: {
        virtuals: true,
        transform: (doc, ret) => {
            delete ret._id;
            delete ret.id;
            delete ret.slug;
            delete ret.__v;
            return ret;
        }
    },
    toObject: { virtuals: true }
});

quickTipSchema.pre('save', function (next) {
    this.slug = this.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    next();
});

// Indexes para filtrado por lenguaje y nivel
quickTipSchema.index({ language: 1 });
quickTipSchema.index({ seniority: 1 });
quickTipSchema.index({ language: 1, seniority: 1 });

const QuickTip = mongoose.model('QuickTip', quickTipSchema);
module.exports = QuickTip;

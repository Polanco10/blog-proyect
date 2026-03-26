const mongoose = require('mongoose');

const cheatsheetSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'A cheatsheet must have a title'],
        unique: true,
        trim: true
    },
    description: {
        type: String,
        required: [true, 'A cheatsheet must have a description'],
        trim: true
    },
    category: {
        type: String,
        trim: true
    },
    fileUrl: {
        type: String,
        required: [true, 'A cheatsheet must have a link to a downloadable file or image'],
        trim: true
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

cheatsheetSchema.pre('save', function (next) {
    this.slug = this.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    next();
});

// Index para filtrado por categoría
cheatsheetSchema.index({ category: 1 });

const Cheatsheet = mongoose.model('Cheatsheet', cheatsheetSchema);
module.exports = Cheatsheet;

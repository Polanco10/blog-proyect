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
    createdAt: {
        type: Date,
        default: Date.now,
        select: false
    }
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
// Index para filtrado por categoría
cheatsheetSchema.index({ category: 1 });
const Cheatsheet = mongoose.model('Cheatsheet', cheatsheetSchema);
module.exports = Cheatsheet;

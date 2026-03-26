const mongoose = require('mongoose');
const experienceSchema = new mongoose.Schema({
    company: {
        type: String,
        required: [true, 'An experience must have a company name'],
        trim: true
    },
    role: {
        type: String,
        required: [true, 'An experience must have a role'],
        trim: true
    },
    startDate: {
        type: Date,
        required: [true, 'An experience must have a start date']
    },
    endDate: {
        type: Date
    },
    description: {
        type: String,
        trim: true
    },
    achievements: [String],
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
            delete ret.__v;
            return ret;
        }
    },
    toObject: { virtuals: true }
});
const Experience = mongoose.model('Experience', experienceSchema);
module.exports = Experience;

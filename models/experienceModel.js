const mongoose = require('mongoose');

const experienceSchema = new mongoose.Schema({
    company: {
        type: String,
        required: [true, 'An experience must have a company name'],
        trim: true,
        minlength: [2, 'Company name must be at least 2 characters'],
        maxlength: [100, 'Company name must be at most 100 characters'],
    },
    role: {
        type: String,
        required: [true, 'An experience must have a role'],
        trim: true,
        minlength: [2, 'Role must be at least 2 characters'],
        maxlength: [100, 'Role must be at most 100 characters'],
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
        trim: true,
        maxlength: [1000, 'Description must be at most 1000 characters'],
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

experienceSchema.index({ company: 1 });
experienceSchema.index({ startDate: -1 });

const Experience = mongoose.model('Experience', experienceSchema);
module.exports = Experience;

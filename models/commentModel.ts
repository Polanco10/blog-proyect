import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
    article: {
        type: mongoose.Schema.ObjectId,
        ref: 'Article',
        required: [true, 'A comment must belong to an article'],
        index: true,
    },
    author: {
        type: String,
        required: [true, 'A comment must have an author name'],
        trim: true,
        minlength: [2, 'Author name must be at least 2 characters'],
        maxlength: [60, 'Author name must be at most 60 characters'],
    },
    email: {
        type: String,
        required: [true, 'A comment must have an email'],
        trim: true,
        lowercase: true,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email'],
    },
    body: {
        type: String,
        required: [true, 'A comment cannot be empty'],
        trim: true,
        minlength: [3, 'Comment must be at least 3 characters'],
        maxlength: [2000, 'Comment must be at most 2000 characters'],
    },
    approved: {
        type: Boolean,
        default: false, // Comments require admin approval before being shown
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

commentSchema.index({ article: 1, approved: 1, createdAt: -1 });

commentSchema.set('toJSON', {
    virtuals: true,
    transform: (doc: any, ret: any) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        delete ret.email; // no exponer email públicamente
        return ret;
    }
});

const Comment = mongoose.model('Comment', commentSchema);
export = Comment;

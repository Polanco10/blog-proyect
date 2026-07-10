import mongoose from 'mongoose';
import slugPlugin from '../utils/slugPlugin';
import createSchemaOptions from '../utils/schemaOptions';

const cheatsheetSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'A cheatsheet must have a title'],
            unique: true,
            trim: true,
        },
        description: {
            type: String,
            required: [true, 'A cheatsheet must have a description'],
            trim: true,
        },
        category: {
            type: String,
            trim: true,
        },
        fileUrl: {
            type: String,
            required: [true, 'A cheatsheet must have a link to a downloadable file or image'],
            trim: true,
        },
        slug: {
            type: String,
            unique: true,
            index: true,
        },
        published: {
            type: Boolean,
            default: true,
        },
        createdAt: {
            type: Date,
            default: Date.now,
            select: false,
        },
    },
    createSchemaOptions('slug')
);

cheatsheetSchema.plugin(slugPlugin);

// Solo mostrar cheatsheets publicadas cuando no se filtra por published explícitamente.
// Restringido a find/findOne: los updates/deletes por slug deben alcanzar drafts.
cheatsheetSchema.pre(['find', 'findOne'], function (this: mongoose.Query<unknown, unknown>, next) {
    if (this.getFilter().published === undefined) {
        // $ne false y no true: los docs legacy sin el campo cuentan como publicados
        this.where({ published: { $ne: false } });
    }
    next();
});

// Index para filtrado por categoría
cheatsheetSchema.index({ category: 1 });

const Cheatsheet = mongoose.model('Cheatsheet', cheatsheetSchema);
export = Cheatsheet;

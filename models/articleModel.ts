import mongoose from 'mongoose';
import { CATEGORIES } from '../constants';
import slugPlugin from '../utils/slugPlugin';
import createSchemaOptions from '../utils/schemaOptions';

const articleSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'An article must have a title'],
            unique: true,
            trim: true, // borra los espacios al principio y al final de los strings
            maxlength: [40, 'An article title must have less or equal then 40 characters'], //validacion
            minlength: [10, 'An article title must have more or equal then 10 characters'], //validacion
        },
        description: {
            type: String,
            required: [true, 'An article must have a description'],
            trim: true, // borra los espacios al principio y al final de los strings
        },
        createdAt: {
            type: Date,
            default: Date.now(),
        },
        author: {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
            required: [true, 'The article must have an author'],
        },
        tags: [String],
        imageCover: {
            type: String,
            trim: true, // borra los espacios al principio y al final de los strings
        },
        category: {
            type: String,
            trim: true, // borra los espacios al principio y al final de los strings
            enum: {
                // validacion
                values: [CATEGORIES.PROGRAMACION, CATEGORIES.IDIOMA],
                message: 'Category is either: Programacion or Idioma',
            },
        },
        content: {
            type: String,
            trim: true,
        },
        // Minutos de lectura estimados — se calcula del content al guardar,
        // para que los listados puedan proyectar cards sin transferir content
        readTime: {
            type: String,
        },
        views: {
            type: Number,
            default: 0,
        },
        likes: {
            type: Number,
            default: 0,
        },
        published: {
            type: Boolean,
            default: true,
        },
        slug: {
            type: String,
            unique: true,
            index: true,
        },
    },
    createSchemaOptions()
);

// Indexes para optimizar búsquedas frecuentes
articleSchema.index({ category: 1, createdAt: -1 });
articleSchema.index({ views: -1 });
articleSchema.index({ title: 'text', description: 'text' }); // full-text search

// Genera el slug a partir del título antes de guardar
articleSchema.plugin(slugPlugin);

// Calcula readTime (~200 palabras/min, misma fórmula que el frontend)
articleSchema.pre('save', function (next) {
    const doc = this as unknown as { content?: string; readTime?: string };
    const words = (doc.content ?? '').trim().split(/\s+/).length;
    doc.readTime = String(Math.max(1, Math.round(words / 200)));
    next();
});

// Solo mostrar artículos publicados cuando no se filtra por published explícitamente.
// Restringido a find/findOne: /^find/ también cubría findOneAndUpdate/Delete e
// impedía editar, despublicar o borrar drafts por slug.
articleSchema.pre(['find', 'findOne'], function (this: mongoose.Query<unknown, unknown>, next) {
    if (this.getFilter().published === undefined) {
        // $ne false y no true: los docs legacy sin el campo cuentan como publicados
        this.where({ published: { $ne: false } });
    }
    next();
});

articleSchema.pre(/^find/, function (this: mongoose.Query<unknown, unknown>, next) {
    this.populate({
        path: 'author',
        select: '-__v -role -_id',
    });
    next();
});

const Article = mongoose.model('Article', articleSchema);

export = Article;

import mongoose from 'mongoose';
import { CATEGORIES } from '../constants';
// const validator = require('validator');

const articleSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'An article must have a title'],
            unique: true,
            trim: true, // borra los espacios al principio y al final de los strings
            maxlength: [40, 'An article title must have less or equal then 40 characters'], //validacion
            minlength: [10, 'An article title must have more or equal then 10 characters'], //validacion
            // validate: [validator.isAlpha, 'Article must only contain characters'] //validacion de validator
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
    {
        toJSON: {
            virtuals: true,
            transform: (doc: any, ret: any) => {
                delete ret._id;
                delete ret.id;
                delete ret.__v;
                return ret;
            },
        },
        toObject: { virtuals: true },
    }
);
// Indexes para optimizar búsquedas frecuentes
articleSchema.index({ category: 1, createdAt: -1 });
articleSchema.index({ views: -1 });
articleSchema.index({ title: 'text', description: 'text' }); // full-text search
// articleSchema.virtual('lolcalTime').get(function () { //virtual property - no persiste en la base de datos
//     return 'localtime'
// })

// articleSchema.pre('save', function (next) {    // document middleware - ocurre antes de "(pre)" .save() y de .create() - No ocurre con find() o otros
//     console.log(this)
//     next();
// });
// articleSchema.statics.nombrefuncion = function(){} // static function - funcion que se puede usar dentro de los model middleware
// articleSchema.pre('find', function (next) {    // query middleware - se ejecuta antes de query find() - No ocurre con findOne()
// Genera el slug a partir del título antes de guardar
articleSchema.pre('save', function (next) {
    this.slug = this.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    next();
});

articleSchema.pre(/^find/, function (this: any, next) {
    // Solo mostrar artículos publicados cuando no se filtra por published explícitamente
    if (this.getFilter().published === undefined) {
        this.where({ published: true });
    }
    this.populate({
        path: 'author',
        select: '-__v -role -_id',
    });
    next();
});

// articleSchema.pre('aggregate', function (next) { // agregation middleware - se ejecuta antes de cualquier aggregate
// this.pipeline().unshift({$match:{}})
// console.log(this.pipeline())
// next();
// })

const Article = mongoose.model('Article', articleSchema);

export = Article;

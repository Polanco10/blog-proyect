const mongoose = require('mongoose');
// const validator = require('validator');

const articleSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'An article must have a title'],
        unique: true,
        trim: true, // borra los espacios al principio y al final de los strings
        maxlength: [40, 'An article title must have less or equal then 40 characters'], //validacion 
        minlength: [10, 'An article title must have more or equal then 10 characters'],  //validacion 
        // validate: [validator.isAlpha, 'Article must only contain characters'] //validacion de validator
    },
    description: {
        type: String,
        required: [true, 'An article must have a description'],
        trim: true // borra los espacios al principio y al final de los strings

    },
    createdAt: {
        type: Date,
        default: Date.now(),
    },
    author: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'The article must have an author']

    },
    tags: [String],
    imageCover: {
        type: String,
        trim: true // borra los espacios al principio y al final de los strings
    },
    category: {
        type: String,
        trim: true, // borra los espacios al principio y al final de los strings
        enum: {     // validacion
            values: ['Programacion', 'Idioma'],
            message: 'Category is either: Programacion or Idioma'
        }

    },
    views: {
        type: Number,
        default: 0
    }

}, {
    toJSON: { virtuals: true }, //para devolver virtuals properties en el response
    toObject: { virtuals: true } //para devolver virtuals properties en el response
});
// articleSchema.index({createdAt:1, author:-1}) // Index - Crear un index para optimizar busqueda
// articleSchema.virtual('lolcalTime').get(function () { //virtual property - no persiste en la base de datos
//     return 'localtime'
// })

// articleSchema.pre('save', function (next) {    // document middleware - ocurre antes de "(pre)" .save() y de .create() - No ocurre con find() o otros
//     console.log(this)
//     next();
// });
// articleSchema.statics.nombrefuncion = function(){} // static function - funcion que se puede usar dentro de los model middleware
// articleSchema.pre('find', function (next) {    // query middleware - se ejecuta antes de query find() - No ocurre con findOne()
articleSchema.pre(/^find/, function (next) {  // query middleware - se ejecuta antes de cualquier query find
    this.populate({ // .populate() hace el "join" cuando se tiene un objectId como referencia dentro de otro documento
        path: 'author', //property del request
        select: '-__v'

    });
    next();
})

// articleSchema.pre('aggregate', function (next) { // agregation middleware - se ejecuta antes de cualquier aggregate
// this.pipeline().unshift({$match:{}})
// console.log(this.pipeline())
// next();
// })

const Article = mongoose.model('Article', articleSchema);

module.exports = Article
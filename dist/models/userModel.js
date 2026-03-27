const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const { ROLES } = require('../constants');
const userSchema = mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please tell us your name']
    },
    email: {
        type: String,
        required: [true, 'Please provide your email'],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, 'Please provide a valid email']
    },
    photo: String,
    role: {
        type: String,
        enum: [ROLES.USER, ROLES.ADMIN],
        default: ROLES.USER
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: 8,
        select: false // no devolver en el response
    },
    passwordConfirm: {
        type: String,
        required: [true, 'Please confirm your password'],
        validate: {
            validator: function (el) {
                return el === this.password;
            },
            message: 'Password are not the same' // Se puede usar ({VALUE}) para poner el valor del elemento
        }
    },
    passwordChangedAt: Date, //fecha en que se cambio la contraseña por ultima vez
    passwordResetToken: String, //token que se envia para cambiar contraseña
    passwordResetExpires: Date, //fecha en la que expira el token para cambiar contraseña
    active: {
        type: Boolean,
        default: true,
        select: false
    }
}, {
    toJSON: {
        virtuals: true,
        transform: (doc, ret) => {
            ret.id = ret._id;
            delete ret._id;
            delete ret.__v;
            delete ret.role;
            delete ret.passwordChangedAt;
            delete ret.passwordResetToken;
            delete ret.passwordResetExpires;
            return ret;
        }
    }
});
userSchema.pre('save', async function (next) {
    if (!this.isModified('password'))
        return next();
    this.password = await bcrypt.hash(this.password, 12); // 12 -> valor recomendado para encriptar la pass
    this.passwordConfirm = undefined; //para no persistir en la bd este valor
    next();
});
userSchema.pre('save', function (next) {
    if (!this.isModified('password') || this.isNew)
        return next();
    this.passwordChangedAt = Date.now() - 1000; //Se le resta un segundo para asegurarse que no haya conflictos con el timestamp del JWT (que se ejecuta despues)
    next();
});
userSchema.pre(/^find/, function (next) {
    this.find({ active: { $ne: false } });
    next();
});
userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
};
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
        return JWTTimestamp < changedTimestamp;
    }
    return false;
};
userSchema.methods.createPasswordResetToken = function () {
    const resetToken = crypto.randomBytes(32).toString('hex'); // Crear un token para cambiar contraseña
    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex'); // Encryptar el token para almacenarlo en la base de datos
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // Token expira en 10 minutos desde que se solicita
    return resetToken;
};
const User = mongoose.model('User', userSchema);
module.exports = User;

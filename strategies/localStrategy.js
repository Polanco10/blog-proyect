const AuthStrategy = require('./authStrategy');
const User = require('../models/userModel');

/**
 * LocalStrategy — autentica requests via email + contraseña en req.body.
 * Retorna { id, iat: Date.now() } en caso de éxito, null si falla.
 * Usado internamente por el endpoint de login.
 */
class LocalStrategy extends AuthStrategy {
    async authenticate(req) {
        const { email, password } = req.body;
        if (!email || !password) return null;

        const user = await User.findOne({ email }).select('+password');
        if (!user) return null;

        const isCorrect = await user.correctPassword(password, user.password);
        if (!isCorrect) return null;

        return { id: user._id.toString(), iat: Math.floor(Date.now() / 1000) };
    }
}

module.exports = new LocalStrategy();

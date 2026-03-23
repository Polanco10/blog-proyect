const AuthStrategy = require('./authStrategy');
const User = require('../models/userModel');

/**
 * LocalStrategy — authenticates requests via email + password in req.body.
 * Returns { id, iat: Date.now() } on success, null on failure.
 * Used internally by the login endpoint.
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

const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const AuthStrategy = require('./authStrategy');

/**
 * JWTStrategy — authenticates requests via Bearer token in the Authorization header.
 * Verifies the JWT signature and expiry using JWT_SECRET.
 */
class JWTStrategy extends AuthStrategy {
    async authenticate(req) {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

        const token = authHeader.split(' ')[1];
        try {
            const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
            return { id: decoded.id, iat: decoded.iat };
        } catch {
            return null;
        }
    }
}

module.exports = new JWTStrategy();

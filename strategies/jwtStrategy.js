const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const AuthStrategy = require('./authStrategy');
const { isBlacklisted } = require('../utils/tokenBlacklist');

/**
 * JWTStrategy — autentica requests via Bearer token en el header Authorization.
 * Verifica la firma y expiración del JWT usando JWT_SECRET.
 * Rechaza tokens que han sido invalidados explícitamente via logout.
 */
class JWTStrategy extends AuthStrategy {
    async authenticate(req) {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

        const token = authHeader.split(' ')[1];
        try {
            const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
            if (isBlacklisted(token)) return null;
            return { id: decoded.id, iat: decoded.iat };
        } catch {
            return null;
        }
    }
}

module.exports = new JWTStrategy();

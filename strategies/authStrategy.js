/**
 * AuthStrategy — define la interfaz que toda estrategia de autenticación debe implementar.
 * Las estrategias concretas (JWT, Local, API Key) implementan authenticate(req).
 */
class AuthStrategy {
    /**
     * Extrae y verifica las credenciales del request.
     * @param {import('express').Request} req
     * @returns {Promise<{ id: string } | null>} payload decodificado, o null si falla
     */
    // eslint-disable-next-line no-unused-vars
    async authenticate(req) {
        throw new Error('AuthStrategy.authenticate() must be implemented by subclass');
    }
}

module.exports = AuthStrategy;

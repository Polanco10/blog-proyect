/**
 * AuthStrategy — defines the interface every authentication strategy must implement.
 * Concrete strategies (JWT, Local, API Key) implement authenticate(req).
 */
class AuthStrategy {
    /**
     * Extract and verify credentials from the request.
     * @param {import('express').Request} req
     * @returns {Promise<{ id: string } | null>} decoded payload, or null on failure
     */
    // eslint-disable-next-line no-unused-vars
    async authenticate(req) {
        throw new Error('AuthStrategy.authenticate() must be implemented by subclass');
    }
}

module.exports = AuthStrategy;

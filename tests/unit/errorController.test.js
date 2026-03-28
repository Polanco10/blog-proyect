const AppError = require('../../utils/appError');

// Mock logger to avoid file-system writes during tests
jest.mock('../../utils/logger', () => ({
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
}));

const errorController = require('../../controllers/errorController');

function makeRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.cookie = jest.fn().mockReturnValue(res);
    return res;
}

describe('errorController', () => {
    const next = jest.fn();

    describe('development / test mode', () => {
        beforeAll(() => {
            process.env.NODE_ENV = 'test';
        });

        it('returns full error details for operational errors', () => {
            const err = new AppError('Not found', 404);
            const res = makeRes();
            errorController(err, {}, res, next);
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'fail', message: 'Not found' }));
        });

        it('returns 500 for non-operational errors', () => {
            const err = new Error('Unexpected crash');
            err.statusCode = 500;
            err.status = 'error';
            const res = makeRes();
            errorController(err, {}, res, next);
            expect(res.status).toHaveBeenCalledWith(500);
        });

        it('defaults statusCode to 500 when not set', () => {
            const err = new Error('No code');
            const res = makeRes();
            errorController(err, {}, res, next);
            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    describe('production mode', () => {
        beforeAll(() => {
            process.env.NODE_ENV = 'production';
        });
        afterAll(() => {
            process.env.NODE_ENV = 'test';
        });

        it('returns safe message for operational errors', () => {
            const err = new AppError('Validation failed', 400);
            const res = makeRes();
            errorController(err, { requestId: 'test-id' }, res, next);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Validation failed' }));
        });

        it('returns generic message for non-operational errors', () => {
            const err = new Error('DB crashed');
            err.statusCode = 500;
            err.status = 'error';
            const res = makeRes();
            errorController(err, { requestId: 'test-id' }, res, next);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Something is wrong!' }));
        });

        it('handles CastError (invalid MongoDB ObjectId)', () => {
            const err = new Error('Cast error');
            err.name = 'CastError';
            err.path = '_id';
            err.value = 'bad-id';
            const res = makeRes();
            errorController(err, { requestId: 'x' }, res, next);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ message: expect.stringContaining('Invalid') })
            );
        });

        it('handles duplicate key error (code 11000)', () => {
            const err = new Error('Duplicate');
            err.code = 11000;
            err.errmsg = 'dup key: { email: "test@test.com" }';
            const res = makeRes();
            errorController(err, { requestId: 'x' }, res, next);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ message: expect.stringContaining('Duplicate') })
            );
        });

        it('handles JWT invalid token error', () => {
            const err = new Error('invalid signature');
            err.name = 'JsonWebTokenError';
            const res = makeRes();
            errorController(err, { requestId: 'x' }, res, next);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ message: expect.stringContaining('Invalid token') })
            );
        });

        it('handles JWT expired token error', () => {
            const err = new Error('jwt expired');
            err.name = 'TokenExpiredError';
            const res = makeRes();
            errorController(err, { requestId: 'x' }, res, next);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ message: expect.stringContaining('expired') })
            );
        });
    });
});

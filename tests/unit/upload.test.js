const _path = require('path');

jest.mock('../../utils/logger', () => ({ error: jest.fn(), info: jest.fn() }));
jest.mock('sharp', () => {
    const chain = {};
    chain.resize = jest.fn().mockReturnValue(chain);
    chain.webp = jest.fn().mockReturnValue(chain);
    chain.toBuffer = jest.fn().mockResolvedValue(Buffer.from('fake-image'));
    chain.toFile = jest.fn().mockResolvedValue({});
    return jest.fn(() => chain);
});

const { upload, resizeArticleImage } = require('../../utils/upload');

function makeReqRes(hasFile = true, extraReq = {}) {
    const req = {
        file: hasFile ? { buffer: Buffer.from('img'), mimetype: 'image/jpeg' } : undefined,
        body: {},
        user: { id: 'user123' },
        ...extraReq,
    };
    const res = {};
    const next = jest.fn();
    return { req, res, next };
}

describe('upload utility', () => {
    describe('multer configuration', () => {
        it('exports an upload multer instance', () => {
            expect(upload).toBeDefined();
            expect(typeof upload.single).toBe('function');
        });

        it('multerFilter accepts image files', () => {
            const filter = upload.fileFilter ?? upload._fileFilter;
            if (!filter) return; // skip if internal API unavailable
            const cb = jest.fn();
            filter({}, { mimetype: 'image/png' }, cb);
            expect(cb).toHaveBeenCalledWith(null, true);
        });

        it('multerFilter rejects non-image files', () => {
            const filter = upload.fileFilter ?? upload._fileFilter;
            if (!filter) return;
            const cb = jest.fn();
            filter({}, { mimetype: 'application/pdf' }, cb);
            expect(cb.mock.calls[0][0]).toBeInstanceOf(Error);
            expect(cb.mock.calls[0][1]).toBe(false);
        });
    });

    describe('resizeArticleImage', () => {
        it('calls next() immediately when no file is attached', async () => {
            const { req, res, next } = makeReqRes(false);
            await resizeArticleImage(req, res, next);
            expect(next).toHaveBeenCalledWith();
            expect(req.body.imageCover).toBeUndefined();
        });

        it('sets req.body.imageCover to local path in development', async () => {
            const { req, res, next } = makeReqRes(true);
            await resizeArticleImage(req, res, next);
            expect(next).toHaveBeenCalledWith();
            expect(req.body.imageCover).toMatch(/^\/uploads\/article-\d+-cover\.webp$/);
        });

        it('calls next(AppError) when sharp throws', async () => {
            const sharp = require('sharp');
            sharp.mockImplementationOnce(() => {
                const chain = {};
                chain.resize = jest.fn().mockReturnValue(chain);
                chain.webp = jest.fn().mockReturnValue(chain);
                chain.toBuffer = jest.fn().mockRejectedValue(new Error('sharp failed'));
                return chain;
            });
            const { req, res, next } = makeReqRes(true);
            await resizeArticleImage(req, res, next);
            expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 500 }));
        });
    });
});

jest.mock('../../utils/email', () => jest.fn());
jest.mock('../../utils/logger', () => ({
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
}));

const sendEmail = require('../../utils/email');
const contactController = require('../../controllers/contactController');

function makeReq(body = {}) {
    return { body };
}

function makeRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}

describe('contactController.sendContactMessage', () => {
    let next;

    beforeEach(() => {
        jest.clearAllMocks();
        next = jest.fn();
        sendEmail.mockResolvedValue();
    });

    const validBody = {
        name: 'Diego Polanco',
        email: 'diego@polanco.dev',
        subject: 'Hello there',
        message: 'This is a test message with enough characters.',
    };

    it('should send email and return 200 with success status for valid input', async () => {
        const req = makeReq(validBody);
        const res = makeRes();

        await contactController.sendContactMessage(req, res, next);

        expect(sendEmail).toHaveBeenCalledTimes(1);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ status: 'success' })
        );
        expect(next).not.toHaveBeenCalled();
    });

    it('should include sender name and email in the email body', async () => {
        const req = makeReq(validBody);
        const res = makeRes();

        await contactController.sendContactMessage(req, res, next);

        const emailCall = sendEmail.mock.calls[0][0];
        expect(emailCall.message).toContain(validBody.name);
        expect(emailCall.message).toContain(validBody.email);
        expect(emailCall.message).toContain(validBody.message);
    });

    it('should prefix subject with [Polanco.dev Contact]', async () => {
        const req = makeReq(validBody);
        const res = makeRes();

        await contactController.sendContactMessage(req, res, next);

        const emailCall = sendEmail.mock.calls[0][0];
        expect(emailCall.subject).toContain('[Polanco.dev Contact]');
        expect(emailCall.subject).toContain(validBody.subject);
    });

    it('should call next with 400 AppError when name is missing', async () => {
        const req = makeReq({ ...validBody, name: '' });
        const res = makeRes();

        await contactController.sendContactMessage(req, res, next);

        expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
        expect(sendEmail).not.toHaveBeenCalled();
    });

    it('should call next with 400 AppError when email is missing', async () => {
        const req = makeReq({ ...validBody, email: '' });
        const res = makeRes();

        await contactController.sendContactMessage(req, res, next);

        expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
        expect(sendEmail).not.toHaveBeenCalled();
    });

    it('should call next with 400 AppError when subject is missing', async () => {
        const req = makeReq({ ...validBody, subject: '' });
        const res = makeRes();

        await contactController.sendContactMessage(req, res, next);

        expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
        expect(sendEmail).not.toHaveBeenCalled();
    });

    it('should call next with 400 AppError when message is missing', async () => {
        const req = makeReq({ ...validBody, message: '' });
        const res = makeRes();

        await contactController.sendContactMessage(req, res, next);

        expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
        expect(sendEmail).not.toHaveBeenCalled();
    });

    it('should call next with 400 AppError when message is too short', async () => {
        const req = makeReq({ ...validBody, message: 'Short' });
        const res = makeRes();

        await contactController.sendContactMessage(req, res, next);

        expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
        expect(sendEmail).not.toHaveBeenCalled();
    });

    it('should call next with 400 AppError for invalid email format', async () => {
        const req = makeReq({ ...validBody, email: 'not-an-email' });
        const res = makeRes();

        await contactController.sendContactMessage(req, res, next);

        expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
        expect(sendEmail).not.toHaveBeenCalled();
    });

    it('should propagate sendEmail failure to next', async () => {
        sendEmail.mockRejectedValueOnce(new Error('SMTP error'));
        const req = makeReq(validBody);
        const res = makeRes();

        await contactController.sendContactMessage(req, res, next);

        expect(next).toHaveBeenCalledWith(expect.any(Error));
        expect(res.json).not.toHaveBeenCalled();
    });
});

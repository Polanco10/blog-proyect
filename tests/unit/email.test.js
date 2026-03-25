const sendMailMock = jest.fn().mockResolvedValue({ messageId: 'test-id' });
const createTransportMock = jest.fn().mockReturnValue({ sendMail: sendMailMock });

jest.mock('nodemailer', () => ({
    createTransport: createTransportMock,
}));

const sendEmail = require('../../utils/email');

describe('sendEmail utility', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        jest.clearAllMocks();
        process.env = {
            ...originalEnv,
            EMAIL_HOST: 'smtp.mailtrap.io',
            EMAIL_PORT: '25',
            EMAIL_USERNAME: 'testuser',
            EMAIL_PASSWORD: 'testpass',
        };
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    it('should create a nodemailer transporter with env config', async () => {
        await sendEmail({ email: 'to@example.com', subject: 'Test', message: 'Hello' });

        expect(createTransportMock).toHaveBeenCalledWith({
            host: 'smtp.mailtrap.io',
            port: '25',
            auth: {
                user: 'testuser',
                pass: 'testpass',
            },
        });
    });

    it('should call sendMail with correct from, to, subject and text', async () => {
        const options = {
            email: 'recipient@example.com',
            subject: 'Hello from Polanco.dev',
            message: 'This is the email body.',
        };

        await sendEmail(options);

        expect(sendMailMock).toHaveBeenCalledWith(
            expect.objectContaining({
                to: 'recipient@example.com',
                subject: 'Hello from Polanco.dev',
                text: 'This is the email body.',
            })
        );
    });

    it('should include a from field in the mail options', async () => {
        await sendEmail({ email: 'x@x.com', subject: 'S', message: 'M' });

        const callArgs = sendMailMock.mock.calls[0][0];
        expect(callArgs.from).toBeDefined();
        expect(typeof callArgs.from).toBe('string');
    });

    it('should propagate errors thrown by sendMail', async () => {
        sendMailMock.mockRejectedValueOnce(new Error('SMTP connection refused'));

        await expect(
            sendEmail({ email: 'a@b.com', subject: 'S', message: 'M' })
        ).rejects.toThrow('SMTP connection refused');
    });

    it('should call sendMail exactly once per invocation', async () => {
        await sendEmail({ email: 'a@b.com', subject: 'S', message: 'M' });
        await sendEmail({ email: 'c@d.com', subject: 'S2', message: 'M2' });

        expect(sendMailMock).toHaveBeenCalledTimes(2);
    });
});

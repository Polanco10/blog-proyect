const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../../models/userModel');

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

afterEach(async () => {
    await User.deleteMany({});
});

describe('User Model', () => {
    const validUserData = {
        name: 'Diego Polanco',
        email: 'diego@test.com',
        password: 'password123',
        passwordConfirm: 'password123',
    };

    it('should create a valid user correctly', async () => {
        const user = await User.create(validUserData);
        expect(user._id).toBeDefined();
        expect(user.name).toBe('Diego Polanco');
        expect(user.email).toBe('diego@test.com');
        expect(user.role).toBe('user');
    });

    it('should hash the password on save', async () => {
        const user = await User.create(validUserData);
        const savedUser = await User.findById(user._id).select('+password');
        expect(savedUser.password).not.toBe('password123');
        expect(savedUser.password).toMatch(/^\$2a\$/);
    });

    it('should fail without a required name', async () => {
        const userData = { ...validUserData, name: undefined };
        await expect(User.create(userData)).rejects.toThrow();
    });

    it('should fail without a required email', async () => {
        const userData = { ...validUserData, email: undefined };
        await expect(User.create(userData)).rejects.toThrow();
    });

    it('should fail with an invalid email', async () => {
        const userData = { ...validUserData, email: 'not-an-email' };
        await expect(User.create(userData)).rejects.toThrow();
    });

    it('should fail when passwords do not match', async () => {
        const userData = { ...validUserData, passwordConfirm: 'different123' };
        await expect(User.create(userData)).rejects.toThrow();
    });

    it('should fail with a password shorter than 8 characters', async () => {
        const userData = { ...validUserData, password: 'short', passwordConfirm: 'short' };
        await expect(User.create(userData)).rejects.toThrow();
    });

    it('should fail with a duplicate email', async () => {
        await User.create(validUserData);
        await expect(User.create(validUserData)).rejects.toThrow();
    });

    it('correctPassword method should compare passwords correctly', async () => {
        const user = await User.create(validUserData);
        const savedUser = await User.findById(user._id).select('+password');
        const isCorrect = await savedUser.correctPassword('password123', savedUser.password);
        expect(isCorrect).toBe(true);
        const isWrong = await savedUser.correctPassword('wrongpassword', savedUser.password);
        expect(isWrong).toBe(false);
    });

    it('should convert the email to lowercase', async () => {
        const userData = { ...validUserData, email: 'DIEGO@TEST.COM' };
        const user = await User.create(userData);
        expect(user.email).toBe('diego@test.com');
    });

    it('should assign the "user" role by default', async () => {
        const user = await User.create(validUserData);
        expect(user.role).toBe('user');
    });

    it('should allow creating an admin user', async () => {
        const userData = { ...validUserData, role: 'admin' };
        const user = await User.create(userData);
        expect(user.role).toBe('admin');
    });
});

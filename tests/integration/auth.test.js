const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Set env vars BEFORE requiring app modules
process.env.JWT_SECRET = 'test-secret-key-for-automated-testing';
process.env.JWT_EXPIRES_IN = '1d';
process.env.JWT_COOKIE_EXPIRES_IN = '1';
process.env.NODE_ENV = 'test';

jest.setTimeout(60000);

let mongoServer;
let app;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());

    // Clear module cache so app.js picks up test NODE_ENV
    delete require.cache[require.resolve('../../app')];
    app = require('../../app');
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

afterEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        await collections[key].deleteMany({});
    }
});

describe('Auth API - /api/v1/users', () => {
    const testUser = {
        name: 'Test User',
        email: 'test@devblog.com',
        password: 'password123',
        passwordConfirm: 'password123',
    };

    describe('POST /signup', () => {
        it('should register a new user and return a JWT token', async () => {
            const res = await request(app).post('/api/v1/users/signup').send(testUser);
            expect(res.statusCode).toBe(201);
            expect(res.body.status).toBe('success');
            expect(res.body.token).toBeDefined();
            expect(res.body.data.user.name).toBe('Test User');
            expect(res.body.data.user.email).toBe('test@devblog.com');
            expect(res.body.data.user.password).toBeUndefined();
        });
    });

    describe('POST /login', () => {
        it('should log in with valid credentials and return a JWT', async () => {
            // Primero crear el usuario
            await request(app).post('/api/v1/users/signup').send(testUser);

            const res = await request(app)
                .post('/api/v1/users/login')
                .send({ email: 'test@devblog.com', password: 'password123' });
            expect(res.statusCode).toBe(200);
            expect(res.body.status).toBe('success');
            expect(res.body.token).toBeDefined();
        });
    });

    describe('Public GET Routes', () => {
        it('should allow GET access to /articles without a token', async () => {
            const res = await request(app).get('/api/v1/articles');
            expect(res.statusCode).toBe(200);
            expect(res.body.status).toBe('success');
        });

        it('should allow GET access to /quicktips without a token', async () => {
            const res = await request(app).get('/api/v1/quicktips');
            expect(res.statusCode).toBe(200);
            expect(res.body.status).toBe('success');
        });

        it('should allow GET access to /cheatsheets without a token', async () => {
            const res = await request(app).get('/api/v1/cheatsheets');
            expect(res.statusCode).toBe(200);
            expect(res.body.status).toBe('success');
        });

        it('should allow GET access to /experiences without a token', async () => {
            const res = await request(app).get('/api/v1/experiences');
            expect(res.statusCode).toBe(200);
            expect(res.body.status).toBe('success');
        });
    });

    describe('Full flow: Signup → Login → Create Article', () => {
        it('should complete the auth flow and create an article as admin', async () => {
            // 1. Signup
            const signupRes = await request(app)
                .post('/api/v1/users/signup')
                .send({ ...testUser, email: 'admin@devblog.com' });
            expect(signupRes.statusCode).toBe(201);
            const token = signupRes.body.token;
            const userId = signupRes.body.data.user.id;

            // 2. Promover a admin directamente en DB
            const User = require('../../models/userModel');
            await User.findByIdAndUpdate(userId, { role: 'admin' });

            // 3. Crear artículo con token válido
            const articleRes = await request(app)
                .post('/api/v1/articles')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    title: 'Artículo de prueba automatizada',
                    description: 'Este artículo fue creado por un test automatizado con Jest y Supertest',
                    category: 'Programacion',
                    author: userId,
                });
            expect(articleRes.statusCode).toBe(201);
            expect(articleRes.body.status).toBe('success');
            expect(articleRes.body.data.article.title).toBe('Artículo de prueba automatizada');
        });
    });
});

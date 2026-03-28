/**
 * Integration tests for the Comments system:
 * - Public: list approved
 * - Admin: post new (pending), list pending, approve, delete
 */
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

process.env.JWT_SECRET = 'test-secret-comments';
process.env.JWT_EXPIRES_IN = '1d';
process.env.JWT_COOKIE_EXPIRES_IN = '1';
process.env.NODE_ENV = 'test';

jest.setTimeout(30000);

let mongoServer;
let app;
let adminToken;
let articleId;
let commentId;

function slugFromTitle(title) {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());

    delete require.cache[require.resolve('../../app')];
    app = require('../../app');

    const User = require('../../models/userModel');
    await User.create({
        name: 'Admin Comments',
        email: 'admin_comments@test.com',
        password: 'password123',
        passwordConfirm: 'password123',
        role: 'admin',
    });

    const loginRes = await request(app)
        .post('/api/v1/users/login')
        .send({ email: 'admin_comments@test.com', password: 'password123' });
    adminToken = loginRes.body.token;

    // Create an article to attach comments to
    const articleRes = await request(app)
        .post('/api/v1/articles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
            title: 'Articulo para comentarios test',
            description: 'Descripción del artículo de prueba para comentarios.',
            category: 'Programacion',
        });
    // _id is hidden from response; derive slug from title for routing
    articleId = slugFromTitle('Articulo para comentarios test');
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

describe('GET /api/v1/articles/:articleId/comments', () => {
    it('should return an empty list of approved comments', async () => {
        const res = await request(app).get(`/api/v1/articles/${articleId}/comments`);
        expect(res.statusCode).toBe(200);
        expect(res.body.data.comments).toHaveLength(0);
    });
});

describe('POST /api/v1/articles/:articleId/comments', () => {
    it('should create a comment in pending state', async () => {
        const res = await request(app)
            .post(`/api/v1/articles/${articleId}/comments`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ author: 'Tester', email: 'tester@test.com', body: 'Excelente artículo!' });
        expect(res.statusCode).toBe(201);
        expect(res.body.data.comment.approved).toBe(false);
        commentId = res.body.data.comment.id;
    });

    it('a pending comment should not appear in the public listing', async () => {
        const res = await request(app).get(`/api/v1/articles/${articleId}/comments`);
        expect(res.body.data.comments).toHaveLength(0);
    });

    it('should reject a comment without a body', async () => {
        const res = await request(app)
            .post(`/api/v1/articles/${articleId}/comments`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ author: 'Tester', email: 'tester@test.com' });
        expect(res.statusCode).toBe(400);
    });
});

describe('GET /api/v1/articles/:articleId/comments/pending — admin pending list', () => {
    it('should require authentication', async () => {
        const res = await request(app).get(`/api/v1/articles/${articleId}/comments/pending`);
        expect(res.statusCode).toBe(401);
    });

    it('should return pending comments for an admin', async () => {
        const res = await request(app)
            .get(`/api/v1/articles/${articleId}/comments/pending`)
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.data.comments.length).toBeGreaterThan(0);
    });
});

describe('PATCH /api/v1/articles/:articleId/comments/:id/approve — approve comment', () => {
    it('should approve the comment', async () => {
        const res = await request(app)
            .patch(`/api/v1/articles/${articleId}/comments/${commentId}/approve`)
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.data.comment.approved).toBe(true);
    });

    it('the approved comment should appear in the public listing', async () => {
        const res = await request(app).get(`/api/v1/articles/${articleId}/comments`);
        expect(res.body.data.comments).toHaveLength(1);
        expect(res.body.data.comments[0].id).toBe(commentId);
    });
});

describe('DELETE /api/v1/articles/:articleId/comments/:id', () => {
    it('should delete the comment (admin)', async () => {
        const res = await request(app)
            .delete(`/api/v1/articles/${articleId}/comments/${commentId}`)
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.statusCode).toBe(204);
    });

    it('the deleted comment should not appear in the public listing', async () => {
        const res = await request(app).get(`/api/v1/articles/${articleId}/comments`);
        expect(res.body.data.comments).toHaveLength(0);
    });
});

/**
 * Integration tests for the Comments system:
 * - Public: list approved, post new (pending)
 * - Admin: list pending, approve, delete
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
    articleId = articleRes.body.data.article._id;
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

describe('GET /api/v1/articles/:articleId/comments', () => {
    it('debería retornar lista vacía de comentarios aprobados', async () => {
        const res = await request(app).get(`/api/v1/articles/${articleId}/comments`);
        expect(res.statusCode).toBe(200);
        expect(res.body.data.comments).toHaveLength(0);
    });
});

describe('POST /api/v1/articles/:articleId/comments', () => {
    it('debería crear un comentario en estado pendiente', async () => {
        const res = await request(app)
            .post(`/api/v1/articles/${articleId}/comments`)
            .send({ author: 'Tester', email: 'tester@test.com', body: 'Excelente artículo!' });
        expect(res.statusCode).toBe(201);
        expect(res.body.data.comment.approved).toBe(false);
        commentId = res.body.data.comment._id;
    });

    it('el comentario pendiente no debería aparecer en la lista pública', async () => {
        const res = await request(app).get(`/api/v1/articles/${articleId}/comments`);
        expect(res.body.data.comments).toHaveLength(0);
    });

    it('debería rechazar comentario sin body', async () => {
        const res = await request(app)
            .post(`/api/v1/articles/${articleId}/comments`)
            .send({ author: 'Tester', email: 'tester@test.com' });
        expect(res.statusCode).toBe(400);
    });
});

describe('GET /api/v1/articles/:articleId/comments/pending — admin pending list', () => {
    it('debería requerir autenticación', async () => {
        const res = await request(app).get(`/api/v1/articles/${articleId}/comments/pending`);
        expect(res.statusCode).toBe(401);
    });

    it('debería retornar comentarios pendientes para admin', async () => {
        const res = await request(app)
            .get(`/api/v1/articles/${articleId}/comments/pending`)
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.data.comments.length).toBeGreaterThan(0);
    });
});

describe('PATCH /api/v1/articles/:articleId/comments/:id/approve — approve comment', () => {
    it('debería aprobar el comentario', async () => {
        const res = await request(app)
            .patch(`/api/v1/articles/${articleId}/comments/${commentId}/approve`)
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.data.comment.approved).toBe(true);
    });

    it('el comentario aprobado debería aparecer en la lista pública', async () => {
        const res = await request(app).get(`/api/v1/articles/${articleId}/comments`);
        expect(res.body.data.comments).toHaveLength(1);
        expect(res.body.data.comments[0]._id).toBe(commentId);
    });
});

describe('DELETE /api/v1/articles/:articleId/comments/:id', () => {
    it('debería eliminar el comentario (admin)', async () => {
        const res = await request(app)
            .delete(`/api/v1/articles/${articleId}/comments/${commentId}`)
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.statusCode).toBe(204);
    });

    it('el comentario eliminado no debería aparecer en la lista pública', async () => {
        const res = await request(app).get(`/api/v1/articles/${articleId}/comments`);
        expect(res.body.data.comments).toHaveLength(0);
    });
});

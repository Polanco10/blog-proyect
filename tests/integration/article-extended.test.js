/**
 * Extended integration tests for articles:
 * - PATCH validation (partial update)
 * - Full-text search
 * - Drafts endpoint
 * - Like / view increment
 * - Related articles
 */
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

process.env.JWT_SECRET = 'test-secret-extended';
process.env.JWT_EXPIRES_IN = '1d';
process.env.JWT_COOKIE_EXPIRES_IN = '1';
process.env.NODE_ENV = 'test';

jest.setTimeout(30000);

let mongoServer;
let app;
let adminToken;
let articleId;

const ARTICLE_BASE = {
    title: 'Guia de Testing en Node',
    description: 'Aprende a testear aplicaciones Node.js con Jest y supertest.',
    category: 'Programacion',
    content: 'El testing es fundamental para asegurar la calidad del codigo.',
};

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());

    delete require.cache[require.resolve('../../app')];
    app = require('../../app');

    const User = require('../../models/userModel');
    await User.create({
        name: 'Admin Extended',
        email: 'admin_ext@test.com',
        password: 'password123',
        passwordConfirm: 'password123',
        role: 'admin',
    });

    const res = await request(app)
        .post('/api/v1/users/login')
        .send({ email: 'admin_ext@test.com', password: 'password123' });
    adminToken = res.body.token;

    // Create a published article for use in tests
    const created = await request(app)
        .post('/api/v1/articles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(ARTICLE_BASE);
    articleId = created.body.data.article._id;
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

// ─── PATCH Validation ────────────────────────────────────────────────────────

describe('PATCH /api/v1/articles/:id — partial update validation', () => {
    it('debería actualizar solo el título sin requerir otros campos', async () => {
        const res = await request(app)
            .patch(`/api/v1/articles/${articleId}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ title: 'Guia Actualizada de Testing' });
        expect(res.statusCode).toBe(200);
        expect(res.body.data.article.title).toBe('Guia Actualizada de Testing');
    });

    it('debería rechazar un título demasiado corto', async () => {
        const res = await request(app)
            .patch(`/api/v1/articles/${articleId}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ title: 'Corto' });
        expect(res.statusCode).toBe(400);
    });

    it('debería rechazar una categoría inválida', async () => {
        const res = await request(app)
            .patch(`/api/v1/articles/${articleId}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ category: 'InvalidCategory' });
        expect(res.statusCode).toBe(400);
    });
});

// ─── View Increment ───────────────────────────────────────────────────────────

describe('PATCH /api/v1/articles/:id/view — view counter', () => {
    it('debería incrementar las vistas del artículo', async () => {
        const before = await request(app).get(`/api/v1/articles/${articleId}`);
        const viewsBefore = before.body.data.article.views ?? 0;

        await request(app).patch(`/api/v1/articles/${articleId}/view`).send();

        const after = await request(app).get(`/api/v1/articles/${articleId}`);
        expect(after.body.data.article.views).toBe(viewsBefore + 1);
    });
});

// ─── Like ────────────────────────────────────────────────────────────────────

describe('PATCH /api/v1/articles/:id/like — like counter', () => {
    it('debería incrementar los likes del artículo', async () => {
        const before = await request(app).get(`/api/v1/articles/${articleId}`);
        const likesBefore = before.body.data.article.likes ?? 0;

        const res = await request(app)
            .patch(`/api/v1/articles/${articleId}/like`)
            .send();
        expect(res.statusCode).toBe(200);

        const after = await request(app).get(`/api/v1/articles/${articleId}`);
        expect(after.body.data.article.likes).toBe(likesBefore + 1);
    });
});

// ─── Related Articles ────────────────────────────────────────────────────────

describe('GET /api/v1/articles/:id/related — related articles', () => {
    it('debería retornar artículos relacionados (array)', async () => {
        const res = await request(app).get(`/api/v1/articles/${articleId}/related`);
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body.data.articles)).toBe(true);
    });
});

// ─── Drafts ──────────────────────────────────────────────────────────────────

describe('GET /api/v1/articles/drafts — drafts endpoint', () => {
    it('debería requerir autenticación admin', async () => {
        const res = await request(app).get('/api/v1/articles/drafts');
        expect(res.statusCode).toBe(401);
    });

    it('debería retornar drafts para admin autenticado', async () => {
        const res = await request(app)
            .get('/api/v1/articles/drafts')
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.status).toBe('success');
    });

    it('debería crear un draft (published: false) y aparece en /drafts', async () => {
        await request(app)
            .post('/api/v1/articles')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ ...ARTICLE_BASE, title: 'Draft Article Test Title', published: false });

        const res = await request(app)
            .get('/api/v1/articles/drafts')
            .set('Authorization', `Bearer ${adminToken}`);
        const titles = res.body.data.articles.map((a) => a.title);
        expect(titles).toContain('Draft Article Test Title');
    });

    it('los drafts no deberían aparecer en la lista pública', async () => {
        const res = await request(app).get('/api/v1/articles');
        const titles = res.body.data.articles.map((a) => a.title);
        expect(titles).not.toContain('Draft Article Test Title');
    });
});

// ─── Search ───────────────────────────────────────────────────────────────────

describe('GET /api/v1/articles/search — text search', () => {
    it('debería retornar 200 con q param', async () => {
        const res = await request(app).get('/api/v1/articles/search?q=testing');
        expect(res.statusCode).toBe(200);
        expect(res.body.status).toBe('success');
    });

    it('debería retornar 400 sin q param', async () => {
        const res = await request(app).get('/api/v1/articles/search');
        expect(res.statusCode).toBe(400);
    });
});

// ─── Admin Stats ─────────────────────────────────────────────────────────────

describe('GET /api/v1/articles/admin/stats', () => {
    it('debería retornar estadísticas con token admin', async () => {
        const res = await request(app)
            .get('/api/v1/articles/admin/stats')
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.data).toBeDefined();
    });

    it('debería rechazar sin token', async () => {
        const res = await request(app).get('/api/v1/articles/admin/stats');
        expect(res.statusCode).toBe(401);
    });
});

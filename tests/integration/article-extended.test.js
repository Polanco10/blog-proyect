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

function slugFromTitle(title) {
    return title
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

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
    await request(app).post('/api/v1/articles').set('Authorization', `Bearer ${adminToken}`).send(ARTICLE_BASE);
    // _id is hidden from response; derive slug from title for routing
    articleId = slugFromTitle(ARTICLE_BASE.title);
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

// ─── PATCH Validation ────────────────────────────────────────────────────────

describe('PATCH /api/v1/articles/:id — partial update validation', () => {
    it('should update only the title without requiring other fields', async () => {
        const res = await request(app)
            .patch(`/api/v1/articles/${articleId}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ title: 'Guia Actualizada de Testing' });
        expect(res.statusCode).toBe(200);
        expect(res.body.data.article.title).toBe('Guia Actualizada de Testing');
        // Slug changes when title changes — update for subsequent tests
        articleId = slugFromTitle('Guia Actualizada de Testing');
    });

    it('should reject a title that is too short', async () => {
        const res = await request(app)
            .patch(`/api/v1/articles/${articleId}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ title: 'Corto' });
        expect(res.statusCode).toBe(400);
    });

    it('should reject an invalid category', async () => {
        const res = await request(app)
            .patch(`/api/v1/articles/${articleId}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ category: 'InvalidCategory' });
        expect(res.statusCode).toBe(400);
    });
});

// ─── View Increment ───────────────────────────────────────────────────────────

describe('PATCH /api/v1/articles/:id/view — view counter', () => {
    it('should increment the article view count', async () => {
        const before = await request(app).get(`/api/v1/articles/${articleId}`);
        const viewsBefore = before.body.data.article.views ?? 0;

        await request(app)
            .patch(`/api/v1/articles/${articleId}/view`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send();

        const after = await request(app).get(`/api/v1/articles/${articleId}`);
        expect(after.body.data.article.views).toBe(viewsBefore + 1);
    });
});

// ─── Like ────────────────────────────────────────────────────────────────────

describe('PATCH /api/v1/articles/:id/like — like counter', () => {
    it('should increment the article like count', async () => {
        const before = await request(app).get(`/api/v1/articles/${articleId}`);
        const likesBefore = before.body.data.article.likes ?? 0;

        const res = await request(app)
            .patch(`/api/v1/articles/${articleId}/like`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send();
        expect(res.statusCode).toBe(200);

        const after = await request(app).get(`/api/v1/articles/${articleId}`);
        expect(after.body.data.article.likes).toBe(likesBefore + 1);
    });
});

// ─── Related Articles ────────────────────────────────────────────────────────

describe('GET /api/v1/articles/:id/related — related articles', () => {
    it('should return related articles as an array', async () => {
        const res = await request(app).get(`/api/v1/articles/${articleId}/related`);
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body.data.articles)).toBe(true);
    });
});

// ─── Drafts ──────────────────────────────────────────────────────────────────

describe('GET /api/v1/articles/drafts — drafts endpoint', () => {
    it('should require admin authentication', async () => {
        const res = await request(app).get('/api/v1/articles/drafts');
        expect(res.statusCode).toBe(401);
    });

    it('should return drafts for an authenticated admin', async () => {
        const res = await request(app).get('/api/v1/articles/drafts').set('Authorization', `Bearer ${adminToken}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.status).toBe('success');
    });

    it('should create a draft (published: false) and have it appear in /drafts', async () => {
        await request(app)
            .post('/api/v1/articles')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ ...ARTICLE_BASE, title: 'Draft Article Test Title', published: false });

        const res = await request(app).get('/api/v1/articles/drafts').set('Authorization', `Bearer ${adminToken}`);
        const titles = res.body.data.articles.map(a => a.title);
        expect(titles).toContain('Draft Article Test Title');
    });

    it('drafts should not appear in the public listing', async () => {
        const res = await request(app).get('/api/v1/articles');
        const titles = res.body.data.articles.map(a => a.title);
        expect(titles).not.toContain('Draft Article Test Title');
    });
});

// ─── Search ───────────────────────────────────────────────────────────────────

describe('GET /api/v1/articles/search — text search', () => {
    it('should return 200 with a q param', async () => {
        const res = await request(app).get('/api/v1/articles/search?q=testing');
        expect(res.statusCode).toBe(200);
        expect(res.body.status).toBe('success');
    });

    it('should return 400 without a q param', async () => {
        const res = await request(app).get('/api/v1/articles/search');
        expect(res.statusCode).toBe(400);
    });
});

// ─── Admin Stats ─────────────────────────────────────────────────────────────

describe('GET /api/v1/articles/admin/stats', () => {
    it('should return stats with an admin token', async () => {
        const res = await request(app).get('/api/v1/articles/admin/stats').set('Authorization', `Bearer ${adminToken}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.data).toBeDefined();
    });

    it('should reject requests without a token', async () => {
        const res = await request(app).get('/api/v1/articles/admin/stats');
        expect(res.statusCode).toBe(401);
    });
});

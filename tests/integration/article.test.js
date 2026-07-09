const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

process.env.JWT_SECRET = 'test-secret-key-for-automated-testing';
process.env.JWT_EXPIRES_IN = '1d';
process.env.JWT_COOKIE_EXPIRES_IN = '1';
process.env.NODE_ENV = 'test';

jest.setTimeout(30000);

let mongoServer;
let app;
let adminToken;
let _adminId;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());

    delete require.cache[require.resolve('../../app')];
    app = require('../../app');

    const User = require('../../models/userModel');
    const adminDoc = await User.create({
        name: 'Admin User',
        email: 'admin_final@test.com',
        password: 'password123',
        passwordConfirm: 'password123',
        role: 'admin',
    });
    _adminId = adminDoc._id;

    const res = await request(app)
        .post('/api/v1/users/login')
        .send({ email: 'admin_final@test.com', password: 'password123' });
    adminToken = res.body.token;
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

function slugFromTitle(title) {
    return title
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

describe('Article API Integration', () => {
    const testArticle = {
        title: 'Test de Integración Final',
        description: 'Descripción del test.',
        category: 'Programacion',
    };
    const articleSlug = slugFromTitle(testArticle.title);

    it('should handle the full article lifecycle (GET, POST, PATCH, DELETE)', async () => {
        // 1. GET ALL (Vacio)
        const resGet = await request(app).get('/api/v1/articles');
        expect(resGet.statusCode).toBe(200);
        expect(resGet.body.data.articles).toHaveLength(0);

        // 2. POST (Crear)
        const resPost = await request(app)
            .post('/api/v1/articles')
            .set('Authorization', `Bearer ${adminToken}`)
            .send(testArticle);
        expect(resPost.statusCode).toBe(201);
        // _id is hidden from response; use slug derived from title for routing
        const articleId = articleSlug;

        // 3. PATCH (Actualizar)
        const resPatch = await request(app)
            .patch(`/api/v1/articles/${articleId}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ title: 'Título Modificado' });
        expect(resPatch.statusCode).toBe(200);
        expect(resPatch.body.data.article.title).toBe('Título Modificado');
        // Slug regenerated when title changes
        const updatedSlug = slugFromTitle('Título Modificado');

        // 4. DELETE (Eliminar)
        const resDelete = await request(app)
            .delete(`/api/v1/articles/${updatedSlug}`)
            .set('Authorization', `Bearer ${adminToken}`);
        expect(resDelete.statusCode).toBe(204);

        // 5. Verificar eliminación via slug lookup
        const Article = require('../../models/articleModel');
        const check = await Article.findOne({ slug: updatedSlug });
        expect(check).toBeNull();
    });

    it('should deny access to creation without a token', async () => {
        const res = await request(app).post('/api/v1/articles').send(testArticle);
        expect(res.statusCode).toBe(401);
    });
});

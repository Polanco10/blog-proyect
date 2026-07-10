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
let adminId;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());

    delete require.cache[require.resolve('../../app')];
    app = require('../../app');

    const User = require('../../models/userModel');
    const admin = await User.create({
        name: 'Admin User',
        email: 'admin_vis@test.com',
        password: 'password123',
        passwordConfirm: 'password123',
        role: 'admin',
    });
    adminId = admin._id;

    const res = await request(app)
        .post('/api/v1/users/login')
        .send({ email: 'admin_vis@test.com', password: 'password123' });
    adminToken = res.body.token;
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

const auth = req => req.set('Authorization', `Bearer ${adminToken}`);

describe('Visibilidad de artículos', () => {
    let publishedSlug;
    let draftSlug;

    beforeAll(async () => {
        const Article = require('../../models/articleModel');
        const pub = await Article.create({
            title: 'Articulo publicado visible',
            description: 'Un articulo visible para todos los visitantes',
            category: 'Programacion',
            author: adminId,
            content: 'contenido',
            published: true,
        });
        const draft = await Article.create({
            title: 'Articulo borrador oculto',
            description: 'Un borrador que el publico no debe ver',
            category: 'Programacion',
            author: adminId,
            content: 'contenido',
            published: false,
        });
        publishedSlug = pub.slug;
        draftSlug = draft.slug;
    });

    it('el listado público excluye borradores', async () => {
        const res = await request(app).get('/api/v1/articles');
        const titles = res.body.data.articles.map(a => a.title);
        expect(titles).toContain('Articulo publicado visible');
        expect(titles).not.toContain('Articulo borrador oculto');
    });

    it('el público NO puede pedir borradores con ?published=false', async () => {
        const res = await request(app).get('/api/v1/articles?published=false');
        expect(res.statusCode).toBe(200);
        const titles = res.body.data.articles.map(a => a.title);
        expect(titles).not.toContain('Articulo borrador oculto');
    });

    it('el detalle público de un borrador es 404', async () => {
        const res = await request(app).get(`/api/v1/articles/${draftSlug}`);
        expect(res.statusCode).toBe(404);
    });

    it('GET /articles/admin/all requiere autenticación de admin', async () => {
        const res = await request(app).get('/api/v1/articles/admin/all');
        expect(res.statusCode).toBe(401);
    });

    it('GET /articles/admin/all incluye publicados y borradores', async () => {
        const res = await auth(request(app).get('/api/v1/articles/admin/all'));
        expect(res.statusCode).toBe(200);
        const byTitle = Object.fromEntries(res.body.data.articles.map(a => [a.title, a.published]));
        expect(byTitle['Articulo publicado visible']).toBe(true);
        expect(byTitle['Articulo borrador oculto']).toBe(false);
    });

    it('el admin puede despublicar y republicar por slug (toggle)', async () => {
        // Despublicar el publicado
        const hide = await auth(request(app).patch(`/api/v1/articles/${publishedSlug}`).send({ published: false }));
        expect(hide.statusCode).toBe(200);

        const publicList = await request(app).get('/api/v1/articles');
        expect(publicList.body.data.articles.map(a => a.title)).not.toContain('Articulo publicado visible');

        // Republicar el borrador original (estaba oculto: el PATCH debe alcanzarlo igual)
        const show = await auth(request(app).patch(`/api/v1/articles/${draftSlug}`).send({ published: true }));
        expect(show.statusCode).toBe(200);
        expect(show.body.data.article.published).toBe(true);

        const publicList2 = await request(app).get('/api/v1/articles');
        expect(publicList2.body.data.articles.map(a => a.title)).toContain('Articulo borrador oculto');
    });
});

describe('Documentos legacy sin campo published', () => {
    it('un doc antiguo sin el campo cuenta como publicado (publico y admin)', async () => {
        // Insertar directo en la coleccion, sin pasar por Mongoose (sin defaults)
        await mongoose.connection.collection('quicktips').insertOne({
            title: 'Tip legacy sin campo published',
            language: 'javascript',
            codeSnippet: 'legacy();',
            slug: 'tip-legacy-sin-campo-published',
        });

        const publicRes = await request(app).get('/api/v1/quicktips');
        expect(publicRes.body.data.quicktips.map(t => t.title)).toContain('Tip legacy sin campo published');

        const adminRes = await auth(request(app).get('/api/v1/quicktips/admin/all'));
        expect(adminRes.body.data.quicktips.map(t => t.title)).toContain('Tip legacy sin campo published');
    });
});

describe('Visibilidad de quicktips', () => {
    let draftSlug;

    beforeAll(async () => {
        const QuickTip = require('../../models/quicktipModel');
        await QuickTip.create({
            title: 'Tip publicado visible',
            language: 'javascript',
            codeSnippet: 'const a = 1;',
            published: true,
        });
        const draft = await QuickTip.create({
            title: 'Tip borrador oculto',
            language: 'javascript',
            codeSnippet: 'const b = 2;',
            published: false,
        });
        draftSlug = draft.slug;
    });

    it('el listado público excluye borradores (incluso con ?published=false)', async () => {
        const res = await request(app).get('/api/v1/quicktips?published=false');
        const titles = res.body.data.quicktips.map(t => t.title);
        expect(titles).toContain('Tip publicado visible');
        expect(titles).not.toContain('Tip borrador oculto');
    });

    it('el detalle público de un borrador es 404', async () => {
        const res = await request(app).get(`/api/v1/quicktips/${draftSlug}`);
        expect(res.statusCode).toBe(404);
    });

    it('GET /quicktips/admin/all requiere admin e incluye borradores', async () => {
        const anon = await request(app).get('/api/v1/quicktips/admin/all');
        expect(anon.statusCode).toBe(401);

        const res = await auth(request(app).get('/api/v1/quicktips/admin/all'));
        expect(res.statusCode).toBe(200);
        const byTitle = Object.fromEntries(res.body.data.quicktips.map(t => [t.title, t.published]));
        expect(byTitle['Tip borrador oculto']).toBe(false);
    });

    it('el admin puede republicar un tip oculto por slug', async () => {
        const res = await auth(request(app).patch(`/api/v1/quicktips/${draftSlug}`).send({ published: true }));
        expect(res.statusCode).toBe(200);
        expect(res.body.data.quicktip.published).toBe(true);

        const publicList = await request(app).get('/api/v1/quicktips');
        expect(publicList.body.data.quicktips.map(t => t.title)).toContain('Tip borrador oculto');
    });
});

describe('Visibilidad de cheatsheets', () => {
    let draftSlug;

    beforeAll(async () => {
        const Cheatsheet = require('../../models/cheatsheetModel');
        await Cheatsheet.create({
            title: 'Cheatsheet publicada visible',
            description: 'Una cheatsheet visible para todos',
            fileUrl: 'https://example.com/visible.pdf',
            published: true,
        });
        const draft = await Cheatsheet.create({
            title: 'Cheatsheet borrador oculta',
            description: 'Una cheatsheet que el publico no debe ver',
            fileUrl: 'https://example.com/oculta.pdf',
            published: false,
        });
        draftSlug = draft.slug;
    });

    it('el listado público excluye borradores (incluso con ?published=false)', async () => {
        const res = await request(app).get('/api/v1/cheatsheets?published=false');
        const titles = res.body.data.cheatsheets.map(c => c.title);
        expect(titles).toContain('Cheatsheet publicada visible');
        expect(titles).not.toContain('Cheatsheet borrador oculta');
    });

    it('GET /cheatsheets/admin/all requiere admin e incluye borradores', async () => {
        const anon = await request(app).get('/api/v1/cheatsheets/admin/all');
        expect(anon.statusCode).toBe(401);

        const res = await auth(request(app).get('/api/v1/cheatsheets/admin/all'));
        expect(res.statusCode).toBe(200);
        const byTitle = Object.fromEntries(res.body.data.cheatsheets.map(c => [c.title, c.published]));
        expect(byTitle['Cheatsheet borrador oculta']).toBe(false);
    });

    it('el admin puede republicar una cheatsheet oculta por slug', async () => {
        const res = await auth(request(app).patch(`/api/v1/cheatsheets/${draftSlug}`).send({ published: true }));
        expect(res.statusCode).toBe(200);
        expect(res.body.data.cheatsheet.published).toBe(true);
    });
});

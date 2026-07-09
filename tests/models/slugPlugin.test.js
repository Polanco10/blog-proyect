const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Article = require('../../models/articleModel');
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
    await Article.deleteMany({});
    await User.deleteMany({});
});

describe('Slug Plugin', () => {
    const createTestUser = async () => {
        return await User.create({
            name: 'Test Author',
            email: 'author@test.com',
            password: 'password123',
            passwordConfirm: 'password123',
        });
    };

    const createArticle = async (title, user) => {
        return await Article.create({
            title,
            description: 'Esta es una descripción válida de más de 10 caracteres.',
            author: user._id,
            category: 'Programacion',
        });
    };

    it('should normalize accented vowels in the slug', async () => {
        const user = await createTestUser();
        const article = await createArticle('Operaciones atómicas en MongoDB', user);
        expect(article.slug).toBe('operaciones-atomicas-en-mongodb');
    });

    it('should normalize ñ and multiple diacritics', async () => {
        const user = await createTestUser();
        const article = await createArticle('Diseño de APIs idiomáticas', user);
        expect(article.slug).toBe('diseno-de-apis-idiomaticas');
    });

    it('should not produce leading or trailing hyphens', async () => {
        const user = await createTestUser();
        const article = await createArticle('¿Qué es la atomicidad?', user);
        expect(article.slug).toBe('que-es-la-atomicidad');
    });

    it('should keep existing slugs unchanged for titles without diacritics', async () => {
        // Títulos sembrados en data/articles/ — sus slugs en la DB no deben cambiar
        const seededTitles = {
            '6 patrones para un backend resiliente': '6-patrones-para-un-backend-resiliente',
            'Cache Invalidation y Thundering Herd': 'cache-invalidation-y-thundering-herd',
            'El problema N+1 en los ORM': 'el-problema-n-1-en-los-orm',
            'Arquitectura orientada a eventos': 'arquitectura-orientada-a-eventos',
            'Los 3 pilares de la observabilidad': 'los-3-pilares-de-la-observabilidad',
            'Transacciones: atomicidad y rollback': 'transacciones-atomicidad-y-rollback',
            'Webhooks vs WebSockets vs Polling': 'webhooks-vs-websockets-vs-polling',
        };
        const user = await createTestUser();
        for (const [title, expectedSlug] of Object.entries(seededTitles)) {
            const article = await createArticle(title, user);
            expect(article.slug).toBe(expectedSlug);
        }
    });

    it('should regenerate the slug when the title changes', async () => {
        const user = await createTestUser();
        const article = await createArticle('Título original del artículo', user);
        expect(article.slug).toBe('titulo-original-del-articulo');

        article.title = 'Título actualizado del artículo';
        await article.save();
        expect(article.slug).toBe('titulo-actualizado-del-articulo');
    });
});

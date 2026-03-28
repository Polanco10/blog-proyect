const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const QuickTip = require('../../models/quicktipModel');

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
    await QuickTip.deleteMany({});
});

describe('QuickTip Model', () => {
    const validData = {
        title: 'Destructuring en JavaScript',
        language: 'JavaScript',
        codeSnippet: 'const { name, age } = person;',
        description: 'Cómo desestructurar objetos en JS',
        seniority: 'Junior',
    };

    it('should create a valid quicktip', async () => {
        const doc = await QuickTip.create(validData);
        expect(doc._id).toBeDefined();
        expect(doc.title).toBe('Destructuring en JavaScript');
        expect(doc.language).toBe('JavaScript');
        expect(doc.seniority).toBe('Junior');
        expect(doc.views).toBe(0);
    });

    it('should fail without a required title', async () => {
        const data = { ...validData, title: undefined };
        await expect(QuickTip.create(data)).rejects.toThrow();
    });

    it('should fail without a required language', async () => {
        const data = { ...validData, language: undefined };
        await expect(QuickTip.create(data)).rejects.toThrow();
    });

    it('should fail without a required codeSnippet', async () => {
        const data = { ...validData, codeSnippet: undefined };
        await expect(QuickTip.create(data)).rejects.toThrow();
    });

    it('should default seniority to "Junior"', async () => {
        const data = { ...validData, seniority: undefined, title: 'Tip sin seniority' };
        const doc = await QuickTip.create(data);
        expect(doc.seniority).toBe('Junior');
    });

    it('should fail with an invalid seniority value', async () => {
        const data = { ...validData, seniority: 'Experto', title: 'Tip seniority malo' };
        await expect(QuickTip.create(data)).rejects.toThrow();
    });

    it('should accept valid seniority values', async () => {
        const juniorTip = await QuickTip.create({ ...validData, title: 'Tip Junior' });
        const semiTip = await QuickTip.create({ ...validData, title: 'Tip Semi', seniority: 'Semi-Senior' });
        const seniorTip = await QuickTip.create({ ...validData, title: 'Tip Senior', seniority: 'Senior' });
        expect(juniorTip.seniority).toBe('Junior');
        expect(semiTip.seniority).toBe('Semi-Senior');
        expect(seniorTip.seniority).toBe('Senior');
    });

    it('should initialize views to 0 by default', async () => {
        const doc = await QuickTip.create(validData);
        expect(doc.views).toBe(0);
    });
});

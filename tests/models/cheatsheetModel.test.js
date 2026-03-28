const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Cheatsheet = require('../../models/cheatsheetModel');

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
    await Cheatsheet.deleteMany({});
});

describe('Cheatsheet Model', () => {
    const validData = {
        title: 'Python Cheat Sheet',
        description: 'Guía rápida de comandos Python',
        category: 'Backend',
        fileUrl: 'https://example.com/python.pdf',
    };

    it('should create a valid cheatsheet', async () => {
        const doc = await Cheatsheet.create(validData);
        expect(doc._id).toBeDefined();
        expect(doc.title).toBe('Python Cheat Sheet');
        expect(doc.category).toBe('Backend');
    });

    it('should fail without a required title', async () => {
        const data = { ...validData, title: undefined };
        await expect(Cheatsheet.create(data)).rejects.toThrow();
    });

    it('should fail without a required description', async () => {
        const data = { ...validData, description: undefined };
        await expect(Cheatsheet.create(data)).rejects.toThrow();
    });

    it('should fail without a required fileUrl', async () => {
        const data = { ...validData, fileUrl: undefined };
        await expect(Cheatsheet.create(data)).rejects.toThrow();
    });

    it('should fail with a duplicate title', async () => {
        await Cheatsheet.create(validData);
        await expect(Cheatsheet.create(validData)).rejects.toThrow();
    });
});

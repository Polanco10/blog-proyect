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
    fileUrl: 'https://example.com/python.pdf'
  };

  it('debería crear un cheatsheet válido', async () => {
    const doc = await Cheatsheet.create(validData);
    expect(doc._id).toBeDefined();
    expect(doc.title).toBe('Python Cheat Sheet');
    expect(doc.category).toBe('Backend');
  });

  it('debería fallar sin título requerido', async () => {
    const data = { ...validData, title: undefined };
    await expect(Cheatsheet.create(data)).rejects.toThrow();
  });

  it('debería fallar sin descripción requerida', async () => {
    const data = { ...validData, description: undefined };
    await expect(Cheatsheet.create(data)).rejects.toThrow();
  });

  it('debería fallar sin fileUrl requerido', async () => {
    const data = { ...validData, fileUrl: undefined };
    await expect(Cheatsheet.create(data)).rejects.toThrow();
  });

  it('debería fallar con título duplicado', async () => {
    await Cheatsheet.create(validData);
    await expect(Cheatsheet.create(validData)).rejects.toThrow();
  });
});

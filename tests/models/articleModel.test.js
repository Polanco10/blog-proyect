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

describe('Article Model', () => {
  const createTestUser = async () => {
    return await User.create({
      name: 'Test Author',
      email: 'author@test.com',
      password: 'password123',
      passwordConfirm: 'password123'
    });
  };

  it('should create a valid article correctly', async () => {
    const user = await createTestUser();
    const validArticleData = {
      title: 'Título de Prueba 1',
      description: 'Esta es una descripción válida de más de 10 caracteres.',
      author: user._id,
      category: 'Programacion'
    };

    const article = await Article.create(validArticleData);
    expect(article._id).toBeDefined();
    expect(article.title).toBe('Título de Prueba 1');
    expect(article.category).toBe('Programacion');
    expect(article.views).toBe(0);
  });

  it('should fail without a required title', async () => {
    const user = await createTestUser();
    const articleData = {
      description: 'Descripción sin título',
      author: user._id
    };
    await expect(Article.create(articleData)).rejects.toThrow(/An article must have a title/);
  });

  it('should fail if the title is too short (minlength: 10)', async () => {
    const user = await createTestUser();
    const articleData = {
      title: 'Corto',
      description: 'Descripción válida',
      author: user._id
    };
    await expect(Article.create(articleData)).rejects.toThrow(/An article title must have more or equal then 10 characters/);
  });

  it('should fail if the title is too long (maxlength: 40)', async () => {
    const user = await createTestUser();
    const articleData = {
      title: 'Este es un título extremadamente largo que supera los cuarenta caracteres permitidos',
      description: 'Descripción válida',
      author: user._id
    };
    await expect(Article.create(articleData)).rejects.toThrow(/An article title must have less or equal then 40 characters/);
  });

  it('should fail without a required description', async () => {
    const user = await createTestUser();
    const articleData = {
      title: 'Título Válido',
      author: user._id
    };
    await expect(Article.create(articleData)).rejects.toThrow(/An article must have a description/);
  });

  it('should fail without a required author', async () => {
    const articleData = {
      title: 'Título Válido',
      description: 'Descripción válida'
    };
    await expect(Article.create(articleData)).rejects.toThrow(/The article must have an author/);
  });

  it('should fail with an invalid category', async () => {
    const user = await createTestUser();
    const articleData = {
      title: 'Título Válido',
      description: 'Descripción válida',
      author: user._id,
      category: 'Culinaria'
    };
    await expect(Article.create(articleData)).rejects.toThrow(/Category is either: Programacion or Idioma/);
  });

  it('should allow valid categories (Programacion, Idioma)', async () => {
    const user = await createTestUser();
    const art1 = await Article.create({
      title: 'Título Programacion',
      description: 'Descripción válida',
      author: user._id,
      category: 'Programacion'
    });
    const art2 = await Article.create({
      title: 'Título de Idioma',
      description: 'Descripción válida',
      author: user._id,
      category: 'Idioma'
    });
    expect(art1.category).toBe('Programacion');
    expect(art2.category).toBe('Idioma');
  });

  it('should fail with duplicate titles', async () => {
    const user = await createTestUser();
    const articleData = {
      title: 'Título Duplicado',
      description: 'Descripción válida',
      author: user._id
    };
    await Article.create(articleData);
    await expect(Article.create(articleData)).rejects.toThrow();
  });
});

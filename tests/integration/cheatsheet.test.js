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
let createdSlug;

const validCheatsheet = {
  title: 'Git Commands Reference',
  description: 'A comprehensive git commands reference cheatsheet.',
  fileUrl: 'https://example.com/git-cheatsheet.pdf',
  category: 'DevOps',
};

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  delete require.cache[require.resolve('../../app')];
  app = require('../../app');

  const User = require('../../models/userModel');
  await User.create({
    name: 'Admin User',
    email: 'admin_cs@test.com',
    password: 'password123',
    passwordConfirm: 'password123',
    role: 'admin',
  });

  const res = await request(app)
    .post('/api/v1/users/login')
    .send({ email: 'admin_cs@test.com', password: 'password123' });
  adminToken = res.body.token;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Cheatsheet API Integration', () => {
  it('GET /api/v1/cheatsheets — empty collection returns 200 with empty array', async () => {
    const res = await request(app).get('/api/v1/cheatsheets');
    expect(res.statusCode).toBe(200);
    expect(res.body.data.cheatsheets).toHaveLength(0);
  });

  it('POST /api/v1/cheatsheets without auth — returns 401', async () => {
    const res = await request(app).post('/api/v1/cheatsheets').send(validCheatsheet);
    expect(res.statusCode).toBe(401);
  });

  it('POST /api/v1/cheatsheets with admin token — creates cheatsheet and returns 201', async () => {
    const res = await request(app)
      .post('/api/v1/cheatsheets')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validCheatsheet);

    expect(res.statusCode).toBe(201);
    expect(res.body.data.cheatsheet.title).toBe(validCheatsheet.title);
    expect(res.body.data.cheatsheet.fileUrl).toBe(validCheatsheet.fileUrl);

    createdSlug = validCheatsheet.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  });

  it('POST /api/v1/cheatsheets with missing required field — returns 400', async () => {
    const res = await request(app)
      .post('/api/v1/cheatsheets')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'No URL here', description: 'Some description for the cheatsheet.' }); // missing fileUrl

    expect(res.statusCode).toBe(400);
  });

  it('PATCH /api/v1/cheatsheets/:id with admin — updates and returns 200', async () => {
    const res = await request(app)
      .patch(`/api/v1/cheatsheets/${createdSlug}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ category: 'Version Control' });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.cheatsheet.category).toBe('Version Control');
  });

  it('DELETE /api/v1/cheatsheets/:id with admin — returns 204; subsequent GET returns 404', async () => {
    const delRes = await request(app)
      .delete(`/api/v1/cheatsheets/${createdSlug}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(delRes.statusCode).toBe(204);

    const getRes = await request(app).get(`/api/v1/cheatsheets/${createdSlug}`);
    expect(getRes.statusCode).toBe(404);
  });
});

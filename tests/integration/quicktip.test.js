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

const validTip = {
  title: 'Arrow Functions ES6',
  language: 'JavaScript',
  codeSnippet: 'const fn = () => {};',
  seniority: 'Junior',
};

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  delete require.cache[require.resolve('../../app')];
  app = require('../../app');

  const User = require('../../models/userModel');
  await User.create({
    name: 'Admin User',
    email: 'admin_qt@test.com',
    password: 'password123',
    passwordConfirm: 'password123',
    role: 'admin',
  });

  const res = await request(app)
    .post('/api/v1/users/login')
    .send({ email: 'admin_qt@test.com', password: 'password123' });
  adminToken = res.body.token;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('QuickTip API Integration', () => {
  it('GET /api/v1/quicktips — empty collection returns 200 with empty array', async () => {
    const res = await request(app).get('/api/v1/quicktips');
    expect(res.statusCode).toBe(200);
    expect(res.body.data.quicktips).toHaveLength(0);
  });

  it('POST /api/v1/quicktips without auth — returns 401', async () => {
    const res = await request(app).post('/api/v1/quicktips').send(validTip);
    expect(res.statusCode).toBe(401);
  });

  it('POST /api/v1/quicktips with admin token — creates tip and returns 201', async () => {
    const res = await request(app)
      .post('/api/v1/quicktips')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validTip);

    expect(res.statusCode).toBe(201);
    expect(res.body.data.quicktip.title).toBe(validTip.title);
    expect(res.body.data.quicktip.language).toBe(validTip.language);

    // Store slug for subsequent tests
    createdSlug = validTip.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  });

  it('POST /api/v1/quicktips with missing required field — returns 400', async () => {
    const res = await request(app)
      .post('/api/v1/quicktips')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ language: 'JavaScript', codeSnippet: 'const x = 1;' }); // missing title

    expect(res.statusCode).toBe(400);
  });

  it('PATCH /api/v1/quicktips/:id with admin — updates and returns 200', async () => {
    const res = await request(app)
      .patch(`/api/v1/quicktips/${createdSlug}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ seniority: 'Senior' });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.quicktip.seniority).toBe('Senior');
  });

  it('DELETE /api/v1/quicktips/:id with admin — returns 204; subsequent GET returns 404', async () => {
    const delRes = await request(app)
      .delete(`/api/v1/quicktips/${createdSlug}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(delRes.statusCode).toBe(204);

    const getRes = await request(app).get(`/api/v1/quicktips/${createdSlug}`);
    expect(getRes.statusCode).toBe(404);
  });
});

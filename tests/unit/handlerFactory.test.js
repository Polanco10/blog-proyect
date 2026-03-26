jest.mock('mongoose', () => {
  const actual = jest.requireActual('mongoose');
  return { ...actual, isValidObjectId: jest.fn() };
});

const mongoose = require('mongoose');
const factory = require('../../controllers/handlerFactory');

// Drain the microtask queue so catchAsync's floating .catch(next) settles
const flushPromises = () => new Promise(resolve => setImmediate(resolve));

// ─── helpers ──────────────────────────────────────────────────────────────────

/** Build a minimal mock Mongoose model with a known collection name. */
function mockModel(collectionName, docOverride = {}) {
  const doc = { _id: new mongoose.Types.ObjectId(), ...docOverride };
  const queryObj = {
    find: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    then: (resolve) => resolve([doc]),
  };
  // findById returns a query-like object with .select() — mirrors real Mongoose
  const findByIdQuery = (resolvedDoc) => ({
    select: jest.fn().mockResolvedValue(resolvedDoc),
    populate: jest.fn().mockReturnThis(),
  });
  const model = {
    collection: { collectionName },
    find: jest.fn().mockReturnValue(queryObj),
    findById: jest.fn().mockReturnValue(findByIdQuery(doc)),
    findByIdAndUpdate: jest.fn().mockResolvedValue(doc),
    findByIdAndDelete: jest.fn().mockResolvedValue(doc),
    create: jest.fn().mockResolvedValue(doc),
    // helper so individual tests can override findById result
    _setFindByIdResult: (resolvedDoc) => {
      model.findById.mockReturnValue(findByIdQuery(resolvedDoc));
    },
  };
  return model;
}

/** Create mock Express req / res / next triple. */
function mockTriple(params = {}, body = {}) {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  const req = { params, body, query: {} };
  const next = jest.fn();
  return { req, res, next };
}

// ─── tests ────────────────────────────────────────────────────────────────────

describe('handlerFactory', () => {
  beforeEach(() => jest.clearAllMocks());

  // ── getAll ──────────────────────────────────────────────────────────────────

  it('getAll — returns 200 with collection-keyed array', async () => {
    const model = mockModel('articles');
    const { req, res, next } = mockTriple();
    factory.getAll(model)(req, res, next);
    await flushPromises();

    expect(res.status).toHaveBeenCalledWith(200);
    const body = res.json.mock.calls[0][0];
    expect(body.status).toBe('success');
    expect(Array.isArray(body.data.articles)).toBe(true);
  });

  // ── getOne ──────────────────────────────────────────────────────────────────

  it('getOne — valid ObjectId, document found → 200 with singular key', async () => {
    mongoose.isValidObjectId.mockReturnValue(true);
    const model = mockModel('articles');
    const { req, res, next } = mockTriple({ id: 'validId' });
    factory.getOne(model)(req, res, next);
    await flushPromises();

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json.mock.calls[0][0].data).toHaveProperty('article');
  });

  it('getOne — invalid ObjectId → next(AppError 404)', async () => {
    mongoose.isValidObjectId.mockReturnValue(false);
    const model = mockModel('articles');
    const { req, res, next } = mockTriple({ id: 'bad-id' });
    factory.getOne(model)(req, res, next);
    await flushPromises();

    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0].statusCode).toBe(404);
  });

  it('getOne — valid ObjectId, document not found → next(AppError 404)', async () => {
    mongoose.isValidObjectId.mockReturnValue(true);
    const model = mockModel('articles');
    model._setFindByIdResult(null);
    const { req, res, next } = mockTriple({ id: 'validId' });
    factory.getOne(model)(req, res, next);
    await flushPromises();

    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0].statusCode).toBe(404);
  });

  // ── createOne ───────────────────────────────────────────────────────────────

  it('createOne — returns 201 with singular key', async () => {
    const model = mockModel('quicktips');
    const { req, res, next } = mockTriple({}, { title: 'New tip' });
    factory.createOne(model)(req, res, next);
    await flushPromises();

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json.mock.calls[0][0].data).toHaveProperty('quicktip');
  });

  // ── updateOne ───────────────────────────────────────────────────────────────

  it('updateOne — valid ObjectId, document found → 200', async () => {
    mongoose.isValidObjectId.mockReturnValue(true);
    const model = mockModel('cheatsheets');
    const { req, res, next } = mockTriple({ id: 'validId' }, { title: 'Updated' });
    factory.updateOne(model)(req, res, next);
    await flushPromises();

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json.mock.calls[0][0].data).toHaveProperty('cheatsheet');
  });

  it('updateOne — valid ObjectId, document not found → next(AppError 404)', async () => {
    mongoose.isValidObjectId.mockReturnValue(true);
    const model = mockModel('cheatsheets');
    model.findByIdAndUpdate.mockResolvedValue(null);
    const { req, res, next } = mockTriple({ id: 'validId' });
    factory.updateOne(model)(req, res, next);
    await flushPromises();

    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0].statusCode).toBe(404);
  });

  // ── deleteOne ───────────────────────────────────────────────────────────────

  it('deleteOne — valid ObjectId, document found → 204', async () => {
    mongoose.isValidObjectId.mockReturnValue(true);
    const model = mockModel('experiences');
    const { req, res, next } = mockTriple({ id: 'validId' });
    factory.deleteOne(model)(req, res, next);
    await flushPromises();

    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.json.mock.calls[0][0].data).toBeNull();
  });

  it('deleteOne — valid ObjectId, document not found → next(AppError 404)', async () => {
    mongoose.isValidObjectId.mockReturnValue(true);
    const model = mockModel('experiences');
    model.findByIdAndDelete.mockResolvedValue(null);
    const { req, res, next } = mockTriple({ id: 'validId' });
    factory.deleteOne(model)(req, res, next);
    await flushPromises();

    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0].statusCode).toBe(404);
  });

  // ── singularKey fallback ─────────────────────────────────────────────────────

  it('getAll — unknown collection name falls back to stripping trailing s', async () => {
    const model = mockModel('widgets');
    const { req, res, next } = mockTriple({}, {});
    // createOne uses singularKey internally
    model.create.mockResolvedValue({ title: 'W' });
    factory.createOne(model)(req, res, next);
    await flushPromises();

    const body = res.json.mock.calls[0][0];
    expect(body.data).toHaveProperty('widget');
  });
});

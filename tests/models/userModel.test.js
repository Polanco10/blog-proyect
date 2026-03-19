const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
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
  await User.deleteMany({});
});

describe('User Model', () => {
  const validUserData = {
    name: 'Diego Polanco',
    email: 'diego@test.com',
    password: 'password123',
    passwordConfirm: 'password123'
  };

  it('debería crear un usuario válido correctamente', async () => {
    const user = await User.create(validUserData);
    expect(user._id).toBeDefined();
    expect(user.name).toBe('Diego Polanco');
    expect(user.email).toBe('diego@test.com');
    expect(user.role).toBe('user');
  });

  it('debería encriptar la contraseña al guardar', async () => {
    const user = await User.create(validUserData);
    const savedUser = await User.findById(user._id).select('+password');
    expect(savedUser.password).not.toBe('password123');
    expect(savedUser.password).toMatch(/^\$2a\$/);
  });

  it('debería fallar sin nombre requerido', async () => {
    const userData = { ...validUserData, name: undefined };
    await expect(User.create(userData)).rejects.toThrow();
  });

  it('debería fallar sin email requerido', async () => {
    const userData = { ...validUserData, email: undefined };
    await expect(User.create(userData)).rejects.toThrow();
  });

  it('debería fallar con email inválido', async () => {
    const userData = { ...validUserData, email: 'not-an-email' };
    await expect(User.create(userData)).rejects.toThrow();
  });

  it('debería fallar cuando las contraseñas no coinciden', async () => {
    const userData = { ...validUserData, passwordConfirm: 'different123' };
    await expect(User.create(userData)).rejects.toThrow();
  });

  it('debería fallar con contraseña menor a 8 caracteres', async () => {
    const userData = { ...validUserData, password: 'short', passwordConfirm: 'short' };
    await expect(User.create(userData)).rejects.toThrow();
  });

  it('debería fallar con email duplicado', async () => {
    await User.create(validUserData);
    await expect(User.create(validUserData)).rejects.toThrow();
  });

  it('método correctPassword debería comparar passwords correctamente', async () => {
    const user = await User.create(validUserData);
    const savedUser = await User.findById(user._id).select('+password');
    const isCorrect = await savedUser.correctPassword('password123', savedUser.password);
    expect(isCorrect).toBe(true);
    const isWrong = await savedUser.correctPassword('wrongpassword', savedUser.password);
    expect(isWrong).toBe(false);
  });

  it('debería convertir el email a minúsculas', async () => {
    const userData = { ...validUserData, email: 'DIEGO@TEST.COM' };
    const user = await User.create(userData);
    expect(user.email).toBe('diego@test.com');
  });

  it('debería asignar role "user" por defecto', async () => {
    const user = await User.create(validUserData);
    expect(user.role).toBe('user');
  });

  it('debería permitir crear un usuario admin', async () => {
    const userData = { ...validUserData, role: 'admin' };
    const user = await User.create(userData);
    expect(user.role).toBe('admin');
  });
});

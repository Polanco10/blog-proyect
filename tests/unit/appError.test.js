const AppError = require('../../utils/appError');

describe('AppError', () => {
  it('debería crear un error con statusCode 404 y status "fail"', () => {
    const error = new AppError('No encontrado', 404);
    expect(error.message).toBe('No encontrado');
    expect(error.statusCode).toBe(404);
    expect(error.status).toBe('fail');
    expect(error.isOperational).toBe(true);
  });

  it('debería crear un error con statusCode 500 y status "error"', () => {
    const error = new AppError('Error interno del servidor', 500);
    expect(error.message).toBe('Error interno del servidor');
    expect(error.statusCode).toBe(500);
    expect(error.status).toBe('error');
    expect(error.isOperational).toBe(true);
  });

  it('debería ser una instancia de Error', () => {
    const error = new AppError('Error de prueba', 400);
    expect(error).toBeInstanceOf(Error);
  });

  it('debería clasificar como "fail" los códigos 4xx', () => {
    const err400 = new AppError('Bad Request', 400);
    const err401 = new AppError('Unauthorized', 401);
    const err403 = new AppError('Forbidden', 403);
    expect(err400.status).toBe('fail');
    expect(err401.status).toBe('fail');
    expect(err403.status).toBe('fail');
  });
});

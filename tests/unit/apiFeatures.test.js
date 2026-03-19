const APIFeatures = require('../../utils/apiFeatures');

// Mock del query de Mongoose
const createMockQuery = (data = []) => {
  const mockQuery = {
    find: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    then: (resolve) => resolve(data),
  };
  return mockQuery;
};

describe('APIFeatures', () => {
  describe('filter()', () => {
    it('debería excluir campos especiales (page, sort, limit, fields)', () => {
      const mockQuery = createMockQuery();
      const queryString = { title: 'Test', page: '1', sort: 'title', limit: '10', fields: 'title' };
      const features = new APIFeatures(mockQuery, queryString);
      features.filter();
      expect(mockQuery.find).toHaveBeenCalledWith({ title: 'Test' });
    });

    it('debería reemplazar operadores gte, gt, lte, lt con $gte, $gt, etc.', () => {
      const mockQuery = createMockQuery();
      const queryString = { views: { gte: '100' } };
      const features = new APIFeatures(mockQuery, queryString);
      features.filter();
      expect(mockQuery.find).toHaveBeenCalledWith({ views: { $gte: '100' } });
    });

    it('debería retornar `this` para encadenamiento', () => {
      const mockQuery = createMockQuery();
      const features = new APIFeatures(mockQuery, {});
      const result = features.filter();
      expect(result).toBe(features);
    });
  });

  describe('sort()', () => {
    it('debería ordenar por el campo especificado', () => {
      const mockQuery = createMockQuery();
      const features = new APIFeatures(mockQuery, { sort: 'title' });
      features.sort();
      expect(mockQuery.sort).toHaveBeenCalledWith('title');
    });

    it('debería manejar múltiples campos de orden separados por coma', () => {
      const mockQuery = createMockQuery();
      const features = new APIFeatures(mockQuery, { sort: 'title,author' });
      features.sort();
      expect(mockQuery.sort).toHaveBeenCalledWith('title author');
    });

    it('debería ordenar por -createdAt como valor predeterminado', () => {
      const mockQuery = createMockQuery();
      const features = new APIFeatures(mockQuery, {});
      features.sort();
      expect(mockQuery.sort).toHaveBeenCalledWith('-createdAt');
    });
  });

  describe('limitFields()', () => {
    it('debería seleccionar solo los campos especificados', () => {
      const mockQuery = createMockQuery();
      const features = new APIFeatures(mockQuery, { fields: 'title,description' });
      features.limitFields();
      expect(mockQuery.select).toHaveBeenCalledWith('title description');
    });

    it('debería excluir __v por defecto', () => {
      const mockQuery = createMockQuery();
      const features = new APIFeatures(mockQuery, {});
      features.limitFields();
      expect(mockQuery.select).toHaveBeenCalledWith('-__v');
    });
  });

  describe('paginate()', () => {
    it('debería paginar con los valores proporcionados', () => {
      const mockQuery = createMockQuery();
      const features = new APIFeatures(mockQuery, { page: '2', limit: '10' });
      features.paginate();
      expect(mockQuery.skip).toHaveBeenCalledWith(10);
      expect(mockQuery.limit).toHaveBeenCalledWith(10);
    });

    it('debería usar valores predeterminados (page=1, limit=100)', () => {
      const mockQuery = createMockQuery();
      const features = new APIFeatures(mockQuery, {});
      features.paginate();
      expect(mockQuery.skip).toHaveBeenCalledWith(0);
      expect(mockQuery.limit).toHaveBeenCalledWith(100);
    });
  });

  describe('encadenamiento completo', () => {
    it('debería encadenar filter, sort, limitFields y paginate', () => {
      const mockQuery = createMockQuery();
      const queryString = { title: 'Test', sort: 'title', fields: 'title,description', page: '1', limit: '5' };
      const features = new APIFeatures(mockQuery, queryString);
      const result = features.filter().sort().limitFields().paginate();
      expect(result).toBe(features);
      expect(mockQuery.find).toHaveBeenCalled();
      expect(mockQuery.sort).toHaveBeenCalledWith('title');
      expect(mockQuery.select).toHaveBeenCalledWith('title description');
      expect(mockQuery.skip).toHaveBeenCalledWith(0);
      expect(mockQuery.limit).toHaveBeenCalledWith(5);
    });
  });
});

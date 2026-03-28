const APIFeatures = require('../../utils/apiFeatures');

// Mock del query de Mongoose
const createMockQuery = (data = []) => {
    const mockQuery = {
        find: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        then: resolve => resolve(data),
    };
    return mockQuery;
};

describe('APIFeatures', () => {
    describe('filter()', () => {
        it('should exclude special fields (page, sort, limit, fields)', () => {
            const mockQuery = createMockQuery();
            const queryString = { title: 'Test', page: '1', sort: 'title', limit: '10', fields: 'title' };
            const features = new APIFeatures(mockQuery, queryString);
            features.filter();
            expect(mockQuery.find).toHaveBeenCalledWith({ title: 'Test' });
        });

        it('should replace operators gte, gt, lte, lt with $gte, $gt, etc.', () => {
            const mockQuery = createMockQuery();
            const queryString = { views: { gte: '100' } };
            const features = new APIFeatures(mockQuery, queryString);
            features.filter();
            expect(mockQuery.find).toHaveBeenCalledWith({ views: { $gte: '100' } });
        });

        it('should return `this` for chaining', () => {
            const mockQuery = createMockQuery();
            const features = new APIFeatures(mockQuery, {});
            const result = features.filter();
            expect(result).toBe(features);
        });
    });

    describe('sort()', () => {
        it('should sort by the specified field', () => {
            const mockQuery = createMockQuery();
            const features = new APIFeatures(mockQuery, { sort: 'title' });
            features.sort();
            expect(mockQuery.sort).toHaveBeenCalledWith('title');
        });

        it('should handle multiple sort fields separated by comma', () => {
            const mockQuery = createMockQuery();
            const features = new APIFeatures(mockQuery, { sort: 'title,author' });
            features.sort();
            expect(mockQuery.sort).toHaveBeenCalledWith('title author');
        });

        it('should sort by -createdAt as the default value', () => {
            const mockQuery = createMockQuery();
            const features = new APIFeatures(mockQuery, {});
            features.sort();
            expect(mockQuery.sort).toHaveBeenCalledWith('-createdAt');
        });
    });

    describe('limitFields()', () => {
        it('should select only the specified fields', () => {
            const mockQuery = createMockQuery();
            const features = new APIFeatures(mockQuery, { fields: 'title,description' });
            features.limitFields();
            expect(mockQuery.select).toHaveBeenCalledWith('title description');
        });

        it('should exclude __v by default', () => {
            const mockQuery = createMockQuery();
            const features = new APIFeatures(mockQuery, {});
            features.limitFields();
            expect(mockQuery.select).toHaveBeenCalledWith('-__v');
        });
    });

    describe('paginate()', () => {
        it('should paginate with the provided values', () => {
            const mockQuery = createMockQuery();
            const features = new APIFeatures(mockQuery, { page: '2', limit: '10' });
            features.paginate();
            expect(mockQuery.skip).toHaveBeenCalledWith(10);
            expect(mockQuery.limit).toHaveBeenCalledWith(10);
        });

        it('should use default values (page=1, limit=100)', () => {
            const mockQuery = createMockQuery();
            const features = new APIFeatures(mockQuery, {});
            features.paginate();
            expect(mockQuery.skip).toHaveBeenCalledWith(0);
            expect(mockQuery.limit).toHaveBeenCalledWith(100);
        });
    });

    describe('full chaining', () => {
        it('should chain filter, sort, limitFields, and paginate', () => {
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

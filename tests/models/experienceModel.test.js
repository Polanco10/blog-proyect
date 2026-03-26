const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Experience = require('../../models/experienceModel');

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
  await Experience.deleteMany({});
});

describe('Experience Model', () => {
  const validExperienceData = {
    company: 'Google',
    role: 'Software Engineer',
    startDate: new Date('2024-01-01'),
    description: 'Trabajando en proyectos de IA',
    achievements: ['Desarrollo de API escalable', 'Optimización de base de datos']
  };

  it('should create a valid experience correctly', async () => {
    const experience = await Experience.create(validExperienceData);
    expect(experience._id).toBeDefined();
    expect(experience.company).toBe('Google');
    expect(experience.role).toBe('Software Engineer');
    expect(experience.achievements).toHaveLength(2);
  });

  it('should fail without a required company name', async () => {
    const experienceData = { ...validExperienceData, company: undefined };
    await expect(Experience.create(experienceData)).rejects.toThrow(/An experience must have a company name/);
  });

  it('should fail without a required role', async () => {
    const experienceData = { ...validExperienceData, role: undefined };
    await expect(Experience.create(experienceData)).rejects.toThrow(/An experience must have a role/);
  });

  it('should fail without a required start date', async () => {
    const experienceData = { ...validExperienceData, startDate: undefined };
    await expect(Experience.create(experienceData)).rejects.toThrow(/An experience must have a start date/);
  });

  it('should allow creating an experience without description or achievements', async () => {
    const experienceData = {
      company: 'Twitter',
      role: 'Staff Engineer',
      startDate: new Date('2023-01-01')
    };
    const experience = await Experience.create(experienceData);
    expect(experience._id).toBeDefined();
    expect(experience.description).toBeUndefined();
    expect(experience.achievements).toHaveLength(0);
  });

  it('should handle an end date (endDate)', async () => {
    const endDate = new Date('2024-12-31');
    const experienceData = { ...validExperienceData, endDate };
    const experience = await Experience.create(experienceData);
    expect(experience.endDate.toISOString()).toBe(endDate.toISOString());
  });
});

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

  it('debería crear una experiencia válida correctamente', async () => {
    const experience = await Experience.create(validExperienceData);
    expect(experience._id).toBeDefined();
    expect(experience.company).toBe('Google');
    expect(experience.role).toBe('Software Engineer');
    expect(experience.achievements).toHaveLength(2);
  });

  it('debería fallar sin nombre de empresa (company)', async () => {
    const experienceData = { ...validExperienceData, company: undefined };
    await expect(Experience.create(experienceData)).rejects.toThrow(/An experience must have a company name/);
  });

  it('debería fallar sin rol (role)', async () => {
    const experienceData = { ...validExperienceData, role: undefined };
    await expect(Experience.create(experienceData)).rejects.toThrow(/An experience must have a role/);
  });

  it('debería fallar sin fecha de inicio (startDate)', async () => {
    const experienceData = { ...validExperienceData, startDate: undefined };
    await expect(Experience.create(experienceData)).rejects.toThrow(/An experience must have a start date/);
  });

  it('debería permitir crear experiencia sin descripción ni logros', async () => {
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

  it('debería manejar una fecha de fin (endDate)', async () => {
    const endDate = new Date('2024-12-31');
    const experienceData = { ...validExperienceData, endDate };
    const experience = await Experience.create(experienceData);
    expect(experience.endDate.toISOString()).toBe(endDate.toISOString());
  });
});

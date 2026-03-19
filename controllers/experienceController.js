const Experience = require('./../models/experienceModel');
const factory = require('./handlerFactory');

exports.getAllExperiences = factory.getAll(Experience);
exports.getExperience = factory.getOne(Experience);
exports.createExperience = factory.createOne(Experience);
exports.updateExperience = factory.updateOne(Experience);
exports.deleteExperience = factory.deleteOne(Experience);

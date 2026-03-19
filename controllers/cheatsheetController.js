const Cheatsheet = require('./../models/cheatsheetModel');
const factory = require('./handlerFactory');

exports.getAllCheatsheets = factory.getAll(Cheatsheet);
exports.getCheatsheet = factory.getOne(Cheatsheet);
exports.createCheatsheet = factory.createOne(Cheatsheet);
exports.updateCheatsheet = factory.updateOne(Cheatsheet);
exports.deleteCheatsheet = factory.deleteOne(Cheatsheet);

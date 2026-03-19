const QuickTip = require('./../models/quicktipModel');
const factory = require('./handlerFactory');

exports.getAllQuickTips = factory.getAll(QuickTip);
exports.getQuickTip = factory.getOne(QuickTip);
exports.createQuickTip = factory.createOne(QuickTip);
exports.updateQuickTip = factory.updateOne(QuickTip);
exports.deleteQuickTip = factory.deleteOne(QuickTip);

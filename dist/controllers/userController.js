"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const catchAsync_1 = __importDefault(require("../utils/catchAsync"));
const appError_1 = __importDefault(require("../utils/appError"));
const factory = require('./../controllers/handlerFactory');
const User = require('./../models/userModel');
const filterObj = (obj, ...allowedFields) => {
    const newObj = {};
    Object.keys(obj).forEach(el => {
        if (allowedFields.includes(el))
            newObj[el] = obj[el];
    });
    return newObj;
};
exports.getMe = (req, res, next) => {
    req.params.id = req.user.id;
    next();
};
//routes handlers
exports.updateMe = (0, catchAsync_1.default)(async (req, res, next) => {
    if (req.body.password || req.body.passwordConfirm) {
        return next(new appError_1.default('This route is not for password updates. Please use / updateMyPassword.', 400));
    }
    const filteredBody = filterObj(req.body, 'name', 'email');
    const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, { new: true, runValidators: true }); //new:true -> devuelve el objeto user que encuentra en la query
    res.status(200).json({
        status: 'success',
        data: {
            user: updatedUser,
        },
    });
});
exports.deleteMe = (0, catchAsync_1.default)(async (req, res) => {
    await User.findByIdAndUpdate(req.user.id, { active: false });
    res.status(204).json({
        status: 'success',
        data: null,
    });
});
exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);
exports.deleteUser = factory.deleteOne(User);
//No updatear passwords con updateUser!
exports.updateUser = factory.updateOne(User);

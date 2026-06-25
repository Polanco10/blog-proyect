import { Response, NextFunction } from 'express';
import catchAsync from '../utils/catchAsync';
import AppError from '../utils/appError';
import { AuthRequest } from '../types';
const factory = require('./../controllers/handlerFactory');
const User = require('./../models/userModel');

const filterObj = (obj: Record<string, unknown>, ...allowedFields: string[]): Record<string, unknown> => {
    //Crea un nuevo objeto a partir de las properties que se ingresan
    const newObj: Record<string, unknown> = {};
    Object.keys(obj).forEach(el => {
        if (allowedFields.includes(el)) newObj[el] = obj[el];
    });
    return newObj;
};

exports.getMe = (req: AuthRequest, res: Response, next: NextFunction) => {
    //middleware - Para extraer la id del usuario loggeado
    req.params.id = req.user!.id;
    next();
};

//routes handlers
exports.updateMe = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
    //Modificar data personal del usuario
    if (req.body.password || req.body.passwordConfirm) {
        return next(new AppError('This route is not for password updates. Please use / updateMyPassword.', 400));
    }
    const filteredBody = filterObj(req.body, 'name', 'email');
    const updatedUser = await User.findByIdAndUpdate(req.user!.id, filteredBody, {
        new: true,
        runValidators: true,
    }); //new:true -> devuelve el objeto user que encuentra en la query
    res.status(200).json({
        status: 'success',
        data: {
            user: updatedUser,
        },
    });
});

exports.deleteMe = catchAsync(async (req: AuthRequest, res: Response) => {
    await User.findByIdAndUpdate(req.user!.id, { active: false });
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

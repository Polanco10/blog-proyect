import { Request, Response, NextFunction } from 'express';

type AsyncRequestHandler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

// Wraps an async route handler and forwards any thrown error to next()
const catchAsync =
    (fn: AsyncRequestHandler) =>
    (req: Request, res: Response, next: NextFunction): void => {
        fn(req, res, next).catch(next);
    };

export = catchAsync;

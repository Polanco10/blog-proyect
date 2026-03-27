"use strict";
// Wraps an async route handler and forwards any thrown error to next()
const catchAsync = (fn) => (req, res, next) => {
    fn(req, res, next).catch(next);
};
module.exports = catchAsync;

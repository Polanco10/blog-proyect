const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const AppError = require('./appError');

// Use memory storage — process with sharp before writing to disk
const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
        cb(null, true);
    } else {
        cb(new AppError('Not an image! Please upload only images.', 400), false);
    }
};

exports.upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB max
});

/**
 * Resize and save article cover image.
 * Expects req.file from multer. Writes to public/uploads/ and sets req.body.imageCover.
 */
exports.resizeArticleImage = async (req, res, next) => {
    if (!req.file) return next();

    const filename = `article-${Date.now()}-cover.webp`;
    req.body.imageCover = `/uploads/${filename}`;

    await sharp(req.file.buffer)
        .resize(1200, 630, { fit: 'cover' })
        .webp({ quality: 85 })
        .toFile(path.join(__dirname, '..', 'public', 'uploads', filename));

    next();
};

/**
 * Resize and save user photo.
 * Expects req.file from multer. Writes to public/uploads/ and sets req.body.photo.
 */
exports.resizeUserPhoto = async (req, res, next) => {
    if (!req.file) return next();

    const filename = `user-${req.user.id}-${Date.now()}.webp`;
    req.body.photo = `/uploads/${filename}`;

    await sharp(req.file.buffer)
        .resize(200, 200, { fit: 'cover' })
        .webp({ quality: 90 })
        .toFile(path.join(__dirname, '..', 'public', 'uploads', filename));

    next();
};

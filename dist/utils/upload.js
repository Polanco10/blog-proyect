const multer = require('multer');
const sharp = require('sharp');
const AppError = require('./appError');
const logger = require('./logger');
// Carga condicional de AWS SDK — solo en producción
let s3Client, PutObjectCommand;
if (process.env.NODE_ENV === 'production') {
    const { S3Client, PutObjectCommand: POC } = require('@aws-sdk/client-s3');
    s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
    PutObjectCommand = POC;
}
const path = require('path');
// Use memory storage — process with sharp before saving
const multerStorage = multer.memoryStorage();
const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
        cb(null, true);
    }
    else {
        cb(new AppError('Not an image! Please upload only images.', 400), false);
    }
};
exports.upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB max
});
/**
 * Sube un buffer procesado a S3 y retorna la URL pública via CloudFront.
 */
const uploadToS3 = async (buffer, key, contentType) => {
    const bucket = process.env.AWS_S3_BUCKET_IMAGES;
    await s3Client.send(new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        CacheControl: 'public, max-age=31536000, immutable',
    }));
    const cdnUrl = process.env.CLOUDFRONT_IMAGES_URL;
    return cdnUrl ? `${cdnUrl}/${key}` : `https://${bucket}.s3.amazonaws.com/${key}`;
};
/**
 * Resize and save article cover image.
 * Producción: sube a S3. Desarrollo: escribe a public/uploads/.
 */
exports.resizeArticleImage = async (req, res, next) => {
    if (!req.file)
        return next();
    try {
        const filename = `article-${Date.now()}-cover.webp`;
        const buffer = await sharp(req.file.buffer)
            .resize(1200, 630, { fit: 'cover' })
            .webp({ quality: 85 })
            .toBuffer();
        if (process.env.NODE_ENV === 'production' && s3Client) {
            const key = `articles/${filename}`;
            req.body.imageCover = await uploadToS3(buffer, key, 'image/webp');
            logger.info('Article image uploaded to S3', { key });
        }
        else {
            req.body.imageCover = `/uploads/${filename}`;
            await sharp(buffer).toFile(path.join(__dirname, '..', 'public', 'uploads', filename));
        }
        next();
    }
    catch (err) {
        logger.error('Image resize/upload failed', { error: err.message });
        next(new AppError('Image processing failed.', 500));
    }
};
/**
 * Resize and save user photo.
 * Producción: sube a S3. Desarrollo: escribe a public/uploads/.
 */
exports.resizeUserPhoto = async (req, res, next) => {
    if (!req.file)
        return next();
    try {
        const filename = `user-${req.user.id}-${Date.now()}.webp`;
        const buffer = await sharp(req.file.buffer)
            .resize(200, 200, { fit: 'cover' })
            .webp({ quality: 90 })
            .toBuffer();
        if (process.env.NODE_ENV === 'production' && s3Client) {
            const key = `users/${filename}`;
            req.body.photo = await uploadToS3(buffer, key, 'image/webp');
            logger.info('User photo uploaded to S3', { key });
        }
        else {
            req.body.photo = `/uploads/${filename}`;
            await sharp(buffer).toFile(path.join(__dirname, '..', 'public', 'uploads', filename));
        }
        next();
    }
    catch (err) {
        logger.error('Image resize/upload failed', { error: err.message });
        next(new AppError('Image processing failed.', 500));
    }
};

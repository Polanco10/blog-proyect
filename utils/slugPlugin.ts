import { Schema } from 'mongoose';
import slugify from './slugify';

// Plugin de Mongoose para generar slug a partir del título
function slugPlugin(schema: Schema): void {
    schema.pre('save', function (next) {
        this.slug = slugify((this as unknown as { title: string }).title);
        next();
    });
}

export = slugPlugin;

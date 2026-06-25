import { Schema } from 'mongoose';

// Plugin de Mongoose para generar slug a partir del título
function slugPlugin(schema: Schema): void {
    schema.pre('save', function (next) {
        this.slug = (this as unknown as { title: string }).title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        next();
    });
}

export = slugPlugin;

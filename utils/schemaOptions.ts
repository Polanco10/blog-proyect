import { SchemaOptions } from 'mongoose';

// Opciones de esquema reutilizables para serialización JSON
function createSchemaOptions(...extraDeleteFields: string[]): SchemaOptions {
    return {
        toJSON: {
            virtuals: true,
            transform: (_doc: any, ret: any) => {
                delete ret._id;
                delete ret.id;
                delete ret.__v;
                for (const field of extraDeleteFields) {
                    delete ret[field];
                }
                return ret;
            },
        },
        toObject: { virtuals: true },
    };
}

export = createSchemaOptions;

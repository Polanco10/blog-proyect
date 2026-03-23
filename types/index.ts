import { Document, Types } from 'mongoose';
import { Request } from 'express';

// ─── User ────────────────────────────────────────────────────────────────────

export interface IUser extends Document {
    _id: Types.ObjectId;
    name: string;
    email: string;
    role: 'user' | 'admin';
    password: string;
    passwordChangedAt?: Date;
    passwordResetToken?: string;
    passwordResetExpires?: Date;
    correctPassword(candidate: string, hashed: string): Promise<boolean>;
    changedPasswordAfter(jwtTimestamp: number): boolean;
    createPasswordResetToken(): string;
}

// ─── Article ─────────────────────────────────────────────────────────────────

export interface IArticle extends Document {
    _id: Types.ObjectId;
    title: string;
    description: string;
    content?: string;
    author: Types.ObjectId | IUser;
    tags: string[];
    imageCover?: string;
    category: 'Programacion' | 'Idioma';
    views: number;
    createdAt: Date;
}

// ─── Quick Tip ───────────────────────────────────────────────────────────────

export interface IQuickTip extends Document {
    _id: Types.ObjectId;
    title: string;
    language: string;
    codeSnippet: string;
    seniority: 'Junior' | 'Semi-Senior' | 'Senior';
    createdAt: Date;
}

// ─── Cheatsheet ──────────────────────────────────────────────────────────────

export interface ICheatsheet extends Document {
    _id: Types.ObjectId;
    title: string;
    description: string;
    fileUrl: string;
    category?: string;
    createdAt: Date;
}

// ─── Experience ──────────────────────────────────────────────────────────────

export interface IExperience extends Document {
    _id: Types.ObjectId;
    company: string;
    role: string;
    startDate: Date;
    endDate?: Date;
    description?: string;
}

// ─── Auth Request ─────────────────────────────────────────────────────────────

export interface AuthRequest extends Request {
    user?: IUser;
    requestTime?: string;
}

// ─── API Response ────────────────────────────────────────────────────────────

export interface ApiSuccessResponse<T = unknown> {
    status: 'success';
    results?: number;
    data: T;
}

export interface ApiErrorResponse {
    status: 'fail' | 'error';
    message: string;
}

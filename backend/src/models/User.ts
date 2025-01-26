import mongoose from 'mongoose';
import { Schema, Document } from 'mongoose';

export interface IUser extends Document {
    email: string;
    password: string;
    role: 'admin' | 'editor' | 'writer';
    createdAt: Date;
    updatedAt: Date;
}

const userSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['admin', 'editor', 'writer'],
        default: 'writer'
    }
}, {
    timestamps: true
});

export const User = mongoose.model<IUser>('User', userSchema); 
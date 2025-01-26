import mongoose from 'mongoose';
import { Schema, Document } from 'mongoose';

interface IValidationFeedback {
    type: 'technical_accuracy' | 'industry_standards' | 'content_structure';
    severity: 'high' | 'medium' | 'low';
    message: string;
    suggestion: string;
    location?: {
        line: number;
        column: number;
    };
}

interface IValidationHistory {
    timestamp: Date;
    status: 'pending' | 'completed' | 'failed';
    feedback: IValidationFeedback[];
    validatedBy: mongoose.Types.ObjectId;
}

export interface IBlogPost extends Document {
    title: string;
    content: string;
    author: mongoose.Types.ObjectId;
    status: 'draft' | 'in_review' | 'approved' | 'rejected';
    validationHistory: IValidationHistory[];
    technicalTopics: string[];
    codeSnippets: {
        language: string;
        code: string;
        lineNumbers: [number, number];
    }[];
    createdAt: Date;
    updatedAt: Date;
}

const blogPostSchema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    content: {
        type: String,
        required: true
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['draft', 'in_review', 'approved', 'rejected'],
        default: 'draft'
    },
    validationHistory: [{
        timestamp: {
            type: Date,
            default: Date.now
        },
        status: {
            type: String,
            enum: ['pending', 'completed', 'failed'],
            required: true
        },
        feedback: [{
            type: {
                type: String,
                enum: ['technical_accuracy', 'industry_standards', 'content_structure'],
                required: true
            },
            severity: {
                type: String,
                enum: ['high', 'medium', 'low'],
                required: true
            },
            message: String,
            suggestion: String,
            location: {
                line: Number,
                column: Number
            }
        }],
        validatedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        }
    }],
    technicalTopics: [{
        type: String,
        trim: true
    }],
    codeSnippets: [{
        language: String,
        code: String,
        lineNumbers: [Number]
    }]
}, {
    timestamps: true
});

export const BlogPost = mongoose.model<IBlogPost>('BlogPost', blogPostSchema); 
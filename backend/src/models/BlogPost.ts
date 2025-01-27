import mongoose, { Schema, Document } from 'mongoose';

export interface IValidationFeedback {
    type: 'technical_accuracy' | 'industry_standards' | 'content_structure';
    message: string;
    suggestion: string;
    severity: 'high' | 'medium' | 'low';
    location?: {
        line: number;
        column: number;
    };
    timestamp: Date;
    status: 'completed' | 'pending' | 'failed';
    validatedBy: mongoose.Types.ObjectId;
    feedback?: IValidationFeedback[];
}

export interface IBlogPost extends Document {
    title: string;
    content: string;
    author: string;
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
    validationHistory: IValidationFeedback[];
}

const BlogPostSchema: Schema = new Schema({
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true,
        maxlength: [200, 'Title cannot be more than 200 characters']
    },
    content: {
        type: String,
        required: [true, 'Content is required']
    },
    author: {
        type: String,
        required: [true, 'Author is required'],
        trim: true
    },
    tags: [{
        type: String,
        trim: true
    }],
    validationHistory: [{
        type: {
            type: String,
            enum: ['technical_accuracy', 'industry_standards', 'content_structure'],
            required: true
        },
        message: {
            type: String,
            required: true
        },
        suggestion: {
            type: String,
            required: true
        },
        severity: {
            type: String,
            enum: ['high', 'medium', 'low'],
            required: true
        },
        location: {
            line: Number,
            column: Number
        },
        timestamp: {
            type: Date,
            default: Date.now
        },
        status: {
            type: String,
            enum: ['completed', 'pending', 'failed'],
            required: true
        },
        validatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        feedback: [{
            type: {
                type: String,
                enum: ['technical_accuracy', 'industry_standards', 'content_structure'],
                required: true
            },
            message: String,
            suggestion: String,
            severity: {
                type: String,
                enum: ['high', 'medium', 'low']
            },
            location: {
                line: Number,
                column: Number
            }
        }]
    }]
}, {
    timestamps: true // Automatically add createdAt and updatedAt fields
});

// Add text index for search functionality
BlogPostSchema.index({ title: 'text', content: 'text', tags: 'text' });

export default mongoose.model<IBlogPost>('BlogPost', BlogPostSchema); 
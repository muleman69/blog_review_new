import mongoose, { Schema, Document } from 'mongoose';

export interface IBlogPost extends Document {
    title: string;
    content: string;
    author: string;
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
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
    }]
}, {
    timestamps: true // Automatically add createdAt and updatedAt fields
});

// Add text index for search functionality
BlogPostSchema.index({ title: 'text', content: 'text', tags: 'text' });

export default mongoose.model<IBlogPost>('BlogPost', BlogPostSchema); 
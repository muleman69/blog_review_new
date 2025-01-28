import React, { useState, useEffect } from 'react';
import { BlogPost, CreateBlogPostDTO, UpdateBlogPostDTO } from '../services/api/blogPost';
import './BlogPostForm.css';

interface BlogPostFormProps {
    post?: BlogPost;
    onSubmit: (data: CreateBlogPostDTO | UpdateBlogPostDTO) => Promise<void>;
    onCancel: () => void;
}

const BlogPostForm: React.FC<BlogPostFormProps> = ({ post, onSubmit, onCancel }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [author, setAuthor] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (post) {
            setTitle(post.title);
            setContent(post.content);
            setAuthor(post.author);
            setTags(post.tags);
        }
    }, [post]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        try {
            const formData = post
                ? {
                    title,
                    content,
                    tags,
                }
                : {
                    title,
                    content,
                    author,
                    tags,
                };

            await onSubmit(formData);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        }
    };

    const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && tagInput.trim()) {
            e.preventDefault();
            if (!tags.includes(tagInput.trim())) {
                setTags([...tags, tagInput.trim()]);
            }
            setTagInput('');
        }
    };

    const handleRemoveTag = (tagToRemove: string) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
    };

    return (
        <form onSubmit={handleSubmit} className="blog-post-form">
            <div className="form-group">
                <label htmlFor="title">Title</label>
                <input
                    id="title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                />
            </div>

            {!post && (
                <div className="form-group">
                    <label htmlFor="author">Author</label>
                    <input
                        id="author"
                        type="text"
                        value={author}
                        onChange={(e) => setAuthor(e.target.value)}
                        required
                    />
                </div>
            )}

            <div className="form-group">
                <label htmlFor="content">Content</label>
                <textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    required
                    rows={10}
                />
            </div>

            <div className="form-group">
                <label htmlFor="tags">Tags</label>
                <div className="tags-input">
                    <div className="tags-list">
                        {tags.map((tag, index) => (
                            <span key={index} className="tag">
                                {tag}
                                <button
                                    type="button"
                                    onClick={() => handleRemoveTag(tag)}
                                    className="remove-tag"
                                >
                                    ×
                                </button>
                            </span>
                        ))}
                    </div>
                    <input
                        id="tags"
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleAddTag}
                        placeholder="Press Enter to add tag"
                    />
                </div>
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="form-actions">
                <button type="submit" className="submit-button">
                    {post ? 'Update Post' : 'Create Post'}
                </button>
                <button type="button" onClick={onCancel} className="cancel-button">
                    Cancel
                </button>
            </div>
        </form>
    );
};

export default BlogPostForm; 
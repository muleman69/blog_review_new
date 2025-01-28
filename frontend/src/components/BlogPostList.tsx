import React from 'react';
import { useBlogPost } from '../hooks/useBlogPost';
import { BlogPost } from '../services/api/blogPost';
import './BlogPostList.css';

interface BlogPostListProps {
    posts: BlogPost[];
    loading: boolean;
    onEditClick: (post: BlogPost) => void;
}

const BlogPostList: React.FC<BlogPostListProps> = ({ posts, loading, onEditClick }) => {
    const { deletePost, validatePost } = useBlogPost();

    if (loading) {
        return <div>Loading...</div>;
    }

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this post?')) {
            try {
                await deletePost(id);
            } catch (err) {
                console.error('Failed to delete post:', err);
            }
        }
    };

    const handleValidate = async (id: string) => {
        try {
            await validatePost(id);
        } catch (err) {
            console.error('Failed to validate post:', err);
        }
    };

    return (
        <div className="blog-post-list">
            {posts.map((post: BlogPost) => (
                <div key={post.id} className="blog-post-card">
                    <h2>{post.title}</h2>
                    <p className="author">By {post.author}</p>
                    <p className="content">{post.content}</p>
                    <div className="tags">
                        {post.tags.map((tag, index) => (
                            <span key={index} className="tag">{tag}</span>
                        ))}
                    </div>
                    <div className="metadata">
                        <span>Created: {new Date(post.createdAt).toLocaleDateString()}</span>
                        <span>Updated: {new Date(post.updatedAt).toLocaleDateString()}</span>
                    </div>
                    <div className="actions">
                        <button 
                            onClick={() => onEditClick(post)}
                            className="edit-button"
                        >
                            Edit
                        </button>
                        {!post.isValidated && (
                            <button 
                                onClick={() => handleValidate(post.id)}
                                className="validate-button"
                            >
                                Validate
                            </button>
                        )}
                        <button 
                            onClick={() => handleDelete(post.id)}
                            className="delete-button"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default BlogPostList; 
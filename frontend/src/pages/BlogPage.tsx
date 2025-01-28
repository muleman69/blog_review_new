import React, { useState } from 'react';
import { useBlogPost } from '../hooks/useBlogPost';
import BlogPostList from '../components/BlogPostList';
import BlogPostForm from '../components/BlogPostForm';
import { BlogPost } from '../services/api/blogPost';
import './BlogPage.css';

const BlogPage: React.FC = () => {
    const { posts, loading, error, createPost, updatePost } = useBlogPost();
    const [showForm, setShowForm] = useState(false);
    const [selectedPost, setSelectedPost] = useState<BlogPost | undefined>(undefined);

    const handleCreateClick = () => {
        setSelectedPost(undefined);
        setShowForm(true);
    };

    const handleEditClick = (post: BlogPost) => {
        setSelectedPost(post);
        setShowForm(true);
    };

    const handleFormSubmit = async (data: any) => {
        try {
            if (selectedPost) {
                await updatePost(selectedPost.id, data);
            } else {
                await createPost(data);
            }
            setShowForm(false);
            setSelectedPost(undefined);
        } catch (err) {
            console.error('Failed to save post:', err);
        }
    };

    const handleFormCancel = () => {
        setShowForm(false);
        setSelectedPost(undefined);
    };

    if (error) {
        return <div className="error-message">Error: {error.message}</div>;
    }

    return (
        <div className="blog-page">
            <div className="blog-header">
                <h1>Blog Posts</h1>
                <button onClick={handleCreateClick} className="create-button">
                    Create New Post
                </button>
            </div>

            {showForm ? (
                <BlogPostForm
                    post={selectedPost}
                    onSubmit={handleFormSubmit}
                    onCancel={handleFormCancel}
                />
            ) : (
                <BlogPostList
                    posts={posts}
                    loading={loading}
                    onEditClick={handleEditClick}
                />
            )}
        </div>
    );
};

export default BlogPage; 
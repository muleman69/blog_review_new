import { useState, useEffect, useCallback } from 'react';
import blogPostService, { BlogPost, CreateBlogPostDTO, UpdateBlogPostDTO } from '../services/api/blogPost';

interface UseBlogPostReturn {
    posts: BlogPost[];
    loading: boolean;
    error: Error | null;
    createPost: (data: CreateBlogPostDTO) => Promise<void>;
    updatePost: (id: string, data: UpdateBlogPostDTO) => Promise<void>;
    deletePost: (id: string) => Promise<void>;
    validatePost: (id: string) => Promise<void>;
    refreshPosts: () => Promise<void>;
}

export function useBlogPost(): UseBlogPostReturn {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const refreshPosts = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await blogPostService.getAll();
            setPosts(data);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to fetch posts'));
        } finally {
            setLoading(false);
        }
    }, []);

    const createPost = async (data: CreateBlogPostDTO) => {
        try {
            setLoading(true);
            setError(null);
            await blogPostService.create(data);
            await refreshPosts();
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to create post'));
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const updatePost = async (id: string, data: UpdateBlogPostDTO) => {
        try {
            setLoading(true);
            setError(null);
            await blogPostService.update(id, data);
            await refreshPosts();
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to update post'));
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const deletePost = async (id: string) => {
        try {
            setLoading(true);
            setError(null);
            await blogPostService.delete(id);
            await refreshPosts();
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to delete post'));
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const validatePost = async (id: string) => {
        try {
            setLoading(true);
            setError(null);
            await blogPostService.validate(id);
            await refreshPosts();
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to validate post'));
            throw err;
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshPosts();
    }, [refreshPosts]);

    return {
        posts,
        loading,
        error,
        createPost,
        updatePost,
        deletePost,
        validatePost,
        refreshPosts
    };
} 
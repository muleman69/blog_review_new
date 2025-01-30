import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
    const queryClient = useQueryClient();
    const queryKey = ['blog-posts'];

    const { data: posts = [], isLoading, error } = useQuery({
        queryKey,
        queryFn: () => blogPostService.getAll(),
    });

    const createMutation = useMutation({
        mutationFn: (data: CreateBlogPostDTO) => blogPostService.create(data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateBlogPostDTO }) => 
            blogPostService.update(id, data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => blogPostService.delete(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    });

    const validateMutation = useMutation({
        mutationFn: (id: string) => blogPostService.validate(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    });

    const createPost = async (data: CreateBlogPostDTO) => {
        await createMutation.mutateAsync(data);
    };

    const updatePost = async (id: string, data: UpdateBlogPostDTO) => {
        await updateMutation.mutateAsync({ id, data });
    };

    const deletePost = async (id: string) => {
        await deleteMutation.mutateAsync(id);
    };

    const validatePost = async (id: string) => {
        await validateMutation.mutateAsync(id);
    };

    const refreshPosts = async () => {
        await queryClient.invalidateQueries({ queryKey });
    };

    return {
        posts,
        loading: isLoading,
        error: error as Error | null,
        createPost,
        updatePost,
        deletePost,
        validatePost,
        refreshPosts,
    };
} 
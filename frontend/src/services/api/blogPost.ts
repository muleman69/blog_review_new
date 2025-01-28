import axios from 'axios';
import { API_BASE_URL } from '../../config';

export interface BlogPost {
    id: string;
    title: string;
    content: string;
    author: string;
    createdAt: string;
    updatedAt: string;
    isValidated: boolean;
    tags: string[];
}

export interface CreateBlogPostDTO {
    title: string;
    content: string;
    author: string;
    tags?: string[];
}

export interface UpdateBlogPostDTO {
    title?: string;
    content?: string;
    tags?: string[];
}

const blogPostService = {
    async getAll(): Promise<BlogPost[]> {
        const response = await axios.get(`${API_BASE_URL}/posts`);
        return response.data;
    },

    async getById(id: string): Promise<BlogPost> {
        const response = await axios.get(`${API_BASE_URL}/posts/${id}`);
        return response.data;
    },

    async create(data: CreateBlogPostDTO): Promise<BlogPost> {
        const response = await axios.post(`${API_BASE_URL}/posts`, data);
        return response.data;
    },

    async update(id: string, data: UpdateBlogPostDTO): Promise<BlogPost> {
        const response = await axios.patch(`${API_BASE_URL}/posts/${id}`, data);
        return response.data;
    },

    async delete(id: string): Promise<void> {
        await axios.delete(`${API_BASE_URL}/posts/${id}`);
    },

    async validate(id: string): Promise<BlogPost> {
        const response = await axios.post(`${API_BASE_URL}/posts/${id}/validate`);
        return response.data;
    }
};

export default blogPostService; 
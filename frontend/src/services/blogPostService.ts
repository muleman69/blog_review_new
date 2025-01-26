import api from './api';

export interface BlogPost {
  _id: string;
  title: string;
  content: string;
  author: string;
  status: 'draft' | 'in_review' | 'approved' | 'rejected';
  technicalTopics: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ValidationLocation {
  line: number;
  column: number;
  length: number;
}

export interface ValidationIssue {
  type: 'technical_accuracy' | 'industry_standards' | 'content_structure' | 'code_quality' | 'code_security' | 'code_performance' | 'readability';
  message: string;
  severity: 'high' | 'medium' | 'low';
  suggestion?: string;
  location?: ValidationLocation;
}

export interface ValidationResponse {
  issues: ValidationIssue[];
}

class BlogPostService {
  static async create(data: Partial<BlogPost>): Promise<BlogPost> {
    const response = await api.post<BlogPost>('/blog-posts', data);
    return response.data;
  }

  static async validate(id: string, content: string): Promise<ValidationResponse> {
    const response = await api.post<ValidationResponse>(`/blog-posts/${id}/validate`, { content });
    return response.data;
  }

  static async getById(id: string): Promise<BlogPost> {
    const response = await api.get<BlogPost>(`/blog-posts/${id}`);
    return response.data;
  }

  static async update(id: string, data: Partial<BlogPost>): Promise<BlogPost> {
    const response = await api.patch<BlogPost>(`/blog-posts/${id}`, data);
    return response.data;
  }

  static async delete(id: string): Promise<void> {
    await api.delete(`/blog-posts/${id}`);
  }

  static async list(params: {
    status?: string;
    author?: string;
    limit?: number;
    skip?: number;
    sortBy?: string;
  } = {}): Promise<BlogPost[]> {
    const response = await api.get<BlogPost[]>('/blog-posts', { params });
    return response.data;
  }

  static async getValidationHistory(id: string): Promise<ValidationResponse[]> {
    const response = await api.get<ValidationResponse[]>(`/blog-posts/${id}/validation-history`);
    return response.data;
  }

  static async exportMarkdown(id: string): Promise<string> {
    const response = await api.get<string>(`/blog-posts/${id}/export/markdown`);
    return response.data;
  }

  static async exportHtml(id: string): Promise<string> {
    const response = await api.get<string>(`/blog-posts/${id}/export/html`);
    return response.data;
  }

  static async exportPdf(id: string): Promise<Blob> {
    const response = await api.get(`/blog-posts/${id}/export/pdf`, {
      responseType: 'blob'
    });
    return response.data;
  }
}

export default BlogPostService; 
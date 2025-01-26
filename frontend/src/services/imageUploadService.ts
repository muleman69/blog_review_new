import api from './api';

interface UploadResponse {
  url: string;
  filename: string;
}

class ImageUploadService {
  private static readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  private static readonly ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

  static validateFile(file: File): string | null {
    if (!this.ALLOWED_TYPES.includes(file.type)) {
      return 'Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.';
    }

    if (file.size > this.MAX_FILE_SIZE) {
      return 'File size exceeds 5MB limit.';
    }

    return null;
  }

  static async upload(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('image', file);

    const response = await api.post<UploadResponse>('/images/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }

  static async delete(filename: string): Promise<void> {
    await api.delete(`/images/${filename}`);
  }

  static async list(): Promise<UploadResponse[]> {
    const response = await api.get<UploadResponse[]>('/images');
    return response.data;
  }

  static getImageMarkdown(url: string, altText: string = 'image'): string {
    return `![${altText}](${url})`;
  }

  static getImageHtml(url: string, altText: string = 'image'): string {
    return `<img src="${url}" alt="${altText}" />`;
  }
}

export default ImageUploadService; 
// lib/api.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export interface Document {
  id: number;
  title: string;
  original_text: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
}

export interface VitalSigns {
  // Long key names (preferred)
  blood_pressure?: string;
  heart_rate?: string;
  respiratory_rate?: string;
  temperature?: string;
  oxygen_saturation?: string;
  
  // Short key names (for backward compatibility)
  bp?: string;
  hr?: string;
  rr?: string;
  temp?: string;
  spo2?: string;
}

export interface ExtractedData {
  id?: number;
  document?: number;
  vital_signs?: VitalSigns;
  vitals?: VitalSigns; // Backend uses this
  symptoms?: string[];
  pain_level?: number;
  pain_location?: string;
  consciousness_level?: string;
  consciousness?: string; // Backend uses this
  orientation?: string;
  mobility_status?: string;
  mobility?: string; // Backend uses this
  interventions?: string[];
  is_verified?: boolean;
  created_at?: string;
}

export interface Statistics {
  total_documents: number;
  total_extractions: number;
  accuracy_rate: number;
  total_corrections: number;
  avg_processing_time: number;
}

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  is_verified?: boolean;
  is_active?: boolean;
  date_joined?: string;
}

export class ApiService {
  static getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('access_token');
  }

  static async request(url: string, options: RequestInit = {}): Promise<any> {
    const token = this.getToken();

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string> | undefined),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error: any = new Error(errorData.message || `API Error: ${response.statusText}`);
      error.response = response;
      error.data = errorData;
      throw error;
    }

    // Handle 204 No Content (common for DELETE requests)
    if (response.status === 204) {
      return null;
    }

    // Check if response has content
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }

    return null;
  }

  static async getProfile(): Promise<UserProfile> {
    return this.request('/auth/profile/');
  }

  static async logout(refreshToken: string): Promise<any> {
    return fetch(`${API_BASE_URL}/auth/logout/`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh: refreshToken }),
    });
  }

  // ==================== Document Endpoints ====================
  static async uploadDocument(title: string, text: string): Promise<Document> {
    return this.request('/nlp/documents/', {
      method: 'POST',
      body: JSON.stringify({ title, original_text: text }),
    });
  }

  static async getDocuments(): Promise<Document[]> {
    return this.request('/nlp/documents/');
  }

  static async getDocument(id: number): Promise<Document> {
    return this.request(`/nlp/documents/${id}/`);
  }

  static async getExtractions(documentId: number): Promise<ExtractedData[]> {
    return this.request(`/nlp/documents/${documentId}/extractions/`);
  }

  static async getStructuredData(documentId: number): Promise<ExtractedData> {
    return this.request(`/nlp/documents/${documentId}/structured_data/`);
  }

  static async quickExtract(text: string): Promise<ExtractedData> {
    const response = await this.request('/nlp/documents/quick_extract/', {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
    console.log('Quick extract response:', response);
    
    if (response.success && response.extracted_data) {
      return response.extracted_data;
    }
    
    // Fallback if structure is different
    return response;
  }

  static async correctExtraction(extractionId: number, corrections: any): Promise<any> {
    return this.request(`/nlp/extractions/${extractionId}/correct/`, {
      method: 'POST',
      body: JSON.stringify(corrections),
    });
  }

  static async exportDocument(documentId: number, format: string): Promise<Blob> {
    const token = this.getToken();

    const response = await fetch(`${API_BASE_URL}/nlp/documents/${documentId}/export/`, {
      method: 'POST',
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ format }),
    });

    if (!response.ok) throw new Error('Export failed');
    return response.blob();
  }

  static async reprocessDocument(documentId: number): Promise<any> {
    return this.request(`/nlp/documents/${documentId}/reprocess/`, {
      method: 'POST',
    });
  }

  static async getFeedbackStatistics(): Promise<Statistics> {
    return this.request('/nlp/feedback/statistics/');
  }

  static async updateStructuredData(documentId: number, data: any): Promise<any> {
    return this.request(`/nlp/documents/${documentId}/update_structured_data/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async deleteDocument(documentId: number): Promise<void> {
    await this.request(`/nlp/documents/${documentId}/`, {
      method: 'DELETE',
    });
    // Returns void, no need to return anything
  }
}

export const uploadDocument = (title: string, text: string) => ApiService.uploadDocument(title, text);
export const getDocuments = () => ApiService.getDocuments();
export const getDocument = (id: number) => ApiService.getDocument(id);
export const getExtractions = (documentId: number) => ApiService.getExtractions(documentId);
export const getStructuredData = (documentId: number) => ApiService.getStructuredData(documentId);
export const quickExtract = (text: string) => ApiService.quickExtract(text);
export const correctExtraction = (extractionId: number, corrections: any) => ApiService.correctExtraction(extractionId, corrections);
export const exportDocument = (documentId: number, format: string) => ApiService.exportDocument(documentId, format);
export const reprocessDocument = (documentId: number) => ApiService.reprocessDocument(documentId);
export const getFeedbackStatistics = () => ApiService.getFeedbackStatistics();
export const updateStructuredData = (documentId: number, data: any) => ApiService.updateStructuredData(documentId, data);
export const deleteDocument = (documentId: number) => ApiService.deleteDocument(documentId);
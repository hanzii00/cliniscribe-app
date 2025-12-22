// lib/api.ts - Updated with complete interfaces
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
  blood_pressure?: string | number;
  heart_rate?: string | number;
  respiratory_rate?: string | number;
  temperature?: string | number;
  oxygen_saturation?: string | number;
  bp?: string | number;
  hr?: string | number;
  rr?: string | number;
  temp?: string | number;
  spo2?: string | number;
}

export interface PatientInfo {
  name?: string;
  age?: string | number;
  gender?: string;
  patient_id?: string;
  room_number?: string;
  admission_date?: string;
  diagnosis?: string;
  [key: string]: any; // Allow additional fields
}

export interface Medication {
  name?: string;
  dosage?: string;
  route?: string;
  frequency?: string;
  time?: string;
  [key: string]: any; // Allow additional fields
}

export interface ExtractedData {
  id?: number;
  document?: number;
  patient_info?: PatientInfo;
  vital_signs?: VitalSigns;
  vitals?: VitalSigns;
  medications?: Medication[];
  symptoms?: string[];
  pain_level?: number;
  pain_location?: string;
  consciousness_level?: string;
  consciousness?: string;
  orientation?: string;
  mobility_status?: string;
  mobility?: string;
  assessments?: string[];
  interventions?: string[];
  is_verified?: boolean;
  created_at?: string;
  [key: string]: any; // Allow additional fields from backend
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

// ==================== OCR INTERFACES ====================
export interface OCRResult {
  success: boolean;
  extracted_text?: string;
  confidence?: number;
  metadata?: {
    original_size: [number, number];
    original_mode: string;
    preprocessed: boolean;
    language: string;
    word_count: number;
    character_count: number;
  };
  quality_indicators?: {
    confidence_level: 'high' | 'medium' | 'low';
    needs_review: boolean;
    text_detected: boolean;
  };
  validation_warnings?: string[];
  error?: string;
}

export interface OCRProcessResult {
  status: string;
  document?: Document;
  ocr_metadata?: {
    confidence: number;
    quality: {
      confidence_level: string;
      needs_review: boolean;
      text_detected: boolean;
    };
    text_length: number;
  };
  extraction_count?: number;
  error?: string;
  validation_warnings?: string[];
}

export interface BatchOCRResult {
  total_processed: number;
  successful: number;
  failed: number;
  results: Array<{
    success: boolean;
    document_id?: number;
    confidence?: number;
    error?: string;
  }>;
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

    if (response.status === 204) {
      return null;
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }

    return null;
  }

  // ==================== OCR ENDPOINTS ====================
  
  static async ocrExtract(imageFile: File, preprocess: boolean = true): Promise<OCRResult> {
    const token = this.getToken();
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('preprocess', preprocess.toString());

    const response = await fetch(`${API_BASE_URL}/nlp/documents/ocr_extract/`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'OCR extraction failed');
    }

    return response.json();
  }

  static async ocrAndProcess(imageFile: File, title?: string): Promise<OCRProcessResult> {
    const token = this.getToken();
    const formData = new FormData();
    formData.append('image', imageFile);
    if (title) {
      formData.append('title', title);
    }

    const response = await fetch(`${API_BASE_URL}/nlp/documents/ocr_and_process/`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'OCR processing failed');
    }

    return response.json();
  }

  static async batchOCR(imageFiles: File[]): Promise<BatchOCRResult> {
    const token = this.getToken();
    const formData = new FormData();
    imageFiles.forEach((file) => {
      formData.append('images', file);
    });

    const response = await fetch(`${API_BASE_URL}/nlp/documents/batch_ocr/`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Batch OCR failed');
    }

    return response.json();
  }

  // ==================== EXISTING ENDPOINTS ====================
  
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

    if (response.success && response.extracted_data) {
      return response.extracted_data;
    }

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
  }
}

// Export convenience functions
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

// Export new OCR functions
export const ocrExtract = (imageFile: File, preprocess?: boolean) => ApiService.ocrExtract(imageFile, preprocess);
export const ocrAndProcess = (imageFile: File, title?: string) => ApiService.ocrAndProcess(imageFile, title);
export const batchOCR = (imageFiles: File[]) => ApiService.batchOCR(imageFiles);
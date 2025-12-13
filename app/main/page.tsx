// app/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { AlertCircle, FileText, Upload, CheckCircle, XCircle, BarChart3, X } from 'lucide-react';
import QuickExtract from '@/components/QuickExtract';
import Documents from '@/components/Documents';
import Statistics from '@/components/Statistics';
import UserMenu from '@/components/UserMenu';
import { ApiService, Document, ExtractedData } from '@/lib/api';

// Toast Component
const Toast = ({ message, type, onClose }: { message: string; type: 'error' | 'success'; onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const styles = type === 'error' 
    ? 'bg-red-50 border-red-200 text-red-900'
    : 'bg-green-50 border-green-200 text-green-900';
  
  const Icon = type === 'error' ? AlertCircle : CheckCircle;
  const iconColor = type === 'error' ? 'text-red-600' : 'text-green-600';

  return (
    <div className={`${styles} border rounded-lg p-4 shadow-lg flex items-start gap-3 min-w-[320px] max-w-md animate-slide-in`}>
      <Icon className={`w-5 h-5 ${iconColor} flex-shrink-0 mt-0.5`} />
      <div className="flex-1">
        <h3 className="font-medium">{type === 'error' ? 'Error' : 'Success'}</h3>
        <p className="text-sm mt-0.5">{message}</p>
      </div>
      <button onClick={onClose} className={`${iconColor} hover:opacity-70 transition`}>
        <X className="w-5 h-5" />
      </button>
    </div>
  );
};

// Toast Container Component
const ToastContainer = ({ toasts, onRemove }: { toasts: Array<{ id: number; message: string; type: 'error' | 'success' }>; onRemove: (id: number) => void }) => {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-3">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => onRemove(toast.id)}
        />
      ))}
    </div>
  );
};

export default function N2SDCPage() {
  const [currentView, setCurrentView] = useState<'quick-extract' | 'documents' | 'statistics'>('quick-extract');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState<Array<{ id: number; message: string; type: 'error' | 'success' }>>([]);
  const [toastIdCounter, setToastIdCounter] = useState(0);

  // Toast helpers
  const showToast = (message: string, type: 'error' | 'success') => {
    const id = toastIdCounter;
    setToastIdCounter(prev => prev + 1);
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const showError = (message: string) => showToast(message, 'error');
  const showSuccess = (message: string) => showToast(message, 'success');

  // ------------------ API Handlers ------------------
  const loadDocuments = async () => {
    try {
      setLoading(true);
      const docs = await ApiService.getDocuments();
      setDocuments(docs);
    } catch (err: any) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickExtract = async (text: string) => {
    try {
      setLoading(true);
      const result = await ApiService.quickExtract(text);
      setExtractedData(result);
      showSuccess('Extraction completed successfully!');
    } catch (err: any) {
      showError(err.message);
      setExtractedData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadDocument = async (title: string, text: string) => {
    try {
      setLoading(true);
      const newDoc = await ApiService.uploadDocument(title, text);
      showSuccess('Document uploaded successfully!');
      await loadDocuments();
      await handleViewDocument(newDoc);
    } catch (err: any) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDocument = async (doc: Document) => {
    try {
      setLoading(true);
      setSelectedDocument(doc);
      const structuredData = await ApiService.getStructuredData(doc.id);
      setExtractedData(structuredData);
    } catch (err: any) {
      showError(err.message);
      setExtractedData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCorrectExtraction = async (documentId: number, corrections: any) => {
    try {
      setLoading(true);
      await ApiService.updateStructuredData(documentId, corrections);
      showSuccess('Changes saved successfully!');
      if (selectedDocument) {
        const structuredData = await ApiService.getStructuredData(selectedDocument.id);
        setExtractedData(structuredData);
      }
    } catch (err: any) {
      showError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAsDocument = async (title: string, text: string) => {
    try {
      setLoading(true);
      await ApiService.uploadDocument(title, text);
      showSuccess('Document saved successfully!');
      await loadDocuments();
      setCurrentView('documents');
    } catch (err: any) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: string) => {
    if (!selectedDocument) return;
    try {
      setLoading(true);
      const blob = await ApiService.exportDocument(selectedDocument.id, format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedDocument.title}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      showSuccess('Document exported successfully!');
    } catch (err: any) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReprocess = async () => {
    if (!selectedDocument) return;
    try {
      setLoading(true);
      await ApiService.reprocessDocument(selectedDocument.id);
      showSuccess('Document reprocessing started!');
      await handleViewDocument(selectedDocument);
    } catch (err: any) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDocument = async (docId: number) => {
    if (!confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      
      if (selectedDocument?.id === docId) {
        setSelectedDocument(null);
        setExtractedData(null);
      }
      
      await ApiService.deleteDocument(docId);
      setDocuments(prevDocs => prevDocs.filter(d => d.id !== docId));
      showSuccess('Document deleted successfully!');
      
    } catch (err: any) {
      console.error('Delete document error:', err);
      
      if (err.response?.status === 404) {
        showError('Document not found. It may have been already deleted. Refreshing list...');
        
        try {
          await loadDocuments();
          
          if (selectedDocument?.id === docId) {
            setSelectedDocument(null);
            setExtractedData(null);
          }
        } catch (refreshError) {
          console.error('Failed to refresh documents:', refreshError);
          showError('Document not found and failed to refresh list. Please reload the page.');
        }
      }
      else if (err.response?.status === 403) {
        showError('You do not have permission to delete this document.');
      }
      else if (err.response?.status === 401) {
        showError('Your session has expired. Please log in again.');
        setTimeout(() => {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/authentication';
        }, 2000);
      }
      else {
        showError(err.message || 'Failed to delete document. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      
      if (!refreshToken) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/authentication';
        return;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout/`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        console.warn('Logout API call failed:', data);
      }

      window.location.href = '/authentication';
    } catch (err: any) {
      console.error('Logout error:', err);
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/authentication';
    }
  };

  useEffect(() => {
    if (currentView === 'documents') {
      loadDocuments();
    }
  }, [currentView]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Toast Container */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8 text-indigo-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">N2SDC</h1>
              <p className="text-sm text-gray-500">Nursing Narrative to Structured Data Converter</p>
            </div>
          </div>
          
          <UserMenu onLogout={handleLogout} />
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1">
            {[
              { id: 'quick-extract', label: 'Quick Extract', icon: FileText },
              { id: 'documents', label: 'Documents', icon: Upload },
              { id: 'statistics', label: 'Statistics', icon: BarChart3 },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id as any)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition ${
                    currentView === item.id
                      ? 'text-indigo-600 border-b-2 border-indigo-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'quick-extract' && (
          <QuickExtract
            onExtract={handleQuickExtract}
            extractedData={extractedData}
            loading={loading}
            onSaveAsDocument={handleSaveAsDocument}
          />
        )}
        {currentView === 'documents' && (
          <Documents
            documents={documents}
            onUpload={handleUploadDocument}
            loading={loading}
            selectedDocument={selectedDocument}
            extractedData={extractedData}
            onViewDocument={handleViewDocument}
            onExport={handleExport}
            onReprocess={handleReprocess}
            onDelete={handleDeleteDocument}
            onCorrectExtraction={handleCorrectExtraction}
          />
        )}
        {currentView === 'statistics' && <Statistics />}
      </main>

    </div>
  );
}
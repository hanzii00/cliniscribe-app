// app/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { AlertCircle, FileText, Upload, CheckCircle, XCircle, BarChart3 } from 'lucide-react';
import QuickExtract from '@/components/QuickExtract';
import Documents from '@/components/Documents';
import Statistics from '@/components/Statistics';
import UserMenu from '@/components/UserMenu';
import { ApiService, Document, ExtractedData } from '@/lib/api';

export default function N2SDCPage() {
  const [currentView, setCurrentView] = useState<'quick-extract' | 'documents' | 'statistics'>('quick-extract');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // ------------------ API Handlers ------------------
  const loadDocuments = async () => {
    try {
      setLoading(true);
      const docs = await ApiService.getDocuments();
      setDocuments(docs);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickExtract = async (text: string) => {
    try {
      setLoading(true);
      setError(null);
      const result = await ApiService.quickExtract(text);
      setExtractedData(result);
      setSuccess('Extraction completed successfully!');
    } catch (err: any) {
      setError(err.message);
      setExtractedData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadDocument = async (title: string, text: string) => {
    try {
      setLoading(true);
      setError(null);
      const newDoc = await ApiService.uploadDocument(title, text);
      setSuccess('Document uploaded successfully!');
      await loadDocuments();
      await handleViewDocument(newDoc);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDocument = async (doc: Document) => {
    try {
      setLoading(true);
      setError(null);
      setSelectedDocument(doc);
      const structuredData = await ApiService.getStructuredData(doc.id);
      setExtractedData(structuredData);
    } catch (err: any) {
      setError(err.message);
      setExtractedData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCorrectExtraction = async (documentId: number, corrections: any) => {
    try {
      setLoading(true);
      setError(null);
      await ApiService.updateStructuredData(documentId, corrections);
      setSuccess('Changes saved successfully!');
      if (selectedDocument) {
        const structuredData = await ApiService.getStructuredData(selectedDocument.id);
        setExtractedData(structuredData);
      }
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAsDocument = async (title: string, text: string) => {
    try {
      setLoading(true);
      setError(null);
      await ApiService.uploadDocument(title, text);
      setSuccess('Document saved successfully!');
      await loadDocuments();
      setCurrentView('documents');
    } catch (err: any) {
      setError(err.message);
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
      setSuccess('Document exported successfully!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReprocess = async () => {
    if (!selectedDocument) return;
    try {
      setLoading(true);
      setError(null);
      await ApiService.reprocessDocument(selectedDocument.id);
      setSuccess('Document reprocessing started!');
      await handleViewDocument(selectedDocument);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDocument = async (docId: number) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      setLoading(true);
      if (selectedDocument?.id === docId) {
        setSelectedDocument(null);
        setExtractedData(null);
      }
      await ApiService.deleteDocument(docId);
      setSuccess('Document deleted successfully!');
      await loadDocuments();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      
      // If no refresh token, just clear storage and redirect
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

      // Always clear tokens and redirect, even if the request fails
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        console.warn('Logout API call failed:', data);
      }

      window.location.href = '/authentication';
    } catch (err: any) {
      console.error('Logout error:', err);
      // Still clear tokens and redirect on error
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
          
          {/* User Menu (Hamburger) */}
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
        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-red-900">Error</h3>
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="ml-auto text-red-600 hover:text-red-800">
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Success Alert */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-green-900">Success</h3>
              <p className="text-sm text-green-700">{success}</p>
            </div>
            <button onClick={() => setSuccess(null)} className="ml-auto text-green-600 hover:text-green-800">
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Views */}
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
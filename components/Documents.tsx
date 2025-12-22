// components/Documents.tsx
'use client';

import React, { useState } from 'react';
import { 
  Upload, 
  FileText, 
  Calendar, 
  Download, 
  RefreshCw, 
  Trash2, 
  Search,
  Edit2,
  Save,
  X,
  Image as ImageIcon,
  Type
} from 'lucide-react';
import { Document, ExtractedData } from '@/lib/api';
import OCRUpload from './OCRUpload';

interface DocumentsProps {
  documents: Document[];
  onUpload: (title: string, text: string) => Promise<void>;
  loading: boolean;
  selectedDocument: Document | null;
  extractedData: ExtractedData | null;
  onViewDocument: (doc: Document) => Promise<void>;
  onExport: (format: string) => Promise<void>;
  onReprocess: () => Promise<void>;
  onDelete: (docId: number) => Promise<void>;
  onCorrectExtraction: (documentId: number, corrections: any) => Promise<void>;
  onRefreshDocuments?: () => Promise<void>;
  showToast?: (message: string, type: 'error' | 'success' | 'info') => void;
  onOCRSuccess?: (documentId: number) => Promise<void>;
}

export default function Documents({
  documents,
  onUpload,
  loading,
  selectedDocument,
  extractedData,
  onViewDocument,
  onExport,
  onReprocess,
  onDelete,
  onCorrectExtraction,
  onRefreshDocuments,
  showToast,
  onOCRSuccess,
}: DocumentsProps) {
  const [uploadMode, setUploadMode] = useState<'text' | 'image'>('text');
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocText, setNewDocText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<any>(null);

  const filteredDocuments = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleTextUpload = async () => {
    if (!newDocTitle.trim() || !newDocText.trim()) {
      showToast?.('Please fill in both title and text', 'error');
      return;
    }

    await onUpload(newDocTitle, newDocText);
    setNewDocTitle('');
    setNewDocText('');
    setShowUploadForm(false);
  };

  const handleOCRSuccessInternal = async (documentId: number) => {
    setShowUploadForm(false);
    if (onOCRSuccess) {
      await onOCRSuccess(documentId);
    }
  };

  const handleStartEdit = () => {
    setIsEditing(true);
    setEditedData(extractedData);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedData(null);
  };

  const handleSaveEdit = async () => {
    if (!selectedDocument || !editedData) return;
    
    try {
      await onCorrectExtraction(selectedDocument.id, editedData);
      setIsEditing(false);
      setEditedData(null);
    } catch (error) {
      // Error is handled by parent
    }
  };

  const handleFieldChange = (category: string, field: string, value: any) => {
    setEditedData((prev: any) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value,
      },
    }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderExtractedData = () => {
    if (!extractedData) return null;

    const dataToRender = isEditing ? editedData : extractedData;

    return (
      <div className="space-y-6">
        {/* Edit Controls */}
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Extracted Data</h3>
          <div className="flex gap-2">
            {!isEditing ? (
              <button
                onClick={handleStartEdit}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </button>
            ) : (
              <>
                <button
                  onClick={handleSaveEdit}
                  disabled={loading}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  Save
                </button>
                <button
                  onClick={handleCancelEdit}
                  disabled={loading}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>

        {/* Patient Information */}
        {dataToRender.patient_info && (
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-3">Patient Information</h4>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(dataToRender.patient_info).map(([key, value]) => (
                <div key={key}>
                  <label className="text-xs text-blue-700 font-medium capitalize">
                    {key.replace(/_/g, ' ')}
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={value as string || ''}
                      onChange={(e) => handleFieldChange('patient_info', key, e.target.value)}
                      className="mt-1 w-full px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-sm text-blue-900 mt-1">{value as string || 'N/A'}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Vital Signs */}
        {dataToRender.vital_signs && (
          <div className="bg-green-50 rounded-lg p-4">
            <h4 className="font-semibold text-green-900 mb-3">Vital Signs</h4>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(dataToRender.vital_signs).map(([key, value]) => (
                <div key={key}>
                  <label className="text-xs text-green-700 font-medium capitalize">
                    {key.replace(/_/g, ' ')}
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={value as string || ''}
                      onChange={(e) => handleFieldChange('vital_signs', key, e.target.value)}
                      className="mt-1 w-full px-2 py-1 text-sm border border-green-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  ) : (
                    <p className="text-sm text-green-900 mt-1">{value as string || 'N/A'}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Medications */}
        {dataToRender.medications && dataToRender.medications.length > 0 && (
          <div className="bg-purple-50 rounded-lg p-4">
            <h4 className="font-semibold text-purple-900 mb-3">Medications</h4>
            <div className="space-y-2">
              {dataToRender.medications.map((med: any, idx: number) => (
                <div key={idx} className="bg-white rounded p-3 border border-purple-200">
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(med).map(([key, value]) => (
                      <div key={key}>
                        <label className="text-xs text-purple-700 font-medium capitalize">
                          {key.replace(/_/g, ' ')}
                        </label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={value as string || ''}
                            onChange={(e) => {
                              const newMeds = [...dataToRender.medications];
                              newMeds[idx] = { ...newMeds[idx], [key]: e.target.value };
                              setEditedData((prev: any) => ({ ...prev, medications: newMeds }));
                            }}
                            className="mt-1 w-full px-2 py-1 text-sm border border-purple-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        ) : (
                          <p className="text-sm text-purple-900 mt-1">{value as string || 'N/A'}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Assessments */}
        {dataToRender.assessments && dataToRender.assessments.length > 0 && (
          <div className="bg-yellow-50 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-900 mb-3">Assessments</h4>
            <div className="space-y-2">
              {dataToRender.assessments.map((assessment: string, idx: number) => (
                <div key={idx} className="bg-white rounded p-2 border border-yellow-200">
                  {isEditing ? (
                    <input
                      type="text"
                      value={assessment}
                      onChange={(e) => {
                        const newAssessments = [...dataToRender.assessments];
                        newAssessments[idx] = e.target.value;
                        setEditedData((prev: any) => ({ ...prev, assessments: newAssessments }));
                      }}
                      className="w-full px-2 py-1 text-sm border border-yellow-300 rounded focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    />
                  ) : (
                    <p className="text-sm text-yellow-900">{assessment}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Interventions */}
        {dataToRender.interventions && dataToRender.interventions.length > 0 && (
          <div className="bg-orange-50 rounded-lg p-4">
            <h4 className="font-semibold text-orange-900 mb-3">Interventions</h4>
            <div className="space-y-2">
              {dataToRender.interventions.map((intervention: string, idx: number) => (
                <div key={idx} className="bg-white rounded p-2 border border-orange-200">
                  {isEditing ? (
                    <input
                      type="text"
                      value={intervention}
                      onChange={(e) => {
                        const newInterventions = [...dataToRender.interventions];
                        newInterventions[idx] = e.target.value;
                        setEditedData((prev: any) => ({ ...prev, interventions: newInterventions }));
                      }}
                      className="w-full px-2 py-1 text-sm border border-orange-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  ) : (
                    <p className="text-sm text-orange-900">{intervention}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column - Document List */}
      <div className="lg:col-span-1 space-y-4">
        {/* Upload Section */}
        <div className="bg-white rounded-lg shadow p-4">
          <button
            onClick={() => setShowUploadForm(!showUploadForm)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
          >
            <Upload className="w-5 h-5" />
            Upload Document
          </button>

          {showUploadForm && (
            <div className="mt-4 space-y-4">
              {/* Upload Mode Tabs */}
              <div className="flex border-b border-gray-200">
                <button
                  onClick={() => setUploadMode('text')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition ${
                    uploadMode === 'text'
                      ? 'text-indigo-600 border-b-2 border-indigo-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Type className="w-4 h-4" />
                  Text
                </button>
                <button
                  onClick={() => setUploadMode('image')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition ${
                    uploadMode === 'image'
                      ? 'text-indigo-600 border-b-2 border-indigo-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <ImageIcon className="w-4 h-4" />
                  Image (OCR)
                </button>
              </div>

              {/* Text Upload Form */}
              {uploadMode === 'text' && (
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Document title"
                    value={newDocTitle}
                    onChange={(e) => setNewDocTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <textarea
                    placeholder="Paste nursing narrative here..."
                    value={newDocText}
                    onChange={(e) => setNewDocText(e.target.value)}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleTextUpload}
                      disabled={loading || !newDocTitle.trim() || !newDocText.trim()}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
                    >
                      Upload
                    </button>
                    <button
                      onClick={() => setShowUploadForm(false)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* OCR Upload Form */}
              {uploadMode === 'image' && (
                <OCRUpload
                  onSuccess={handleOCRSuccessInternal}
                  showToast={showToast}
                  mode="full-process"
                />
              )}
            </div>
          )}
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Document List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">Documents ({filteredDocuments.length})</h2>
          </div>
          <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
            {filteredDocuments.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">No documents found</p>
              </div>
            ) : (
              filteredDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className={`p-4 cursor-pointer transition hover:bg-gray-50 ${
                    selectedDocument?.id === doc.id ? 'bg-indigo-50' : ''
                  }`}
                  onClick={() => onViewDocument(doc)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">{doc.title}</h3>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                        <Calendar className="w-3 h-3" />
                        {formatDate(doc.created_at)}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(doc.id);
                      }}
                      className="ml-2 p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Right Column - Document Details */}
      <div className="lg:col-span-2">
        {selectedDocument ? (
          <div className="bg-white rounded-lg shadow">
            {/* Document Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedDocument.title}</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Created {formatDate(selectedDocument.created_at)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onExport('csv')}
                    disabled={loading}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" />
                    CSV
                  </button>
                  <button
                    onClick={() => onExport('json')}
                    disabled={loading}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" />
                    JSON
                  </button>
                  <button
                    onClick={onReprocess}
                    disabled={loading}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Reprocess
                  </button>
                </div>
              </div>

              {/* Original Text */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Original Text</h3>
                <div className="text-sm text-gray-600 max-h-32 overflow-y-auto whitespace-pre-wrap">
                  {selectedDocument.original_text}
                </div>
              </div>
            </div>

            {/* Extracted Data */}
            <div className="p-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
                </div>
              ) : (
                renderExtractedData()
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Document Selected</h3>
            <p className="text-sm text-gray-500">
              Select a document from the list or upload a new one to get started
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
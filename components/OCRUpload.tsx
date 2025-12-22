// components/OCRUpload.tsx
'use client';

import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, FileImage, AlertCircle, CheckCircle, Loader2, X } from 'lucide-react';
import { ApiService, OCRResult, OCRProcessResult } from '@/lib/api';

interface OCRUploadProps {
  onSuccess?: (documentId: number) => void;
  onTextExtracted?: (text: string) => void;
  showToast?: (message: string, type: 'error' | 'success' | 'info') => void;
  mode?: 'extract-only' | 'full-process'; // extract-only: just get text, full-process: create document
}

export default function OCRUpload({ 
  onSuccess, 
  onTextExtracted,
  showToast,
  mode = 'full-process'
}: OCRUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OCRResult | OCRProcessResult | null>(null);
  const [title, setTitle] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/bmp', 'image/tiff', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      showToast?.('Please upload a valid image file (JPG, PNG, BMP, TIFF, WebP)', 'error');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      showToast?.('File size must be less than 10MB', 'error');
      return;
    }

    setSelectedFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    
    // Reset previous results
    setResult(null);
    
    // Auto-generate title from filename if not set
    if (!title && mode === 'full-process') {
      const fileName = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
      setTitle(fileName);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleExtractText = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setResult(null);

    try {
      const ocrResult = await ApiService.ocrExtract(selectedFile, true);
      setResult(ocrResult);

      if (ocrResult.success && ocrResult.extracted_text) {
        showToast?.(`Text extracted successfully! Confidence: ${(ocrResult.confidence! * 100).toFixed(1)}%`, 'success');
        
        if (onTextExtracted) {
          onTextExtracted(ocrResult.extracted_text);
        }
      } else {
        showToast?.(ocrResult.error || 'Failed to extract text from image', 'error');
      }
    } catch (error: any) {
      console.error('OCR extraction failed:', error);
      showToast?.(error.message || 'OCR extraction failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessDocument = async () => {
    if (!selectedFile) return;

    if (mode === 'full-process' && !title.trim()) {
      showToast?.('Please enter a document title', 'error');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const processResult = await ApiService.ocrAndProcess(
        selectedFile, 
        mode === 'full-process' ? title : undefined
      );
      
      setResult(processResult);

      if (processResult.status === 'success' && processResult.document) {
        const confidence = processResult.ocr_metadata?.confidence || 0;
        showToast?.(
          `Document processed successfully! OCR Confidence: ${(confidence * 100).toFixed(1)}%`, 
          'success'
        );
        
        if (onSuccess) {
          onSuccess(processResult.document.id);
        }
      } else {
        showToast?.(processResult.error || 'Failed to process document', 'error');
      }
    } catch (error: any) {
      console.error('Document processing failed:', error);
      showToast?.(error.message || 'Document processing failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setPreview(null);
    setResult(null);
    setTitle('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-50';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-xl p-6 text-center transition ${
          dragActive 
            ? 'border-indigo-500 bg-indigo-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf"
          onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
          className="hidden"
          id="ocr-file-input"
        />

        {!preview ? (
          <div className="space-y-3">
            <div className="flex justify-center">
              <div className="p-3 bg-indigo-50 rounded-full">
                <ImageIcon className="w-8 h-8 text-indigo-600" />
              </div>
            </div>
            <div>
              <label
                htmlFor="ocr-file-input"
                className="cursor-pointer text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Choose an image
              </label>
              <span className="text-gray-500"> or drag and drop</span>
            </div>
            <p className="text-xs text-gray-500">
              Supports JPG, PNG, BMP, TIFF, WebP (max 10MB)
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="relative inline-block">
              <img 
                src={preview} 
                alt="Preview" 
                className="max-h-64 rounded-lg border border-gray-200"
              />
              <button
                onClick={handleClear}
                className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-gray-600">
              {selectedFile?.name} ({(selectedFile!.size / 1024).toFixed(1)} KB)
            </p>
          </div>
        )}
      </div>

      {/* Title Input (only in full-process mode) */}
      {mode === 'full-process' && selectedFile && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Document Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter document title..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      )}

      {/* Action Buttons */}
      {selectedFile && !result && (
        <div className="flex gap-2">
          {mode === 'extract-only' && (
            <button
              onClick={handleExtractText}
              disabled={loading}
              className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Extracting...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Extract Text
                </>
              )}
            </button>
          )}
          
          {mode === 'full-process' && (
            <button
              onClick={handleProcessDocument}
              disabled={loading || !title.trim()}
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <FileImage className="w-4 h-4" />
                  Process Document
                </>
              )}
            </button>
          )}

          <button
            onClick={handleClear}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50"
          >
            Clear
          </button>
        </div>
      )}

      {/* Results */}
      {result && 'extracted_text' in result && result.extracted_text && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Extracted Text</h3>
            {result.confidence !== undefined && (
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getConfidenceColor(result.confidence)}`}>
                {(result.confidence * 100).toFixed(1)}% confidence
              </span>
            )}
          </div>

          {result.quality_indicators?.needs_review && (
            <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <strong>Review Recommended:</strong> OCR confidence is low. Please review the extracted text carefully.
              </div>
            </div>
          )}

          <div className="bg-gray-50 rounded-lg p-3 max-h-48 overflow-y-auto">
            <pre className="text-sm text-gray-900 whitespace-pre-wrap font-mono">
              {result.extracted_text}
            </pre>
          </div>

          {result.metadata && (
            <div className="text-xs text-gray-500 flex gap-4">
              <span>Words: {result.metadata.word_count}</span>
              <span>Characters: {result.metadata.character_count}</span>
              <span>Quality: {result.quality_indicators?.confidence_level}</span>
            </div>
          )}
        </div>
      )}

      {result && 'document' in result && result.document && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-green-900 mb-1">
                Document Created Successfully!
              </h3>
              <p className="text-sm text-green-800">
                Document ID: {result.document.id}
                {result.extraction_count !== undefined && (
                  <> • {result.extraction_count} entities extracted</>
                )}
              </p>
              {result.ocr_metadata && (
                <div className="mt-2 text-xs text-green-700">
                  OCR Confidence: {(result.ocr_metadata.confidence * 100).toFixed(1)}%
                  {result.ocr_metadata.quality?.needs_review && (
                    <span className="ml-2 text-yellow-700">⚠ Review recommended</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Validation Warnings */}
      {result && 'validation_warnings' in result && result.validation_warnings && result.validation_warnings.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <strong>Warnings:</strong>
              <ul className="list-disc list-inside mt-1">
                {result.validation_warnings.map((warning, i) => (
                  <li key={i}>{warning}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
// components/QuickExtract.tsx
'use client';

import React, { useState } from 'react';
import { FileText, Sparkles, Save, Type, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { ExtractedData } from '@/lib/api';
import OCRUpload from './OCRUpload';

interface QuickExtractProps {
  onExtract: (text: string) => Promise<void>;
  extractedData: ExtractedData | null;
  loading: boolean;
  onSaveAsDocument: (title: string, text: string) => Promise<void>;
  showToast?: (message: string, type: 'error' | 'success' | 'info') => void;
}

export default function QuickExtract({ 
  onExtract, 
  extractedData, 
  loading, 
  onSaveAsDocument,
  showToast 
}: QuickExtractProps) {
  const [inputMode, setInputMode] = useState<'text' | 'image'>('text');
  const [text, setText] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveTitle, setSaveTitle] = useState('');
  const [currentText, setCurrentText] = useState('');

  const handleExtract = async () => {
    if (!text.trim()) {
      showToast?.('Please enter some text to extract', 'error');
      return;
    }
    setCurrentText(text);
    await onExtract(text);
  };

  const handleOCRTextExtracted = async (extractedText: string) => {
    setText(extractedText);
    setCurrentText(extractedText);
    setInputMode('text'); // Switch to text mode to show the extracted text
    // Automatically trigger extraction
    await onExtract(extractedText);
  };

  const handleSave = async () => {
    if (!saveTitle.trim()) {
      showToast?.('Please enter a document title', 'error');
      return;
    }
    await onSaveAsDocument(saveTitle, currentText);
    setShowSaveModal(false);
    setSaveTitle('');
  };

  const renderExtractedData = () => {
    if (!extractedData) return null;

    return (
      <div className="space-y-6">
        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={() => setShowSaveModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
          >
            <Save className="w-4 h-4" />
            Save as Document
          </button>
        </div>

        {/* Patient Information */}
        {extractedData.patient_info && (
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-3">Patient Information</h4>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(extractedData.patient_info).map(([key, value]) => (
                <div key={key}>
                  <label className="text-xs text-blue-700 font-medium capitalize">
                    {key.replace(/_/g, ' ')}
                  </label>
                  <p className="text-sm text-blue-900 mt-1">{value as string || 'N/A'}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Vital Signs */}
        {(extractedData.vital_signs || extractedData.vitals) && (
          <div className="bg-green-50 rounded-lg p-4">
            <h4 className="font-semibold text-green-900 mb-3">Vital Signs</h4>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(extractedData.vital_signs || extractedData.vitals || {}).map(([key, value]) => (
                <div key={key}>
                  <label className="text-xs text-green-700 font-medium capitalize">
                    {key.replace(/_/g, ' ')}
                  </label>
                  <p className="text-sm text-green-900 mt-1">{value as string || 'N/A'}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Medications */}
        {extractedData.medications && extractedData.medications.length > 0 && (
          <div className="bg-purple-50 rounded-lg p-4">
            <h4 className="font-semibold text-purple-900 mb-3">Medications</h4>
            <div className="space-y-2">
              {extractedData.medications.map((med: any, idx: number) => (
                <div key={idx} className="bg-white rounded p-3 border border-purple-200">
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(med).map(([key, value]) => (
                      <div key={key}>
                        <label className="text-xs text-purple-700 font-medium capitalize">
                          {key.replace(/_/g, ' ')}
                        </label>
                        <p className="text-sm text-purple-900 mt-1">{value as string || 'N/A'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Symptoms */}
        {extractedData.symptoms && extractedData.symptoms.length > 0 && (
          <div className="bg-red-50 rounded-lg p-4">
            <h4 className="font-semibold text-red-900 mb-3">Symptoms</h4>
            <ul className="space-y-2">
              {extractedData.symptoms.map((symptom: string, idx: number) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-red-600 mt-1">•</span>
                  <span className="text-sm text-red-900">{symptom}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Pain Assessment */}
        {(extractedData.pain_level !== undefined || extractedData.pain_location) && (
          <div className="bg-orange-50 rounded-lg p-4">
            <h4 className="font-semibold text-orange-900 mb-3">Pain Assessment</h4>
            <div className="grid grid-cols-2 gap-3">
              {extractedData.pain_level !== undefined && (
                <div>
                  <label className="text-xs text-orange-700 font-medium">Pain Level</label>
                  <p className="text-sm text-orange-900 mt-1">{extractedData.pain_level}/10</p>
                </div>
              )}
              {extractedData.pain_location && (
                <div>
                  <label className="text-xs text-orange-700 font-medium">Location</label>
                  <p className="text-sm text-orange-900 mt-1">{extractedData.pain_location}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Consciousness & Orientation */}
        {(extractedData.consciousness_level || extractedData.consciousness || extractedData.orientation) && (
          <div className="bg-indigo-50 rounded-lg p-4">
            <h4 className="font-semibold text-indigo-900 mb-3">Neurological Status</h4>
            <div className="grid grid-cols-2 gap-3">
              {(extractedData.consciousness_level || extractedData.consciousness) && (
                <div>
                  <label className="text-xs text-indigo-700 font-medium">Consciousness</label>
                  <p className="text-sm text-indigo-900 mt-1">
                    {extractedData.consciousness_level || extractedData.consciousness}
                  </p>
                </div>
              )}
              {extractedData.orientation && (
                <div>
                  <label className="text-xs text-indigo-700 font-medium">Orientation</label>
                  <p className="text-sm text-indigo-900 mt-1">{extractedData.orientation}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mobility */}
        {(extractedData.mobility_status || extractedData.mobility) && (
          <div className="bg-teal-50 rounded-lg p-4">
            <h4 className="font-semibold text-teal-900 mb-3">Mobility Status</h4>
            <p className="text-sm text-teal-900">
              {extractedData.mobility_status || extractedData.mobility}
            </p>
          </div>
        )}

        {/* Interventions */}
        {extractedData.interventions && extractedData.interventions.length > 0 && (
          <div className="bg-yellow-50 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-900 mb-3">Interventions</h4>
            <ul className="space-y-2">
              {extractedData.interventions.map((intervention: string, idx: number) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-yellow-600 mt-1">•</span>
                  <span className="text-sm text-yellow-900">{intervention}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left Column - Input */}
      <div className="space-y-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-6 h-6 text-indigo-600" />
            <h2 className="text-xl font-bold text-gray-900">Quick Extract</h2>
          </div>
          
          <p className="text-sm text-gray-600 mb-6">
            Extract structured data from nursing narratives without saving to database.
          </p>

          {/* Input Mode Tabs */}
          <div className="flex border-b border-gray-200 mb-6">
            <button
              onClick={() => setInputMode('text')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition ${
                inputMode === 'text'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Type className="w-4 h-4" />
              Text Input
            </button>
            <button
              onClick={() => setInputMode('image')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition ${
                inputMode === 'image'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              Image (OCR)
            </button>
          </div>

          {/* Text Input Mode */}
          {inputMode === 'text' && (
            <>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste nursing narrative here..."
                rows={12}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4"
              />
              
              <button
                onClick={handleExtract}
                disabled={loading || !text.trim()}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Extract Data
                  </>
                )}
              </button>
            </>
          )}

          {/* OCR Input Mode */}
          {inputMode === 'image' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">How OCR Works Here:</p>
                  <ol className="list-decimal list-inside space-y-1 text-xs">
                    <li>Upload an image containing nursing narrative text</li>
                    <li>Text will be extracted and automatically analyzed</li>
                    <li>Review the extracted data and save if needed</li>
                  </ol>
                </div>
              </div>

              <OCRUpload
                onTextExtracted={handleOCRTextExtracted}
                showToast={showToast}
                mode="extract-only"
              />
            </div>
          )}
        </div>
      </div>

      {/* Right Column - Results */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Extracted Data</h3>
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-sm text-gray-600">Extracting data...</p>
          </div>
        ) : extractedData ? (
          renderExtractedData()
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <Sparkles className="w-12 h-12 mb-3" />
            <p className="text-sm">No data extracted yet</p>
            <p className="text-xs mt-1">Enter text or upload an image to get started</p>
          </div>
        )}
      </div>

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Save as Document</h3>
            
            <input
              type="text"
              value={saveTitle}
              onChange={(e) => setSaveTitle(e.target.value)}
              placeholder="Enter document title..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4"
              autoFocus
            />

            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={!saveTitle.trim()}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setShowSaveModal(false);
                  setSaveTitle('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
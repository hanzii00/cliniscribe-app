// components/Documents.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Upload, FileText, Clock, X, Download, RefreshCw, Edit, Save, FileDown } from 'lucide-react';
import { Document, ExtractedData } from '@/lib/api';

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
  onCorrectExtraction?: (extractionId: number, corrections: any) => Promise<void>;
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    pending: 'bg-yellow-100 text-yellow-700',
    processing: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    failed: 'bg-red-100 text-red-700',
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
      {status}
    </span>
  );
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
}: DocumentsProps) {
  const [showUpload, setShowUpload] = useState(false);
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<ExtractedData | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);

  const handleUpload = async () => {
    if (title.trim() && text.trim()) {
      await onUpload(title, text);
      setTitle('');
      setText('');
      setShowUpload(false);
    }
  };

  useEffect(() => {
    if (extractedData) {
      // Normalize backend data structure
      const normalized = {
        ...extractedData,
        vital_signs: extractedData.vital_signs || extractedData.vitals || {},
        consciousness_level: extractedData.consciousness_level || extractedData.consciousness,
        mobility_status: extractedData.mobility_status || extractedData.mobility,
      };
      setEditedData(normalized);
      setIsEditing(false);
    }
  }, [extractedData]);

  const handleSaveEdit = async () => {
    if (!editedData || !onCorrectExtraction || !selectedDocument) {
      alert('Cannot save: Missing document or correction handler');
      return;
    }

    try {
      setSaveLoading(true);
      // Use document ID since we're saving the entire structured data
      await onCorrectExtraction(selectedDocument.id, editedData);
      setIsEditing(false);
    } catch (error) {
      console.error('Save failed:', error);
      alert('Failed to save changes');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDownloadDocument = () => {
    if (!selectedDocument) return;
    
    const blob = new Blob([selectedDocument.original_text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedDocument.title}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadAsWord = async () => {
    if (!selectedDocument) return;

    try {
      // Dynamic import to avoid SSR issues
      const { Document: DocxDocument, Packer, Paragraph, TextRun, HeadingLevel } = await import('docx');
      const { saveAs } = await import('file-saver');

      // Create document sections
      const sections = [];

      // Title
      sections.push(
        new Paragraph({
          text: selectedDocument.title,
          heading: HeadingLevel.HEADING_1,
        })
      );

      // Original text
      sections.push(
        new Paragraph({
          text: 'Original Note:',
          heading: HeadingLevel.HEADING_2,
        })
      );
      sections.push(
        new Paragraph({
          text: selectedDocument.original_text,
        })
      );

      // Add extracted data if available
      if (extractedData) {
        sections.push(
          new Paragraph({
            text: '',
          })
        );
        sections.push(
          new Paragraph({
            text: 'Extracted Data:',
            heading: HeadingLevel.HEADING_2,
          })
        );

        // Vital Signs
        if (extractedData.vital_signs && Object.keys(extractedData.vital_signs).length > 0) {
          sections.push(
            new Paragraph({
              text: 'Vital Signs',
              heading: HeadingLevel.HEADING_3,
            })
          );
          if (extractedData.vital_signs.blood_pressure) {
            sections.push(new Paragraph({ text: `Blood Pressure: ${extractedData.vital_signs.blood_pressure}` }));
          }
          if (extractedData.vital_signs.heart_rate) {
            sections.push(new Paragraph({ text: `Heart Rate: ${extractedData.vital_signs.heart_rate} bpm` }));
          }
          if (extractedData.vital_signs.respiratory_rate) {
            sections.push(new Paragraph({ text: `Respiratory Rate: ${extractedData.vital_signs.respiratory_rate} /min` }));
          }
          if (extractedData.vital_signs.temperature) {
            sections.push(new Paragraph({ text: `Temperature: ${extractedData.vital_signs.temperature}°C` }));
          }
          if (extractedData.vital_signs.oxygen_saturation) {
            sections.push(new Paragraph({ text: `O2 Saturation: ${extractedData.vital_signs.oxygen_saturation}%` }));
          }
        }

        // Symptoms
        if (extractedData.symptoms && extractedData.symptoms.length > 0) {
          sections.push(
            new Paragraph({
              text: 'Symptoms',
              heading: HeadingLevel.HEADING_3,
            })
          );
          extractedData.symptoms.forEach((symptom) => {
            sections.push(new Paragraph({ text: `• ${symptom}` }));
          });
        }

        // Pain Assessment
        if (extractedData.pain_level !== null && extractedData.pain_level !== undefined) {
          sections.push(
            new Paragraph({
              text: 'Pain Assessment',
              heading: HeadingLevel.HEADING_3,
            })
          );
          sections.push(new Paragraph({ text: `Pain Level: ${extractedData.pain_level}/10` }));
          if (extractedData.pain_location) {
            sections.push(new Paragraph({ text: `Location: ${extractedData.pain_location}` }));
          }
        }

        // Neurological
        if (extractedData.consciousness_level) {
          sections.push(
            new Paragraph({
              text: 'Neurological',
              heading: HeadingLevel.HEADING_3,
            })
          );
          sections.push(new Paragraph({ text: `Consciousness: ${extractedData.consciousness_level}` }));
          if (extractedData.orientation) {
            sections.push(new Paragraph({ text: `Orientation: ${extractedData.orientation}` }));
          }
        }

        // Mobility
        if (extractedData.mobility_status) {
          sections.push(
            new Paragraph({
              text: 'Mobility',
              heading: HeadingLevel.HEADING_3,
            })
          );
          sections.push(new Paragraph({ text: extractedData.mobility_status }));
        }

        // Interventions
        if (extractedData.interventions && extractedData.interventions.length > 0) {
          sections.push(
            new Paragraph({
              text: 'Interventions',
              heading: HeadingLevel.HEADING_3,
            })
          );
          extractedData.interventions.forEach((intervention) => {
            sections.push(new Paragraph({ text: `• ${intervention}` }));
          });
        }
      }

      // Create the document
      const doc = new DocxDocument({
        sections: [
          {
            properties: {},
            children: sections,
          },
        ],
      });

      // Generate and download
      const blob = await Packer.toBlob(doc);
      saveAs(blob, `${selectedDocument.title}.docx`);
    } catch (error) {
      console.error('Failed to generate Word document:', error);
      alert('Failed to generate Word document. Please try again.');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Documents List */}
      <div className="lg:col-span-1 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">Documents</h2>
          <button
            onClick={() => setShowUpload(!showUpload)}
            className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Upload
          </button>
        </div>

        {showUpload && (
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h3 className="font-bold text-gray-900 mb-3">Upload Document</h3>
            <div className="space-y-3">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Document Title"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Nursing note..."
                className="w-full h-24 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleUpload}
                  disabled={loading || !title.trim() || !text.trim()}
                  className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                >
                  {loading ? 'Uploading...' : 'Upload'}
                </button>
                <button
                  onClick={() => setShowUpload(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {documents.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Upload className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No documents yet</p>
            </div>
          ) : (
            documents.map((doc: Document) => (
              <div
                key={doc.id}
                onClick={() => onViewDocument(doc)}
                className={`bg-white rounded-lg shadow-sm p-4 cursor-pointer hover:shadow-md transition ${
                  selectedDocument?.id === doc.id ? 'ring-2 ring-indigo-600' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <FileText className="w-6 h-6 text-indigo-600 flex-shrink-0" />
                  <StatusBadge status={doc.status} />
                </div>
                <h3 className="font-semibold text-gray-900 text-sm mb-1">{doc.title}</h3>
                <p className="text-xs text-gray-600 line-clamp-2 mb-2">{doc.original_text}</p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(doc.created_at).toLocaleDateString()}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(doc.id);
                    }}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Document Details */}
      <div className="lg:col-span-2">
        {selectedDocument ? (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedDocument.title}</h2>
                <p className="text-sm text-gray-600 mt-1">{selectedDocument.original_text}</p>
              </div>
              <div className="flex gap-2">
                {extractedData && !isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                )}
                {isEditing && (
                  <>
                    <button
                      onClick={handleSaveEdit}
                      disabled={saveLoading}
                      className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 flex items-center gap-2 disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      {saveLoading ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        if (extractedData) {
                          setEditedData(extractedData);
                        }
                      }}
                      disabled={saveLoading}
                      className="px-3 py-2 border border-gray-300 text-gray-700 bg-white rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </>
                )}
                <button
                  onClick={() => onExport('json')}
                  disabled={loading || isEditing}
                  className="px-3 py-2 border border-gray-300 text-gray-700 bg-white rounded-lg text-sm hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="w-4 h-4" />
                  JSON
                </button>
                <button
                  onClick={() => onExport('csv')}
                  disabled={loading || isEditing}
                  className="px-3 py-2 border border-gray-300 text-gray-700 bg-white rounded-lg text-sm hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="w-4 h-4" />
                  CSV
                </button>
                <button
                  onClick={onReprocess}
                  disabled={loading || isEditing}
                  className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 flex items-center gap-2 disabled:opacity-50"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reprocess
                </button>
              </div>
            </div>

            {extractedData ? (
              <div className="space-y-4">
                {isEditing && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                    <strong>Editing Mode:</strong> Modify the extracted data below and click Save to update.
                  </div>
                )}
                
                {/* Vital Signs */}
                {(extractedData.vital_signs || isEditing) && (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">Vital Signs</h3>
                    {!isEditing ? (
                      <div className="grid grid-cols-2 gap-3">
                        {extractedData.vital_signs?.blood_pressure && (
                          <div>
                            <p className="text-xs text-gray-500">Blood Pressure</p>
                            <p className="text-sm font-medium">{extractedData.vital_signs.blood_pressure}</p>
                          </div>
                        )}
                        {extractedData.vital_signs?.heart_rate && (
                          <div>
                            <p className="text-xs text-gray-500">Heart Rate</p>
                            <p className="text-sm font-medium">{extractedData.vital_signs.heart_rate} bpm</p>
                          </div>
                        )}
                        {extractedData.vital_signs?.respiratory_rate && (
                          <div>
                            <p className="text-xs text-gray-500">Respiratory Rate</p>
                            <p className="text-sm font-medium">{extractedData.vital_signs.respiratory_rate} /min</p>
                          </div>
                        )}
                        {extractedData.vital_signs?.temperature && (
                          <div>
                            <p className="text-xs text-gray-500">Temperature</p>
                            <p className="text-sm font-medium">{extractedData.vital_signs.temperature}°C</p>
                          </div>
                        )}
                        {extractedData.vital_signs?.oxygen_saturation && (
                          <div>
                            <p className="text-xs text-gray-500">O2 Saturation</p>
                            <p className="text-sm font-medium">{extractedData.vital_signs.oxygen_saturation}%</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-gray-500 block mb-1">Blood Pressure</label>
                          <input
                            type="text"
                            value={editedData?.vital_signs?.blood_pressure || ''}
                            onChange={(e) =>
                              setEditedData((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      vital_signs: { ...prev.vital_signs, blood_pressure: e.target.value },
                                    }
                                  : null
                              )
                            }
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-gray-900 bg-white"
                            placeholder="e.g., 120/80"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 block mb-1">Heart Rate</label>
                          <input
                            type="number"
                            value={editedData?.vital_signs?.heart_rate || ''}
                            onChange={(e) =>
                              setEditedData((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      vital_signs: { ...prev.vital_signs, heart_rate: Number(e.target.value) },
                                    }
                                  : null
                              )
                            }
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-gray-900 bg-white"
                            placeholder="bpm"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 block mb-1">Respiratory Rate</label>
                          <input
                            type="number"
                            value={editedData?.vital_signs?.respiratory_rate || ''}
                            onChange={(e) =>
                              setEditedData((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      vital_signs: { ...prev.vital_signs, respiratory_rate: Number(e.target.value) },
                                    }
                                  : null
                              )
                            }
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-gray-900 bg-white"
                            placeholder="/min"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 block mb-1">Temperature</label>
                          <input
                            type="number"
                            step="0.1"
                            value={editedData?.vital_signs?.temperature || ''}
                            onChange={(e) =>
                              setEditedData((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      vital_signs: { ...prev.vital_signs, temperature: Number(e.target.value) },
                                    }
                                  : null
                              )
                            }
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-gray-900 bg-white"
                            placeholder="°C"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 block mb-1">O2 Saturation</label>
                          <input
                            type="number"
                            value={editedData?.vital_signs?.oxygen_saturation || ''}
                            onChange={(e) =>
                              setEditedData((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      vital_signs: { ...prev.vital_signs, oxygen_saturation: Number(e.target.value) },
                                    }
                                  : null
                              )
                            }
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-gray-900 bg-white"
                            placeholder="%"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Symptoms */}
                {extractedData.symptoms && extractedData.symptoms.length > 0 && (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">Symptoms</h3>
                    <div className="flex flex-wrap gap-2">
                      {extractedData.symptoms.map((symptom: string, i: number) => (
                        <span key={i} className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                          {symptom}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pain Assessment */}
                {extractedData.pain_level !== null && extractedData.pain_level !== undefined && (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">Pain Assessment</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-gray-500">Pain Level</p>
                        <p className="text-sm font-medium">{extractedData.pain_level}/10</p>
                      </div>
                      {extractedData.pain_location && (
                        <div>
                          <p className="text-xs text-gray-500">Location</p>
                          <p className="text-sm font-medium">{extractedData.pain_location}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Neurological */}
                {extractedData.consciousness_level && (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">Neurological</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-gray-500">Consciousness</p>
                        <p className="text-sm font-medium">{extractedData.consciousness_level}</p>
                      </div>
                      {extractedData.orientation && (
                        <div>
                          <p className="text-xs text-gray-500">Orientation</p>
                          <p className="text-sm font-medium">{extractedData.orientation}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Mobility */}
                {extractedData.mobility_status && (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">Mobility</h3>
                    <p className="text-sm font-medium">{extractedData.mobility_status}</p>
                  </div>
                )}

                {/* Interventions */}
                {extractedData.interventions && extractedData.interventions.length > 0 && (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">Interventions</h3>
                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                      {extractedData.interventions.map((intervention: string, i: number) => (
                        <li key={i}>{intervention}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>No extraction data available</p>
                <p className="text-sm mt-2">Click Reprocess to extract data from this document</p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-6 h-full flex items-center justify-center text-gray-400">
            <div className="text-center">
              <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Select a document to view details</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
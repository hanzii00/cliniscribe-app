// components/QuickExtract.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Loader2, Save } from 'lucide-react';
import { ExtractedData } from '@/lib/api';

interface QuickExtractProps {
  onExtract: (text: string) => Promise<void>;
  extractedData: ExtractedData | null;
  loading: boolean;
  onSaveAsDocument?: (title: string, text: string) => Promise<void>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <h3 className="font-semibold text-gray-900 mb-3">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-gray-600">{label}:</span>
      <span className="text-sm font-medium text-gray-900">{value}</span>
    </div>
  );
}

export default function QuickExtract({ onExtract, extractedData, loading, onSaveAsDocument }: QuickExtractProps) {
  const [text, setText] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [documentTitle, setDocumentTitle] = useState('');

  // Normalize the data for display
  const displayData = extractedData ? {
    ...extractedData,
    vital_signs: extractedData.vital_signs || extractedData.vitals || {},
    consciousness_level: extractedData.consciousness_level || extractedData.consciousness,
    mobility_status: extractedData.mobility_status || extractedData.mobility,
  } : null;

  const handleSaveAsDocument = async () => {
    if (documentTitle.trim() && text.trim() && onSaveAsDocument) {
      await onSaveAsDocument(documentTitle, text);
      setShowSaveDialog(false);
      setDocumentTitle('');
      setText('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <h3 className="font-semibold text-indigo-900 mb-3">Save as Document</h3>
          <div className="space-y-3">
            <input
              type="text"
              value={documentTitle}
              onChange={(e) => setDocumentTitle(e.target.value)}
              placeholder="Document Title"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="flex gap-2">
              <button
                onClick={handleSaveAsDocument}
                disabled={!documentTitle.trim()}
                className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
              >
                Save Document
              </button>
              <button
                onClick={() => setShowSaveDialog(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Input Nursing Note</h2>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Example: Pt awake and responsive. BP 150/90, HR 102, RR 22. Complains of mild headache since morning. No nausea."
            className="w-full h-64 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none text-gray-900 bg-white placeholder-gray-400"
          />
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => text.trim() && onExtract(text)}
              disabled={loading || !text.trim()}
              className="flex-1 bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Extracting...
                </>
              ) : (
                <>
                  <FileText className="w-5 h-5" />
                  Extract Data
                </>
              )}
            </button>
            {displayData && onSaveAsDocument && (
              <button
                onClick={() => setShowSaveDialog(true)}
                className="px-4 py-3 border border-indigo-600 text-indigo-600 rounded-lg font-medium hover:bg-indigo-50 transition flex items-center gap-2"
              >
                <Save className="w-5 h-5" />
                Save as Document
              </button>
            )}
          </div>
          {displayData && (
            <p className="text-xs text-gray-500 mt-2">
              💡 Tip: Save this as a document to edit the extracted data and keep it in your records
            </p>
          )}
        </div>

        {/* Output Section */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Structured Output</h2>
          </div>

          {displayData ? (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {/* Vital Signs */}
              {displayData.vital_signs && Object.keys(displayData.vital_signs).length > 0 && (
                <Section title="Vital Signs">
                  {displayData.vital_signs.blood_pressure && (
                    <Field label="Blood Pressure" value={displayData.vital_signs.blood_pressure} />
                  )}
                  {displayData.vital_signs.heart_rate && (
                    <Field label="Heart Rate" value={`${displayData.vital_signs.heart_rate} bpm`} />
                  )}
                  {displayData.vital_signs.respiratory_rate && (
                    <Field label="Respiratory Rate" value={`${displayData.vital_signs.respiratory_rate} /min`} />
                  )}
                  {displayData.vital_signs.temperature && (
                    <Field label="Temperature" value={`${displayData.vital_signs.temperature}°C`} />
                  )}
                  {displayData.vital_signs.oxygen_saturation && (
                    <Field label="O2 Saturation" value={`${displayData.vital_signs.oxygen_saturation}%`} />
                  )}
                </Section>
              )}

              {/* Symptoms */}
              {displayData.symptoms && displayData.symptoms.length > 0 && (
                <Section title="Symptoms">
                  <div className="flex flex-wrap gap-2">
                    {displayData.symptoms.map((symptom: string, i: number) => (
                      <span key={i} className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                        {symptom}
                      </span>
                    ))}
                  </div>
                </Section>
              )}

              {/* Pain Assessment */}
              {(displayData.pain_level !== null && displayData.pain_level !== undefined) && (
                <Section title="Pain Assessment">
                  <Field label="Pain Level" value={`${displayData.pain_level}/10`} />
                  {displayData.pain_location && <Field label="Location" value={displayData.pain_location} />}
                </Section>
              )}

              {/* Neurological */}
              {displayData.consciousness_level && (
                <Section title="Neurological">
                  <Field label="Consciousness" value={displayData.consciousness_level} />
                  {displayData.orientation && <Field label="Orientation" value={displayData.orientation} />}
                </Section>
              )}

              {/* Mobility */}
              {displayData.mobility_status && (
                <Section title="Mobility">
                  <Field label="Status" value={displayData.mobility_status} />
                </Section>
              )}

              {/* Interventions */}
              {displayData.interventions && displayData.interventions.length > 0 && (
                <Section title="Interventions">
                  <ul className="list-disc list-inside text-sm text-gray-700">
                    {displayData.interventions.map((intervention: string, i: number) => (
                      <li key={i}>{intervention}</li>
                    ))}
                  </ul>
                </Section>
              )}
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>No data extracted yet</p>
                <p className="text-sm mt-2">Enter nursing notes and click Extract Data</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
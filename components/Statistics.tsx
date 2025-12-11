// components/Statistics.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Activity, FileText, Loader2 } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface Statistics {
  total_documents: number;
  total_extractions: number;
  total_corrections: number;
  accuracy_rate: number;
  avg_processing_time: number;
  corrections_by_type?: {
    correction: number;
    deletion: number;
    addition: number;
  };
  by_entity_type?: Record<string, number>;
}

export default function Statistics() {
  const [stats, setStats] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_URL}/nlp/feedback/statistics/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch statistics');
      }

      const data = await response.json();
      setStats(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="text-center text-red-600">
          <p>Error loading statistics: {error}</p>
          <button onClick={loadStatistics} className="mt-4 text-indigo-600 hover:text-indigo-700 text-sm">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <p className="text-center text-gray-400">No statistics available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Statistics & Analytics</h2>
        <button
          onClick={loadStatistics}
          className="text-indigo-600 hover:text-indigo-700 text-sm flex items-center gap-2"
        >
          <Activity className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-sm p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <FileText className="w-8 h-8 opacity-90" />
            <div className="text-right">
              <p className="text-3xl font-bold">{stats.total_documents || 0}</p>
            </div>
          </div>
          <h3 className="text-sm font-medium text-blue-100">Total Documents</h3>
        </div>

        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-sm p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <BarChart3 className="w-8 h-8 opacity-90" />
            <div className="text-right">
              <p className="text-3xl font-bold">{stats.total_extractions || 0}</p>
            </div>
          </div>
          <h3 className="text-sm font-medium text-indigo-100">Total Extractions</h3>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-sm p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="w-8 h-8 opacity-90" />
            <div className="text-right">
              <p className="text-3xl font-bold">{(stats.accuracy_rate || 0).toFixed(1)}%</p>
            </div>
          </div>
          <h3 className="text-sm font-medium text-green-100">Accuracy Rate</h3>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-sm p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <Activity className="w-8 h-8 opacity-90" />
            <div className="text-right">
              <p className="text-3xl font-bold">{stats.total_corrections || 0}</p>
            </div>
          </div>
          <h3 className="text-sm font-medium text-purple-100">User Corrections</h3>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Performance Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-700">Average Processing Time</h4>
              <Activity className="w-5 h-5 text-indigo-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {(stats.avg_processing_time || 0).toFixed(2)}s
            </p>
            <p className="text-xs text-gray-500 mt-1">Per document</p>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-700">Correction Rate</h4>
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {stats.total_extractions > 0
                ? ((stats.total_corrections / stats.total_extractions) * 100).toFixed(1)
                : 0}
              %
            </p>
            <p className="text-xs text-gray-500 mt-1">User feedback rate</p>
          </div>
        </div>
      </div>

      {/* Accuracy Breakdown */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">System Performance</h3>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Extraction Accuracy</span>
              <span className="text-sm font-bold text-gray-900">
                {(stats.accuracy_rate || 0).toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all"
                style={{ width: `${Math.min(stats.accuracy_rate || 0, 100)}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Documents Processed</span>
              <span className="text-sm font-bold text-gray-900">{stats.total_documents || 0}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-3 rounded-full transition-all"
                style={{ width: `${Math.min(((stats.total_documents || 0) / 100) * 100, 100)}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">User Engagement</span>
              <span className="text-sm font-bold text-gray-900">
                {stats.total_extractions > 0
                  ? ((stats.total_corrections / stats.total_extractions) * 100).toFixed(1)
                  : 0}
                %
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full transition-all"
                style={{
                  width: `${
                    stats.total_extractions > 0 
                      ? Math.min((stats.total_corrections / stats.total_extractions) * 100, 100)
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl shadow-sm p-6 border border-indigo-100">
        <h3 className="text-lg font-bold text-gray-900 mb-3">📊 Insights</h3>
        <div className="space-y-2 text-sm text-gray-700">
          <p>
            • You've processed <strong>{stats.total_documents || 0}</strong> documents with{' '}
            <strong>{stats.total_extractions || 0}</strong> total extractions.
          </p>
          <p>
            • Your system maintains an accuracy rate of <strong>{(stats.accuracy_rate || 0).toFixed(1)}%</strong>, which is{' '}
            {(stats.accuracy_rate || 0) >= 90 ? 'excellent' : (stats.accuracy_rate || 0) >= 75 ? 'good' : 'improving'}.
          </p>
          <p>
            • Users have provided <strong>{stats.total_corrections || 0}</strong> corrections, helping improve the AI model.
          </p>
          <p>
            • Average processing time is <strong>{(stats.avg_processing_time || 0).toFixed(2)}s</strong> per document.
          </p>
        </div>
      </div>
    </div>
  );
}
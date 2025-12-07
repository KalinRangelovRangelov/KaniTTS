import { useState } from 'react';
import type { Model, DownloadProgress } from '../types';
import { downloadModel, loadModel } from '../api';

interface ModelCardProps {
  model: Model;
  isSelected: boolean;
  onSelect: () => void;
  onModelUpdate: () => void;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function ModelCard({ model, isSelected, onSelect, onModelUpdate }: ModelCardProps) {
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState<DownloadProgress | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = () => {
    setDownloading(true);
    setError(null);

    downloadModel(
      model.key,
      (data) => setProgress(data),
      (err) => {
        setError(err.message);
        setDownloading(false);
      },
      () => {
        setDownloading(false);
        setError(null);  // Clear any previous errors
        setProgress(null);  // Clear progress
        onModelUpdate();
      }
    );
  };

  const handleLoad = async () => {
    setLoading(true);
    setError(null);
    try {
      await loadModel(model.key);
      onModelUpdate();
      onSelect();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load model');
    } finally {
      setLoading(false);
    }
  };

  const getFlagEmoji = () => {
    return model.key === 'en' ? '🇬🇧' : '🇩🇪';
  };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border-2 transition-all duration-300 ${
        isSelected
          ? 'border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/20'
          : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
      }`}
    >
      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute top-3 right-3">
          <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
      )}

      <div className="p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-4">
          <span className="text-4xl">{getFlagEmoji()}</span>
          <div>
            <h3 className="text-xl font-semibold text-white">{model.name}</h3>
            <p className="text-sm text-slate-400">kani-tts-400m</p>
          </div>
        </div>

        {/* Status badges */}
        <div className="flex gap-2 mb-4">
          {model.downloaded ? (
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Downloaded
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30">
              Not Downloaded
            </span>
          )}
          {model.loaded && (
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
              Loaded
            </span>
          )}
        </div>

        {/* Download Progress */}
        {downloading && progress && (
          <div className="mb-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Downloading...</span>
              <span className="text-indigo-400 font-medium">{progress.progress_percent}%</span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300 relative"
                style={{ width: `${progress.progress_percent}%` }}
              >
                <div className="absolute inset-0 shimmer" />
              </div>
            </div>
            <div className="flex justify-between text-xs text-slate-500">
              <span>{formatBytes(progress.downloaded_size)}</span>
              <span>{formatBytes(progress.total_size)}</span>
            </div>
            {progress.current_file && (
              <p className="text-xs text-slate-500 truncate">
                {progress.current_file}
              </p>
            )}
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {!model.downloaded ? (
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex-1 px-4 py-2.5 rounded-xl font-medium transition-all duration-200
                bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600
                text-white shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed
                flex items-center justify-center gap-2"
            >
              {downloading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Downloading...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download Model
                </>
              )}
            </button>
          ) : !model.loaded ? (
            <button
              onClick={handleLoad}
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-xl font-medium transition-all duration-200
                bg-slate-700 hover:bg-slate-600 text-white
                disabled:opacity-50 disabled:cursor-not-allowed
                flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Loading...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Load Model
                </>
              )}
            </button>
          ) : (
            <button
              onClick={onSelect}
              className={`flex-1 px-4 py-2.5 rounded-xl font-medium transition-all duration-200
                ${isSelected
                  ? 'bg-indigo-500 text-white'
                  : 'bg-slate-700 hover:bg-slate-600 text-white'
                }
                flex items-center justify-center gap-2`}
            >
              {isSelected ? (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Selected
                </>
              ) : (
                'Select'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

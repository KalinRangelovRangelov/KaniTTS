import { useState } from 'react';
import type { SpeechHistoryItem } from '../types';
import { deleteAudio, getAudioUrl } from '../api';

interface SpeechHistoryProps {
  items: SpeechHistoryItem[];
  onDelete: (id: string) => void;
  onPlay: (item: SpeechHistoryItem) => void;
}

export function SpeechHistory({ items, onDelete, onPlay }: SpeechHistoryProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (item: SpeechHistoryItem) => {
    setDeletingId(item.id);
    try {
      await deleteAudio(item.filename);
      onDelete(item.id);
    } catch (error) {
      console.error('Failed to delete audio:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownload = (item: SpeechHistoryItem) => {
    const link = document.createElement('a');
    link.href = getAudioUrl(item.filename);
    link.download = item.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const truncateText = (text: string, maxLength: number = 60) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (items.length === 0) {
    return (
      <div className="rounded-2xl bg-slate-800/50 border border-slate-700/50 p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-700/50 flex items-center justify-center">
          <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <p className="text-slate-400">No generated speech yet</p>
        <p className="text-slate-500 text-sm mt-1">Generate speech to see it here</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div
          key={item.id}
          className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-4 hover:border-slate-600/50 transition-colors"
        >
          <div className="flex items-start gap-4">
            {/* Play button */}
            <button
              onClick={() => onPlay(item)}
              className="shrink-0 w-10 h-10 rounded-full bg-indigo-500/20 hover:bg-indigo-500/30 flex items-center justify-center transition-colors group"
            >
              <svg className="w-5 h-5 text-indigo-400 group-hover:text-indigo-300" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-slate-200 text-sm leading-relaxed">
                {truncateText(item.text)}
              </p>
              <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  {item.speaker}
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {item.createdAt.toLocaleTimeString()}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Download button */}
              <button
                onClick={() => handleDownload(item)}
                className="p-2 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-slate-200 transition-colors"
                title="Download"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </button>

              {/* Delete button */}
              <button
                onClick={() => handleDelete(item)}
                disabled={deletingId === item.id}
                className="p-2 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors disabled:opacity-50"
                title="Delete"
              >
                {deletingId === item.id ? (
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

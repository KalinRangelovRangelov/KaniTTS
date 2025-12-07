import { useState, useEffect, useCallback } from 'react';
import type { Model, TTSResponse, Speaker, SpeechHistoryItem } from './types';
import { fetchModels, fetchSpeakers, generateSpeech, getAudioUrl } from './api';
import { ModelCard } from './components/ModelCard';
import { TextInput } from './components/TextInput';
import { AudioPlayer } from './components/AudioPlayer';
import { SpeechHistory } from './components/SpeechHistory';

function App() {
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [selectedSpeaker, setSelectedSpeaker] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioFilename, setAudioFilename] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modelsLoading, setModelsLoading] = useState(true);
  const [speechHistory, setSpeechHistory] = useState<SpeechHistoryItem[]>(() => {
    const saved = localStorage.getItem('speechHistory');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((item: any) => ({
          ...item,
          createdAt: new Date(item.createdAt),
        }));
      } catch {
        return [];
      }
    }
    return [];
  });

  const loadModels = useCallback(async () => {
    try {
      const data = await fetchModels();
      setModels(data);

      // Auto-select first loaded model
      const loadedModel = data.find((m) => m.loaded);
      if (loadedModel && !selectedModel) {
        setSelectedModel(loadedModel.key);
      }
    } catch (err) {
      console.error('Failed to fetch models:', err);
    } finally {
      setModelsLoading(false);
    }
  }, [selectedModel]);

  useEffect(() => {
    loadModels();
  }, [loadModels]);

  // Save speech history to localStorage
  useEffect(() => {
    localStorage.setItem('speechHistory', JSON.stringify(speechHistory));
  }, [speechHistory]);

  // Load speakers when model changes
  useEffect(() => {
    if (selectedModel) {
      fetchSpeakers(selectedModel)
        .then((data) => {
          setSpeakers(data);
          // Auto-select first speaker
          if (data.length > 0) {
            setSelectedSpeaker(data[0].id);
          }
        })
        .catch((err) => console.error('Failed to fetch speakers:', err));
    } else {
      setSpeakers([]);
      setSelectedSpeaker(null);
    }
  }, [selectedModel]);

  const handleGenerate = async () => {
    if (!text.trim() || !selectedModel) return;

    setLoading(true);
    setError(null);

    try {
      const response: TTSResponse = await generateSpeech(
        text,
        selectedModel,
        selectedSpeaker || undefined
      );
      const newAudioUrl = getAudioUrl(response.filename);
      setAudioUrl(newAudioUrl);
      setAudioFilename(response.filename);

      // Add to speech history
      const speakerName = speakers.find((s) => s.id === selectedSpeaker)?.name || selectedSpeaker || 'Default';
      const historyItem: SpeechHistoryItem = {
        id: crypto.randomUUID(),
        text: text,
        filename: response.filename,
        audioUrl: newAudioUrl,
        model: selectedModel,
        speaker: speakerName,
        createdAt: new Date(),
      };
      setSpeechHistory((prev) => [historyItem, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate speech');
    } finally {
      setLoading(false);
    }
  };

  const handleHistoryDelete = (id: string) => {
    setSpeechHistory((prev) => prev.filter((item) => item.id !== id));
  };

  const handleHistoryPlay = (item: SpeechHistoryItem) => {
    setAudioUrl(item.audioUrl);
    setAudioFilename(item.filename);
  };

  const canGenerate = text.trim().length > 0 && selectedModel && !loading;
  const selectedModelData = models.find((m) => m.key === selectedModel);

  return (
    <div className="min-h-screen text-white">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-12">
        {/* Header */}
        <header className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              Kani TTS
            </h1>
          </div>
          <p className="text-slate-400 text-lg">
            High-quality text-to-speech powered by AI
          </p>
          <p className="text-slate-500 text-sm mt-1">
            Optimized for Apple Silicon
          </p>
        </header>

        {/* Main content */}
        <div className="space-y-8">
          {/* Model Selection */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
              Select Language Model
            </h2>

            {modelsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2].map((i) => (
                  <div key={i} className="rounded-2xl bg-slate-800/50 border-2 border-slate-700 p-6 animate-pulse">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-full bg-slate-700" />
                      <div className="space-y-2">
                        <div className="w-24 h-5 bg-slate-700 rounded" />
                        <div className="w-20 h-3 bg-slate-700 rounded" />
                      </div>
                    </div>
                    <div className="w-32 h-8 bg-slate-700 rounded-xl" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {models.map((model) => (
                  <ModelCard
                    key={model.key}
                    model={model}
                    isSelected={selectedModel === model.key}
                    onSelect={() => setSelectedModel(model.key)}
                    onModelUpdate={loadModels}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Speaker Selection */}
          {speakers.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Select Speaker
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {speakers.map((speaker) => (
                  <button
                    key={speaker.id}
                    onClick={() => setSelectedSpeaker(speaker.id)}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                      selectedSpeaker === speaker.id
                        ? 'border-indigo-500 bg-indigo-500/10'
                        : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        speaker.gender === 'female'
                          ? 'bg-pink-500/20 text-pink-400'
                          : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-slate-200">{speaker.name}</span>
                      <span className="text-xs text-slate-500 capitalize">{speaker.gender}</span>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Text Input */}
          <section>
            <TextInput
              value={text}
              onChange={setText}
              disabled={loading}
              placeholder={
                selectedModelData?.key === 'de'
                  ? 'Geben Sie hier den Text ein, den Sie in Sprache umwandeln möchten...'
                  : 'Type or paste the text you want to convert to speech...'
              }
            />
          </section>

          {/* Generate Button */}
          <section>
            <button
              onClick={handleGenerate}
              disabled={!canGenerate}
              className="w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300
                bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500
                hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600
                text-white shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50
                disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-indigo-500/30
                flex items-center justify-center gap-3 group"
            >
              {loading ? (
                <>
                  <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Generating Speech...
                </>
              ) : (
                <>
                  <svg className="w-6 h-6 transition-transform group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Generate Speech
                </>
              )}
            </button>

            {/* Error message */}
            {error && (
              <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-red-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-red-400">{error}</p>
                </div>
              </div>
            )}
          </section>

          {/* Audio Player */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
              Generated Audio
            </h2>
            <AudioPlayer audioUrl={audioUrl} filename={audioFilename} />
          </section>

          {/* Speech History */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Speech History
            </h2>
            <SpeechHistory
              items={speechHistory}
              onDelete={handleHistoryDelete}
              onPlay={handleHistoryPlay}
            />
          </section>
        </div>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-slate-800 text-center text-slate-500 text-sm">
          <p>Powered by Kani TTS</p>
          <p className="mt-1">Running on Apple Silicon with MLX optimization</p>
        </footer>
      </div>
    </div>
  );
}

export default App;

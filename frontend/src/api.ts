import type { Model, TTSResponse, Speaker } from './types';

const API_BASE = '/api';

export async function fetchModels(): Promise<Model[]> {
  const response = await fetch(`${API_BASE}/models`);
  if (!response.ok) throw new Error('Failed to fetch models');
  const data = await response.json();
  return data.models;
}

export async function fetchSpeakers(modelKey: string): Promise<Speaker[]> {
  const response = await fetch(`${API_BASE}/speakers/${modelKey}`);
  if (!response.ok) throw new Error('Failed to fetch speakers');
  const data = await response.json();
  return data.speakers;
}

export async function loadModel(modelKey: string): Promise<void> {
  const response = await fetch(`${API_BASE}/models/${modelKey}/load`, {
    method: 'POST',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to load model');
  }
}

export async function generateSpeech(
  text: string,
  model: string,
  speaker?: string,
  temperature: number = 0.7,
  topP: number = 0.9
): Promise<TTSResponse> {
  const response = await fetch(`${API_BASE}/tts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, model, speaker, temperature, top_p: topP }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to generate speech');
  }

  return response.json();
}

export async function deleteAudio(filename: string): Promise<void> {
  const response = await fetch(`${API_BASE}/audio/${filename}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Failed to delete audio');
  }
}

export function getAudioUrl(filename: string): string {
  return `${API_BASE}/audio/${filename}`;
}

export function downloadModel(
  modelKey: string,
  onProgress: (data: any) => void,
  onError: (error: Error) => void,
  onComplete: () => void
): () => void {
  const eventSource = new EventSource(`${API_BASE}/models/${modelKey}/download`);
  let completed = false;
  let lastProgress: any = null;

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log('[Download] Progress:', data.progress_percent, '%', data.status);
      lastProgress = data;
      onProgress(data);

      if (data.status === 'completed') {
        completed = true;
        eventSource.close();
        onComplete();
      } else if (data.status === 'error') {
        completed = true;
        eventSource.close();
        onError(new Error(data.error_message || 'Download failed'));
      }
    } catch (e) {
      console.error('Failed to parse SSE data:', e);
    }
  };

  eventSource.onerror = () => {
    console.log('[Download] Connection closed. completed:', completed, 'lastProgress:', lastProgress?.progress_percent);
    eventSource.close();
    // Only report error if we haven't already completed
    if (!completed) {
      // If download was near completion (>=95%), treat connection close as success
      // This handles the race condition where the server closes before we receive "completed"
      if (lastProgress && lastProgress.progress_percent >= 95) {
        console.log('[Download] Treating as success (>=95%)');
        onComplete();
      } else {
        console.log('[Download] Reporting connection lost error');
        onError(new Error('Connection lost'));
      }
    }
  };

  return () => eventSource.close();
}

export interface Model {
  key: string;
  name: string;
  repo_id: string;
  downloaded: boolean;
  loaded: boolean;
  local_path: string | null;
}

export interface DownloadProgress {
  model_key: string;
  model_name: string;
  total_size: number;
  downloaded_size: number;
  progress_percent: number;
  current_file: string;
  status: 'pending' | 'downloading' | 'completed' | 'error';
  error_message: string | null;
  files_total: number;
  files_downloaded: number;
}

export interface TTSResponse {
  success: boolean;
  filename: string;
  audio_url: string;
  text: string;
  model: string;
}

export interface Speaker {
  id: string;
  name: string;
  gender: 'male' | 'female';
}

export interface SpeechHistoryItem {
  id: string;
  text: string;
  filename: string;
  audioUrl: string;
  model: string;
  speaker: string;
  createdAt: Date;
}

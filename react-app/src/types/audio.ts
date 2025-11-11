export interface AudioFile {
  filename: string;
  size: number; // bytes
  duration?: number; // seconds
  uploadedAt?: string; // ISO timestamp
}

export interface AudioFileUploadResponse {
  success: boolean;
  filename: string;
  message?: string;
}

export interface AudioFilesResponse {
  files: AudioFile[];
}

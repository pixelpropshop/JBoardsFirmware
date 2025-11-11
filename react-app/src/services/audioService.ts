import { api } from './api';
import { AudioFile, AudioFileUploadResponse, AudioFilesResponse } from '../types/audio';

// Mock data for development
const mockAudioFiles: AudioFile[] = [
  {
    filename: 'jingle_bells.mp3',
    size: 2457600, // ~2.4 MB
    duration: 153,
    uploadedAt: '2024-12-01T10:30:00Z'
  },
  {
    filename: 'silent_night.mp3',
    size: 1843200, // ~1.8 MB
    duration: 115,
    uploadedAt: '2024-12-01T10:35:00Z'
  },
  {
    filename: 'deck_the_halls.mp3',
    size: 2048000, // ~2 MB
    duration: 128,
    uploadedAt: '2024-12-01T10:40:00Z'
  }
];

export const audioService = {
  async getAudioFiles(): Promise<AudioFile[]> {
    try {
      const response = await api.fetch<AudioFilesResponse>('/api/files/audio');
      return response.files;
    } catch {
      return mockAudioFiles;
    }
  },

  async uploadAudioFile(file: File): Promise<AudioFileUploadResponse> {
    try {
      // For file uploads, we need to use fetch directly with FormData
      const formData = new FormData();
      formData.append('file', file);

      const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
      const response = await fetch(`${BASE_URL}/api/files/audio`, {
        method: 'POST',
        body: formData, // Don't set Content-Type header - browser will set it with boundary
      });

      if (response.ok) {
        return await response.json();
      }
      throw new Error(`Upload failed: ${response.status}`);
    } catch {
      console.log('Mock: Audio file would be uploaded:', file.name);
      
      // Add to mock data
      mockAudioFiles.push({
        filename: file.name,
        size: file.size,
        uploadedAt: new Date().toISOString()
      });

      return {
        success: true,
        filename: file.name,
        message: 'File uploaded successfully (mock mode)'
      };
    }
  },

  async deleteAudioFile(filename: string): Promise<{ success: boolean; message?: string }> {
    try {
      return await api.fetch<{ success: boolean; message?: string }>(
        `/api/files/audio/${encodeURIComponent(filename)}`,
        { method: 'DELETE' }
      );
    } catch {
      console.log('Mock: Audio file would be deleted:', filename);
      
      // Remove from mock data
      const index = mockAudioFiles.findIndex(f => f.filename === filename);
      if (index > -1) {
        mockAudioFiles.splice(index, 1);
      }

      return {
        success: true,
        message: 'File deleted successfully (mock mode)'
      };
    }
  }
};

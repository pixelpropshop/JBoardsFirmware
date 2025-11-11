import { api } from './api';
import type { FileInfo, StorageInfo, FileUploadResponse, FileDeleteResponse, FilePreview } from '../types/files';
import { FileType } from '../types/files';

// Helper function to determine file type from filename/extension
const getFileType = (filename: string): FileType => {
  const ext = filename.toLowerCase().split('.').pop();
  
  if (['mp3', 'wav', 'ogg', 'm4a', 'flac'].includes(ext || '')) {
    return FileType.AUDIO;
  }
  if (ext === 'fseq') {
    return FileType.FSEQ;
  }
  if (['json', 'cfg', 'conf', 'ini'].includes(ext || '')) {
    return FileType.CONFIG;
  }
  if (['log', 'txt'].includes(ext || '')) {
    return ext === 'log' ? FileType.LOG : FileType.TEXT;
  }
  if (['zip', 'tar', 'gz', 'bak'].includes(ext || '')) {
    return FileType.BACKUP;
  }
  
  return FileType.OTHER;
};

// Mock data for development
const mockFiles: FileInfo[] = [
  // Audio files
  {
    filename: 'christmas_carol.mp3',
    path: '/sd/audio/christmas_carol.mp3',
    size: 3584000,
    type: FileType.AUDIO,
    mimeType: 'audio/mpeg',
    lastModified: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    filename: 'ambient_sound.wav',
    path: '/sd/audio/ambient_sound.wav',
    size: 8192000,
    type: FileType.AUDIO,
    mimeType: 'audio/wav',
    lastModified: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  // FSEQ files
  {
    filename: 'holiday_lights.fseq',
    path: '/sd/sequences/holiday_lights.fseq',
    size: 2048000,
    type: FileType.FSEQ,
    mimeType: 'application/octet-stream',
    lastModified: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    filename: 'winter_show.fseq',
    path: '/sd/sequences/winter_show.fseq',
    size: 4096000,
    type: FileType.FSEQ,
    mimeType: 'application/octet-stream',
    lastModified: new Date(Date.now() - 86400000 * 7).toISOString(),
  },
  // Config files
  {
    filename: 'board_config.json',
    path: '/sd/config/board_config.json',
    size: 2048,
    type: FileType.CONFIG,
    mimeType: 'application/json',
    lastModified: new Date(Date.now() - 86400000 * 10).toISOString(),
  },
  {
    filename: 'network_settings.json',
    path: '/sd/config/network_settings.json',
    size: 1024,
    type: FileType.CONFIG,
    mimeType: 'application/json',
    lastModified: new Date(Date.now() - 86400000 * 15).toISOString(),
  },
  // Logs
  {
    filename: 'system.log',
    path: '/sd/logs/system.log',
    size: 16384,
    type: FileType.LOG,
    mimeType: 'text/plain',
    lastModified: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    filename: 'error.log',
    path: '/sd/logs/error.log',
    size: 4096,
    type: FileType.LOG,
    mimeType: 'text/plain',
    lastModified: new Date(Date.now() - 3600000).toISOString(),
  },
  // Backups
  {
    filename: 'backup_20250110.zip',
    path: '/sd/backups/backup_20250110.zip',
    size: 524288,
    type: FileType.BACKUP,
    mimeType: 'application/zip',
    lastModified: new Date(Date.now() - 86400000 * 30).toISOString(),
  },
  // Other files
  {
    filename: 'readme.txt',
    path: '/sd/readme.txt',
    size: 512,
    type: FileType.TEXT,
    mimeType: 'text/plain',
    lastModified: new Date(Date.now() - 86400000 * 60).toISOString(),
  },
];

const mockStorageInfo: StorageInfo = {
  totalBytes: 8 * 1024 * 1024 * 1024, // 8 GB
  usedBytes: 1.2 * 1024 * 1024 * 1024, // 1.2 GB
  freeBytes: 6.8 * 1024 * 1024 * 1024, // 6.8 GB
  breakdown: {
    audio: 11776000,
    fseq: 6144000,
    config: 3072,
    log: 20480,
    backup: 524288,
    other: 512,
  },
};

export const filesService = {
  /**
   * Get list of all files on SD card
   */
  async getFiles(typeFilter?: FileType): Promise<FileInfo[]> {
    try {
      const response = await api.fetch<FileInfo[]>('/api/files/list', {
        method: 'GET',
      });
      
      let files = response;
      
      // Apply type filter if provided
      if (typeFilter) {
        files = files.filter(f => f.type === typeFilter);
      }
      
      return files;
    } catch (error) {
      console.warn('Failed to fetch files from API, using mock data:', error);
      
      let files = mockFiles;
      
      // Apply type filter if provided
      if (typeFilter) {
        files = files.filter(f => f.type === typeFilter);
      }
      
      return files;
    }
  },

  /**
   * Get storage information
   */
  async getStorageInfo(): Promise<StorageInfo> {
    try {
      const response = await api.fetch<StorageInfo>('/api/files/storage', {
        method: 'GET',
      });
      
      return response;
    } catch (error) {
      console.warn('Failed to fetch storage info from API, using mock data:', error);
      return mockStorageInfo;
    }
  },

  /**
   * Upload a file to SD card
   */
  async uploadFile(file: File, path?: string): Promise<FileUploadResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (path) {
        formData.append('path', path);
      }

      const response = await api.fetch<FileUploadResponse>('/api/files/upload', {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header - browser will set it with boundary for FormData
        headers: {},
      });

      return response;
    } catch (error) {
      console.warn('Failed to upload file via API, simulating success:', error);
      
      // Mock success response
      return {
        success: true,
        message: 'File uploaded successfully (mock)',
        file: {
          filename: file.name,
          path: path || `/sd/files/${file.name}`,
          size: file.size,
          type: getFileType(file.name),
          mimeType: file.type,
          lastModified: new Date().toISOString(),
        },
      };
    }
  },

  /**
   * Delete a file from SD card
   */
  async deleteFile(path: string): Promise<FileDeleteResponse> {
    try {
      const response = await api.fetch<FileDeleteResponse>('/api/files/delete', {
        method: 'DELETE',
        body: JSON.stringify({ path }),
      });

      return response;
    } catch (error) {
      console.warn('Failed to delete file via API, simulating success:', error);
      
      return {
        success: true,
        message: 'File deleted successfully (mock)',
      };
    }
  },

  /**
   * Download a file from SD card
   */
  getDownloadUrl(path: string): string {
    // Remove leading slash if present
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    return `/api/files/download/${encodeURIComponent(cleanPath)}`;
  },

  /**
   * Preview text/JSON file contents
   */
  async previewFile(path: string): Promise<FilePreview> {
    try {
      const response = await api.fetch<FilePreview>('/api/files/preview', {
        method: 'POST',
        body: JSON.stringify({ path }),
      });

      return response;
    } catch (error) {
      console.warn('Failed to preview file via API, using mock data:', error);
      
      // Mock preview content based on file type
      let content = '';
      if (path.includes('.json')) {
        content = '{\n  "version": "1.0",\n  "ledCount": 300,\n  "brightness": 80\n}';
      } else if (path.includes('.log')) {
        content = '[2025-01-10 10:23:45] System started\n[2025-01-10 10:23:46] WiFi connected\n[2025-01-10 10:23:50] LED strip initialized';
      } else {
        content = 'This is a mock preview of the file contents.\nThe actual file preview would be loaded from the ESP32.';
      }
      
      return {
        success: true,
        content,
      };
    }
  },
};

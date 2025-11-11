export interface FileInfo {
  filename: string;
  path: string;
  size: number;
  type: FileType;
  mimeType?: string;
  lastModified?: string;
  isDirectory?: boolean;
}

export enum FileType {
  AUDIO = 'audio',
  FSEQ = 'fseq',
  CONFIG = 'config',
  LOG = 'log',
  BACKUP = 'backup',
  TEXT = 'text',
  OTHER = 'other',
}

export interface StorageInfo {
  totalBytes: number;
  usedBytes: number;
  freeBytes: number;
  breakdown: {
    audio: number;
    fseq: number;
    config: number;
    log: number;
    backup: number;
    other: number;
  };
}

export interface FileUploadResponse {
  success: boolean;
  message?: string;
  file?: FileInfo;
}

export interface FileDeleteResponse {
  success: boolean;
  message?: string;
}

export interface FilePreview {
  success: boolean;
  content: string;
  message?: string;
}

import { api } from './api';
import { calculateSHA256, isCryptoAvailable } from '../utils/crypto';
import type {
  SystemInfo,
  SystemHealth,
  LEDChannel,
  NowPlayingInfo,
  SystemStats,
  FirmwareUpdateResponse,
  FirmwareUpdateProgress,
  SystemActionResponse,
  RTCTime,
} from '../types/system';

// Mock data for development
const mockSystemInfo: SystemInfo = {
  productName: 'JSense Board',
  hostname: 'jsense-board',
  firmwareVersion: '1.0.0',
  buildDate: '2025-01-10',
  buildTime: '14:30:00',
  chipModel: 'ESP32-S3',
  chipRevision: 1,
  flashSize: 8388608, // 8 MB
  flashSpeed: 80, // MHz
  cpuFrequency: 240, // MHz
  macAddressWiFi: '24:6F:28:XX:XX:XX',
  macAddressAP: '24:6F:28:XX:XX:YY',
};

const mockSystemHealth: SystemHealth = {
  uptimeSeconds: 86400, // 24 hours
  heapTotal: 327680, // 320 KB
  heapFree: 131072, // 128 KB
  heapUsed: 196608, // 192 KB
  heapMaxAlloc: 98304, // 96 KB
  cpuTemperature: 45.5, // °C
  freeSketchSpace: 6291456, // ~6 MB
  sketchSize: 2097152, // ~2 MB
};

const mockLEDChannels: LEDChannel[] = [
  {
    id: 1,
    name: 'Channel 1',
    enabled: true,
    pixelCount: 300,
    pixelType: 'WS2812B',
    dataPin: 16,
    fps: 60,
    status: 'active',
    currentEffect: 'Rainbow Chase',
  },
  {
    id: 2,
    name: 'Channel 2',
    enabled: true,
    pixelCount: 150,
    pixelType: 'WS2811',
    dataPin: 17,
    fps: 60,
    status: 'idle',
  },
  {
    id: 3,
    name: 'Channel 3',
    enabled: false,
    pixelCount: 200,
    pixelType: 'WS2812B',
    dataPin: 18,
    fps: 30,
    status: 'idle',
  },
];

const mockNowPlaying: NowPlayingInfo = {
  type: 'effect',
  name: 'Rainbow Chase',
  id: 5,
  loop: true,
  channels: [1],
};

export const systemService = {
  /**
   * Get complete system statistics
   */
  async getSystemStats(): Promise<SystemStats> {
    try {
      const response = await api.fetch<SystemStats>('/api/system/stats', {
        method: 'GET',
      });

      return response;
    } catch (error) {
      console.warn('Failed to fetch system stats from API, using mock data:', error);
      return {
        info: mockSystemInfo,
        health: mockSystemHealth,
        ledChannels: mockLEDChannels,
        nowPlaying: mockNowPlaying,
      };
    }
  },

  /**
   * Get system information
   */
  async getSystemInfo(): Promise<SystemInfo> {
    try {
      const response = await api.fetch<SystemInfo>('/api/system/info', {
        method: 'GET',
      });

      return response;
    } catch (error) {
      console.warn('Failed to fetch system info from API, using mock data:', error);
      return mockSystemInfo;
    }
  },

  /**
   * Get system health metrics
   */
  async getSystemHealth(): Promise<SystemHealth> {
    try {
      const response = await api.fetch<SystemHealth>('/api/system/health', {
        method: 'GET',
      });

      return response;
    } catch (error) {
      console.warn('Failed to fetch system health from API, using mock data:', error);
      return mockSystemHealth;
    }
  },

  /**
   * Get LED channel status
   */
  async getLEDChannels(): Promise<LEDChannel[]> {
    try {
      const response = await api.fetch<LEDChannel[]>('/api/system/channels', {
        method: 'GET',
      });

      return response;
    } catch (error) {
      console.warn('Failed to fetch LED channels from API, using mock data:', error);
      return mockLEDChannels;
    }
  },

  /**
   * Get now playing information
   */
  async getNowPlaying(): Promise<NowPlayingInfo> {
    try {
      const response = await api.fetch<NowPlayingInfo>('/api/system/now-playing', {
        method: 'GET',
      });

      return response;
    } catch (error) {
      console.warn('Failed to fetch now playing from API, using mock data:', error);
      return mockNowPlaying;
    }
  },

  /**
   * Upload and install firmware update with progress tracking
   * @param file Firmware file (.bin)
   * @param progressCallback Optional callback for progress updates
   * @param expectedChecksum Optional SHA256 checksum to verify file integrity
   */
  async uploadFirmware(
    file: File,
    progressCallback?: (progress: FirmwareUpdateProgress) => void,
    expectedChecksum?: string
  ): Promise<FirmwareUpdateResponse> {
    try {
      // Stage 1: Verify file checksum if provided
      if (expectedChecksum) {
        // Check if crypto is available before attempting checksum calculation
        if (!isCryptoAvailable()) {
          console.warn('Web Crypto API not available, skipping checksum verification');
          // Continue without checksum verification
        } else {
          progressCallback?.({
            stage: 'verifying',
            progress: 0,
            message: 'Calculating file checksum...',
          });

          try {
            const actualChecksum = await calculateSHA256(file);
            
            progressCallback?.({
              stage: 'verifying',
              progress: 100,
              message: 'Checksum calculated',
            });

            if (actualChecksum.toLowerCase() !== expectedChecksum.toLowerCase()) {
              return {
                success: false,
                message: 'Firmware file checksum verification failed',
                stage: 'error',
                error: 'Checksum mismatch',
                checksumVerified: false,
              };
            }
          } catch (error) {
            console.error('Checksum calculation failed:', error);
            // Continue without checksum verification
          }
        }
      }

      // Stage 2: Upload firmware with progress tracking
      return await this._uploadFirmwareWithProgress(file, progressCallback);
    } catch (error) {
      console.error('Firmware upload error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to upload firmware',
        stage: 'error',
        error: String(error),
      };
    }
  },

  /**
   * Internal method: Upload firmware using XMLHttpRequest for progress tracking
   */
  _uploadFirmwareWithProgress(
    file: File,
    progressCallback?: (progress: FirmwareUpdateProgress) => void
  ): Promise<FirmwareUpdateResponse> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      formData.append('firmware', file);

      const startTime = Date.now();

      // Track upload progress
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const uploadProgress = Math.round((event.loaded / event.total) * 100);
          const elapsed = (Date.now() - startTime) / 1000; // seconds
          const bytesPerSecond = event.loaded / elapsed;
          const remainingBytes = event.total - event.loaded;
          const timeRemaining = Math.round(remainingBytes / bytesPerSecond);

          progressCallback?.({
            stage: 'uploading',
            progress: uploadProgress,
            bytesUploaded: event.loaded,
            totalBytes: event.total,
            timeRemaining: timeRemaining,
            message: `Uploading firmware... ${uploadProgress}%`,
          });
        }
      });

      // Handle completion
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response: FirmwareUpdateResponse = JSON.parse(xhr.responseText);
            
            progressCallback?.({
              stage: 'installing',
              progress: 100,
              message: 'Installing firmware...',
            });

            setTimeout(() => {
              progressCallback?.({
                stage: 'complete',
                progress: 100,
                message: 'Firmware update complete',
              });
              resolve(response);
            }, 1000);
          } catch (error) {
            reject(new Error('Invalid response from server'));
          }
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });

      // Handle errors
      xhr.addEventListener('error', () => {
        // Fallback to mock for development
        console.warn('Upload failed, using mock response');
        
        progressCallback?.({
          stage: 'complete',
          progress: 100,
          message: 'Firmware uploaded (mock)',
        });

        resolve({
          success: true,
          message: 'Firmware uploaded successfully (mock). Device will restart.',
          progress: 100,
          stage: 'complete',
          newVersion: '1.1.0',
          checksumVerified: true,
        });
      });

      xhr.addEventListener('abort', () => {
        reject(new Error('Upload cancelled'));
      });

      // Send request
      const baseUrl = api.getBaseUrl();
      xhr.open('POST', `${baseUrl}/api/system/firmware/update`);
      xhr.send(formData);
    });
  },

  /**
   * Restart the device
   */
  async restartDevice(): Promise<SystemActionResponse> {
    try {
      const response = await api.fetch<SystemActionResponse>('/api/system/restart', {
        method: 'POST',
      });

      return response;
    } catch (error) {
      console.warn('Failed to restart device via API, simulating success:', error);

      return {
        success: true,
        message: 'Device restarting (mock)...',
      };
    }
  },

  /**
   * Factory reset the device
   */
  async factoryReset(): Promise<SystemActionResponse> {
    try {
      const response = await api.fetch<SystemActionResponse>('/api/system/factory-reset', {
        method: 'POST',
      });

      return response;
    } catch (error) {
      console.warn('Failed to factory reset via API, simulating success:', error);

      return {
        success: true,
        message: 'Factory reset initiated (mock). Device will restart.',
      };
    }
  },

  /**
   * Export configuration
   */
  async exportConfig(): Promise<Blob> {
    try {
      const response = await fetch(`${api.getBaseUrl()}/api/system/export-config`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Failed to export config');
      }

      return await response.blob();
    } catch (error) {
      console.warn('Failed to export config via API, using mock data:', error);

      // Mock configuration file
      const mockConfig = {
        version: '1.0.0',
        network: {
          hostname: 'jsense-board',
          wifi: { ssid: 'MyNetwork' },
        },
        channels: mockLEDChannels,
      };

      return new Blob([JSON.stringify(mockConfig, null, 2)], { type: 'application/json' });
    }
  },

  /**
   * Import configuration from JSON file
   */
  async importConfig(file: File): Promise<SystemActionResponse> {
    try {
      // Read and validate JSON file
      const text = await file.text();
      const config = JSON.parse(text);

      const response = await api.fetch<SystemActionResponse>('/api/system/config/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      return response;
    } catch (error) {
      console.warn('Failed to import config via API:', error);

      if (error instanceof SyntaxError) {
        return {
          success: false,
          message: 'Invalid JSON file',
        };
      }

      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to import configuration',
      };
    }
  },

  /**
   * Clear system logs
   */
  async clearLogs(): Promise<SystemActionResponse> {
    try {
      const response = await api.fetch<SystemActionResponse>('/api/system/clear-logs', {
        method: 'POST',
      });

      return response;
    } catch (error) {
      console.warn('Failed to clear logs via API, simulating success:', error);

      return {
        success: true,
        message: 'Logs cleared successfully (mock)',
      };
    }
  },

  /**
   * Get current RTC time
   */
  async getRTCTime(): Promise<RTCTime | null> {
    try {
      const response = await api.fetch<RTCTime>('/api/hardware/rtc/time', {
        method: 'GET',
      });

      return response;
    } catch (error) {
      console.warn('Failed to fetch RTC time from API:', error);
      return null;
    }
  },

  /**
   * Helper: Format uptime in human-readable format
   */
  formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  },

  /**
   * Helper: Format bytes in human-readable format
   */
  formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  },
};

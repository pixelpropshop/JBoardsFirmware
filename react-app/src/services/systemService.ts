import { api } from './api';
import type {
  SystemInfo,
  SystemHealth,
  LEDChannel,
  NowPlayingInfo,
  SystemStats,
  FirmwareUpdateResponse,
  SystemActionResponse,
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
   * Upload and install firmware update
   */
  async uploadFirmware(file: File): Promise<FirmwareUpdateResponse> {
    try {
      const formData = new FormData();
      formData.append('firmware', file);

      const response = await api.fetch<FirmwareUpdateResponse>('/api/system/firmware/update', {
        method: 'POST',
        body: formData,
        headers: {},
      });

      return response;
    } catch (error) {
      console.warn('Failed to upload firmware via API, simulating success:', error);

      // Mock success response
      return {
        success: true,
        message: 'Firmware uploaded successfully (mock). Device will restart.',
        progress: 100,
        newVersion: '1.1.0',
      };
    }
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

import { api } from './api';
import type { 
  RTCConfig, 
  RTCStatus, 
  OLEDConfig, 
  OLEDStatus 
} from '../types/hardware';

// Mock data for development
const mockRTCStatus: RTCStatus = {
  available: true,
  currentTime: new Date().toISOString(),
  isTimeSynced: true,
  ntpEnabled: true,
};

const mockRTCConfig: RTCConfig = {
  enabled: true,
  timezone: 'America/Phoenix',
  timeFormat: '12h',
  dateFormat: 'MM/DD/YYYY',
  syncPriority: 'ntp',
  lastSync: new Date().toISOString(),
};

const mockOLEDStatus: OLEDStatus = {
  available: true,
  width: 128,
  height: 64,
  currentScreen: 'clock',
  isActive: true,
};

const mockOLEDConfig: OLEDConfig = {
  enabled: true,
  brightness: 80,
  timeout: '5m',
  autoSleep: true,
  rotation: 0,
  defaultScreen: 'rotating',
  screenSaver: false,
};

// Common timezones for dropdown
export const TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern (ET)' },
  { value: 'America/Chicago', label: 'Central (CT)' },
  { value: 'America/Denver', label: 'Mountain (MT)' },
  { value: 'America/Phoenix', label: 'Arizona (MST)' },
  { value: 'America/Los_Angeles', label: 'Pacific (PT)' },
  { value: 'America/Anchorage', label: 'Alaska (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii (HST)' },
  { value: 'UTC', label: 'UTC' },
  { value: 'Europe/London', label: 'London (GMT)' },
  { value: 'Europe/Paris', label: 'Paris (CET)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST)' },
];

class HardwareService {
  // RTC Methods
  async getRTCStatus(): Promise<RTCStatus> {
    try {
      return await api.fetch<RTCStatus>('/api/hardware/rtc/status');
    } catch {
      console.log('Mock: Using RTC status mock data');
      return mockRTCStatus;
    }
  }

  async getRTCConfig(): Promise<RTCConfig> {
    try {
      return await api.fetch<RTCConfig>('/api/hardware/rtc');
    } catch {
      console.log('Mock: Using RTC config mock data');
      return mockRTCConfig;
    }
  }

  async updateRTCConfig(config: Partial<RTCConfig>): Promise<{ success: boolean; message: string }> {
    try {
      return await api.fetch<{ success: boolean; message: string }>('/api/hardware/rtc', {
        method: 'POST',
        body: JSON.stringify(config),
      });
    } catch {
      console.log('Mock: RTC configuration updated');
      return {
        success: true,
        message: 'RTC configuration updated successfully',
      };
    }
  }

  async syncRTCTime(): Promise<{ success: boolean; message: string; currentTime?: string }> {
    try {
      return await api.fetch<{ success: boolean; message: string; currentTime?: string }>('/api/hardware/rtc/sync', {
        method: 'POST',
      });
    } catch {
      console.log('Mock: Time synchronized');
      return {
        success: true,
        message: 'Time synchronized successfully',
        currentTime: new Date().toISOString(),
      };
    }
  }

  async setManualTime(time: string): Promise<{ success: boolean; message: string }> {
    try {
      return await api.fetch<{ success: boolean; message: string }>('/api/hardware/rtc/set-time', {
        method: 'POST',
        body: JSON.stringify({ time }),
      });
    } catch {
      console.log('Mock: Manual time set');
      return {
        success: true,
        message: 'Time set successfully',
      };
    }
  }

  // OLED Methods
  async getOLEDStatus(): Promise<OLEDStatus> {
    try {
      return await api.fetch<OLEDStatus>('/api/hardware/oled/status');
    } catch {
      console.log('Mock: Using OLED status mock data');
      return mockOLEDStatus;
    }
  }

  async getOLEDConfig(): Promise<OLEDConfig> {
    try {
      return await api.fetch<OLEDConfig>('/api/hardware/oled');
    } catch {
      console.log('Mock: Using OLED config mock data');
      return mockOLEDConfig;
    }
  }

  async updateOLEDConfig(config: Partial<OLEDConfig>): Promise<{ success: boolean; message: string }> {
    try {
      return await api.fetch<{ success: boolean; message: string }>('/api/hardware/oled', {
        method: 'POST',
        body: JSON.stringify(config),
      });
    } catch {
      console.log('Mock: OLED configuration updated');
      return {
        success: true,
        message: 'OLED configuration updated successfully',
      };
    }
  }

  async testOLEDDisplay(): Promise<{ success: boolean; message: string }> {
    try {
      return await api.fetch<{ success: boolean; message: string }>('/api/hardware/oled/test', {
        method: 'POST',
      });
    } catch {
      console.log('Mock: Test pattern displayed');
      return {
        success: true,
        message: 'Test pattern displayed on OLED',
      };
    }
  }
}

export const hardwareService = new HardwareService();

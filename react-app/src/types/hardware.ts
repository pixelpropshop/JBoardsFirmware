// Hardware Configuration Types

// RTC (Real-Time Clock)
export interface RTCConfig {
  enabled: boolean;
  timezone: string;
  timeFormat: '12h' | '24h';
  dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
  syncPriority: 'ntp' | 'rtc' | 'manual';
  lastSync: string | null; // ISO timestamp
}

export interface RTCStatus {
  available: boolean;
  currentTime: string; // ISO timestamp
  isTimeSynced: boolean;
  ntpEnabled: boolean;
}

// OLED Display
export type OLEDDisplayMode = 'clock' | 'ip-address' | 'status' | 'sequence' | 'rotating';
export type OLEDScreenTimeout = 'always-on' | '30s' | '1m' | '5m' | '10m';
export type OLEDRotation = 0 | 90 | 180 | 270;

export interface OLEDConfig {
  enabled: boolean;
  brightness: number; // 0-100
  timeout: OLEDScreenTimeout;
  autoSleep: boolean;
  rotation: OLEDRotation;
  defaultScreen: OLEDDisplayMode;
  screenSaver: boolean;
}

export interface OLEDStatus {
  available: boolean;
  width: number;
  height: number;
  currentScreen: OLEDDisplayMode;
  isActive: boolean;
}

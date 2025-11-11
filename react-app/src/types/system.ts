export interface SystemInfo {
  productName: string;
  hostname: string;
  firmwareVersion: string;
  buildDate: string;
  buildTime?: string;
  chipModel: string;
  chipRevision?: number;
  flashSize: number;
  flashSpeed?: number;
  cpuFrequency: number;
  macAddressWiFi: string;
  macAddressAP?: string;
}

export interface SystemHealth {
  uptimeSeconds: number;
  heapTotal: number;
  heapFree: number;
  heapUsed: number;
  heapMaxAlloc?: number;
  cpuTemperature?: number;
  freeSketchSpace?: number;
  sketchSize?: number;
}

export interface LEDChannel {
  id: number;
  name: string;
  enabled: boolean;
  pixelCount: number;
  pixelType: string;
  dataPin: number;
  fps: number;
  status: 'active' | 'idle' | 'error';
  currentEffect?: string;
}

export interface NowPlayingInfo {
  type: 'effect' | 'sequence' | 'idle';
  name?: string;
  id?: number;
  duration?: number;
  elapsed?: number;
  loop?: boolean;
  channels?: number[];
}

export interface FirmwareUpdateResponse {
  success: boolean;
  message: string;
  progress?: number;
  newVersion?: string;
}

export interface SystemActionResponse {
  success: boolean;
  message: string;
}

export interface SystemStats {
  info: SystemInfo;
  health: SystemHealth;
  ledChannels: LEDChannel[];
  nowPlaying: NowPlayingInfo;
}

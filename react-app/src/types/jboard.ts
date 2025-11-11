// JBoard Network types for peer-to-peer mesh communication

export enum DeviceType {
  JSENSE_BOARD = 0x01,
  LED_CONTROLLER = 0x02,
  SENSOR_HUB = 0x03,
  AUDIO_REACTIVE = 0x04,
  EFFECTS_CONTROLLER = 0x05,
}

export enum DeviceCapability {
  LED_CONTROL = 1 << 0,
  SENSOR_DATA = 1 << 1,
  AUDIO_PLAYBACK = 1 << 2,
  WEB_INTERFACE = 1 << 3,
  BATTERY_POWERED = 1 << 4,
}

export interface JBoardDevice {
  mac: string; // Internal use only for identification
  name: string;
  type: DeviceType;
  capabilities: number; // Bitmask of DeviceCapability
  rssi: number;
  lastSeen: string; // ISO timestamp
  firmwareVersion: string;
  ipAddress: string;
  isPaired: boolean;
}

export interface ThisDevice {
  mac: string; // Internal use only for identification
  name: string;
  type: DeviceType;
  capabilities: number;
  firmwareVersion: string;
  ipAddress: string;
  isListening: boolean;
}

export interface JBoardMessage {
  id: string;
  from: string; // MAC address
  to: string; // MAC address or 'broadcast'
  timestamp: string;
  type: string;
  payload: any;
  status: 'sent' | 'delivered' | 'failed';
}

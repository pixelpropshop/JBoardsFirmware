// Network configuration types

export interface WiFiConfig {
  ssid: string;
  password: string;
  ip: string;
  gateway: string;
  subnet: string;
  dns: string;
  dhcp: boolean;
}

export interface APConfig {
  ssid: string;
  password: string;
  ip: string;
  channel: number; // 0 = auto, 1-13 = specific channel
  hidden: boolean;
  maxClients: number; // 0 = use hardware default
  keepActive: boolean; // Keep AP active even when WiFi connects (smart mode)
}

export interface NetworkStatus {
  wifiConnected: boolean;
  wifiRSSI: number;
  wifiIP: string;
  apActive: boolean;
  apClients: number;
}

export interface HostnameConfig {
  hostname: string;
  mdnsEnabled: boolean;
}

export interface WiFiProfile {
  id: string;
  name: string;
  ssid: string;
  password: string;
  ip: string;
  gateway: string;
  subnet: string;
  dns: string;
  dhcp: boolean;
  priority: number; // Lower number = higher priority for auto-connect
}

export interface AutoReconnectConfig {
  enabled: boolean;
  maxAttempts: number; // 0 = unlimited
  attemptInterval: number; // seconds between attempts
  fallbackToAP: boolean; // Enable AP mode after max attempts
}

export interface ScanResult {
  ssid: string;
  rssi: number;
  encryption: string;
  channel: number;
}

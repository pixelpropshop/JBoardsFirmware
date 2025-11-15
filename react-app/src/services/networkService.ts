// Network API service with mock data fallback
import { api } from './api';
import type { WiFiConfig, APConfig, NetworkStatus, HostnameConfig, WiFiProfile, AutoReconnectConfig, ScanResult } from '../types/network';

// Mock data for development
const mockWiFiConfig: WiFiConfig = {
  ssid: 'MyNetwork',
  password: '',
  ip: '192.168.1.100',
  gateway: '192.168.1.1',
  subnet: '255.255.255.0',
  dns: '8.8.8.8',
  dhcp: true,
};

const mockAPConfig: APConfig = {
  ssid: 'JSense-AP',
  password: '',
  ip: '192.168.4.1',
  channel: 0, // 0 = auto
  hidden: false,
  maxClients: 0, // 0 = use hardware default
  keepActive: false, // Smart mode: auto-disable when WiFi connects
};

const mockNetworkStatus: NetworkStatus = {
  wifiConnected: true,
  wifiRSSI: -45,
  wifiIP: '192.168.1.100',
  apActive: true,
  apClients: 1,
};

const mockHostnameConfig: HostnameConfig = {
  hostname: 'jsenseboard',
  mdnsEnabled: true,
};

const mockWiFiProfiles: WiFiProfile[] = [
  {
    id: '1',
    name: 'Home Network',
    ssid: 'MyNetwork',
    password: '',
    ip: '192.168.1.100',
    gateway: '192.168.1.1',
    subnet: '255.255.255.0',
    dns: '8.8.8.8',
    dhcp: true,
    priority: 1,
  },
  {
    id: '2',
    name: 'Office WiFi',
    ssid: 'OfficeNet',
    password: '',
    ip: '10.0.0.100',
    gateway: '10.0.0.1',
    subnet: '255.255.255.0',
    dns: '8.8.8.8',
    dhcp: true,
    priority: 2,
  },
];

const mockAutoReconnectConfig: AutoReconnectConfig = {
  enabled: true,
  maxAttempts: 5,
  attemptInterval: 30,
  fallbackToAP: true,
};

const mockScanResults: ScanResult[] = [
  { ssid: 'MyNetwork', rssi: -45, encryption: 'WPA2', channel: 6 },
  { ssid: 'Neighbor_WiFi', rssi: -67, encryption: 'WPA2', channel: 11 },
  { ssid: 'Public_Hotspot', rssi: -72, encryption: 'Open', channel: 1 },
];

export const networkService = {
  // Get WiFi Station configuration
  async getWiFiConfig(): Promise<WiFiConfig> {
    try {
      return await api.fetch<WiFiConfig>('/api/network/wifi');
    } catch {
      return mockWiFiConfig;
    }
  },

  // Update WiFi Station configuration
  async updateWiFiConfig(config: WiFiConfig): Promise<{ success: boolean; message?: string }> {
    try {
      return await api.fetch<{ success: boolean; message?: string }>('/api/network/wifi', {
        method: 'POST',
        body: JSON.stringify(config),
      });
    } catch {
      // Mock success response
      console.log('Mock: WiFi config would be updated with:', config);
      return { success: true, message: 'WiFi configuration updated (mock mode)' };
    }
  },

  // Get Access Point configuration
  async getAPConfig(): Promise<APConfig> {
    try {
      return await api.fetch<APConfig>('/api/network/ap');
    } catch {
      return mockAPConfig;
    }
  },

  // Update Access Point configuration
  async updateAPConfig(config: APConfig): Promise<{ success: boolean; message?: string }> {
    try {
      return await api.fetch<{ success: boolean; message?: string }>('/api/network/ap', {
        method: 'POST',
        body: JSON.stringify(config),
      });
    } catch {
      // Mock success response
      console.log('Mock: AP config would be updated with:', config);
      return { success: true, message: 'AP configuration updated (mock mode)' };
    }
  },

  // Get network status
  async getNetworkStatus(): Promise<NetworkStatus> {
    try {
      return await api.fetch<NetworkStatus>('/api/network/status');
    } catch {
      return mockNetworkStatus;
    }
  },

  // Scan for available WiFi networks
  async scanNetworks(): Promise<ScanResult[]> {
    try {
      return await api.fetch<ScanResult[]>('/api/network/scan');
    } catch {
      return mockScanResults;
    }
  },

  // Get hostname configuration
  async getHostnameConfig(): Promise<HostnameConfig> {
    try {
      return await api.fetch<HostnameConfig>('/api/network/hostname');
    } catch {
      return mockHostnameConfig;
    }
  },

  // Update hostname configuration
  async updateHostnameConfig(config: HostnameConfig): Promise<{ success: boolean; message?: string }> {
    try {
      return await api.fetch<{ success: boolean; message?: string }>('/api/network/hostname', {
        method: 'POST',
        body: JSON.stringify(config),
      });
    } catch {
      // Mock success response
      console.log('Mock: Hostname config would be updated with:', config);
      return { success: true, message: 'Hostname configuration updated (mock mode)' };
    }
  },

  // Get all WiFi profiles
  async getWiFiProfiles(): Promise<WiFiProfile[]> {
    try {
      // Backend returns { profiles: [...] }
      const response = await api.fetch<{ profiles: any[] }>('/api/network/profiles');
      
      // Transform backend format to frontend format
      return response.profiles.map((p) => ({
        id: p.ssid, // Use SSID as ID since backend doesn't provide one
        name: p.name || p.ssid, // Use backend name field, fallback to SSID
        ssid: p.ssid,
        password: '', // Backend doesn't return passwords in profile list
        ip: p.useStaticIP ? (p.staticIP || '') : '',
        gateway: p.useStaticIP ? (p.gateway || '') : '',
        subnet: p.useStaticIP ? (p.subnet || '') : '',
        dns: '8.8.8.8', // Backend doesn't return DNS in profile list
        dhcp: !p.useStaticIP, // Backend uses useStaticIP, frontend uses dhcp
        priority: p.priority,
      }));
    } catch (error) {
      console.error('Error fetching WiFi profiles:', error);
      return mockWiFiProfiles;
    }
  },

  // Save or update WiFi profile
  async saveWiFiProfile(profile: Omit<WiFiProfile, 'id'>): Promise<{ success: boolean; message?: string; id?: string }> {
    try {
      // Transform frontend format to backend format
      const backendProfile: any = {
        ssid: profile.ssid,
        password: profile.password,
        name: profile.name,
        priority: profile.priority,
        useStaticIP: !profile.dhcp, // Backend uses useStaticIP (true = static), frontend uses dhcp (true = DHCP)
      };

      // If using static IP, add nested staticIP object
      if (!profile.dhcp) {
        backendProfile.staticIP = {
          ip: profile.ip,
          gateway: profile.gateway,
          subnet: profile.subnet,
          dns1: profile.dns,
          dns2: '8.8.4.4', // Secondary DNS
        };
      }

      console.log('Saving WiFi profile with data:', backendProfile);
      
      const response = await api.fetch<{ success: boolean; message?: string; id?: string }>('/api/network/profiles', {
        method: 'POST',
        body: JSON.stringify(backendProfile),
      });
      
      console.log('WiFi profile save response:', response);
      return response;
    } catch (error) {
      console.error('Error saving WiFi profile:', error);
      // Mock success response
      console.log('Mock: WiFi profile would be saved:', profile);
      return { success: true, message: 'WiFi profile saved (mock mode)', id: Date.now().toString() };
    }
  },

  // Delete WiFi profile
  async deleteWiFiProfile(id: string): Promise<{ success: boolean; message?: string }> {
    try {
      return await api.fetch<{ success: boolean; message?: string }>(`/api/network/profiles/${id}`, {
        method: 'DELETE',
      });
    } catch {
      // Mock success response
      console.log('Mock: WiFi profile would be deleted:', id);
      return { success: true, message: 'WiFi profile deleted (mock mode)' };
    }
  },

  // Connect to a saved WiFi profile
  async connectToProfile(id: string): Promise<{ success: boolean; message?: string }> {
    try {
      return await api.fetch<{ success: boolean; message?: string }>(`/api/network/profiles/${id}/connect`, {
        method: 'POST',
      });
    } catch {
      // Mock success response
      console.log('Mock: Would connect to profile:', id);
      return { success: true, message: 'Connecting to WiFi profile (mock mode)' };
    }
  },

  // Update profile priority (for auto-connect order)
  async updateProfilePriority(id: string, priority: number): Promise<{ success: boolean; message?: string }> {
    try {
      console.log(`[NetworkService] Updating profile priority: SSID="${id}", new priority=${priority}`);
      const url = `/api/network/profiles/priority`;
      console.log(`[NetworkService] API URL: ${url}`);
      
      const response = await api.fetch<{ success: boolean; message?: string }>(url, {
        method: 'POST',
        body: JSON.stringify({ ssid: id, priority }),
      });
      
      console.log(`[NetworkService] Priority update response:`, response);
      return response;
    } catch (error) {
      // Mock success response
      console.error('[NetworkService] Priority update failed:', error);
      console.log('Mock: Would update profile priority:', id, priority);
      return { success: true, message: 'Profile priority updated (mock mode)' };
    }
  },

  // Get auto-reconnect configuration
  async getAutoReconnectConfig(): Promise<AutoReconnectConfig> {
    try {
      return await api.fetch<AutoReconnectConfig>('/api/network/autoreconnect');
    } catch {
      return mockAutoReconnectConfig;
    }
  },

  // Update auto-reconnect configuration
  async updateAutoReconnectConfig(config: AutoReconnectConfig): Promise<{ success: boolean; message?: string }> {
    try {
      return await api.fetch<{ success: boolean; message?: string }>('/api/network/autoreconnect', {
        method: 'POST',
        body: JSON.stringify(config),
      });
    } catch {
      // Mock success response
      console.log('Mock: Auto-reconnect config would be updated with:', config);
      return { success: true, message: 'Auto-reconnect configuration updated (mock mode)' };
    }
  },
};

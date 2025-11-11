// JBoard Network service for ESP-NOW peer communication
import { api } from './api';
import type { JBoardDevice, ThisDevice, JBoardMessage } from '../types/jboard';
import { DeviceType, DeviceCapability } from '../types/jboard';

// Mock data
const mockThisDevice: ThisDevice = {
  mac: 'AA:BB:CC:DD:EE:FF',
  name: 'JSense Board',
  type: DeviceType.JSENSE_BOARD,
  capabilities: DeviceCapability.LED_CONTROL | DeviceCapability.WEB_INTERFACE,
  firmwareVersion: '1.0.0',
  ipAddress: '192.168.1.100',
  isListening: true,
};

const mockPeers: JBoardDevice[] = [
  {
    mac: '11:22:33:44:55:66',
    name: 'LED Strip Controller',
    type: DeviceType.LED_CONTROLLER,
    capabilities: DeviceCapability.LED_CONTROL,
    rssi: -42,
    lastSeen: new Date(Date.now() - 3000).toISOString(),
    firmwareVersion: '1.0.2',
    ipAddress: '192.168.1.101',
    isPaired: true,
  },
  {
    mac: '77:88:99:AA:BB:CC',
    name: 'Sensor Hub',
    type: DeviceType.SENSOR_HUB,
    capabilities: DeviceCapability.SENSOR_DATA | DeviceCapability.BATTERY_POWERED,
    rssi: -58,
    lastSeen: new Date(Date.now() - 5000).toISOString(),
    firmwareVersion: '0.9.8',
    ipAddress: '192.168.1.102',
    isPaired: true,
  },
];

const mockMessages: JBoardMessage[] = [
  {
    id: '1',
    from: 'AA:BB:CC:DD:EE:FF',
    to: '11:22:33:44:55:66',
    timestamp: new Date(Date.now() - 120000).toISOString(),
    type: 'CHAT_MESSAGE',
    payload: { text: 'Hey, are you online?' },
    status: 'delivered',
  },
  {
    id: '2',
    from: '11:22:33:44:55:66',
    to: 'AA:BB:CC:DD:EE:FF',
    timestamp: new Date(Date.now() - 110000).toISOString(),
    type: 'CHAT_MESSAGE',
    payload: { text: 'Yes! Just started up.' },
    status: 'delivered',
  },
  {
    id: '3',
    from: 'AA:BB:CC:DD:EE:FF',
    to: '11:22:33:44:55:66',
    timestamp: new Date(Date.now() - 100000).toISOString(),
    type: 'set_brightness',
    payload: { value: 75 },
    status: 'delivered',
  },
  {
    id: '4',
    from: 'AA:BB:CC:DD:EE:FF',
    to: '11:22:33:44:55:66',
    timestamp: new Date(Date.now() - 90000).toISOString(),
    type: 'CHAT_MESSAGE',
    payload: { text: 'Can you dim the lights a bit?' },
    status: 'delivered',
  },
  {
    id: '5',
    from: '11:22:33:44:55:66',
    to: 'AA:BB:CC:DD:EE:FF',
    timestamp: new Date(Date.now() - 85000).toISOString(),
    type: 'CHAT_MESSAGE',
    payload: { text: 'Done! Set to 75%' },
    status: 'delivered',
  },
  {
    id: '6',
    from: 'AA:BB:CC:DD:EE:FF',
    to: '77:88:99:AA:BB:CC',
    timestamp: new Date(Date.now() - 60000).toISOString(),
    type: 'CHAT_MESSAGE',
    payload: { text: 'What\'s the current temperature?' },
    status: 'delivered',
  },
  {
    id: '7',
    from: '77:88:99:AA:BB:CC',
    to: 'AA:BB:CC:DD:EE:FF',
    timestamp: new Date(Date.now() - 55000).toISOString(),
    type: 'CHAT_MESSAGE',
    payload: { text: '72°F, humidity at 45%' },
    status: 'delivered',
  },
];

export const jboardService = {
  // Get this device info
  async getThisDevice(): Promise<ThisDevice> {
    try {
      return await api.fetch<ThisDevice>('/api/jboard/status');
    } catch {
      return mockThisDevice;
    }
  },

  // Get known peers
  async getPeers(): Promise<JBoardDevice[]> {
    try {
      return await api.fetch<JBoardDevice[]>('/api/jboard/peers');
    } catch {
      return mockPeers;
    }
  },

  // Start device discovery scan
  async startScan(): Promise<{ success: boolean; message?: string; devices?: JBoardDevice[] }> {
    try {
      return await api.fetch<{ success: boolean; message?: string; devices?: JBoardDevice[] }>('/api/jboard/scan', {
        method: 'POST',
      });
    } catch {
      console.log('Mock: Starting device scan');
      // Mock discovered devices (unpaired)
      const discoveredDevices: JBoardDevice[] = [
        {
          mac: 'DD:EE:FF:00:11:22',
          name: 'Audio Reactive #4',
          type: DeviceType.AUDIO_REACTIVE,
          capabilities: DeviceCapability.LED_CONTROL | DeviceCapability.AUDIO_PLAYBACK,
          rssi: -35,
          lastSeen: new Date().toISOString(),
          firmwareVersion: '1.1.0',
          ipAddress: '192.168.1.103',
          isPaired: false,
        },
        {
          mac: '33:44:55:66:77:88',
          name: 'Effects Controller #6',
          type: DeviceType.EFFECTS_CONTROLLER,
          capabilities: DeviceCapability.LED_CONTROL | DeviceCapability.WEB_INTERFACE,
          rssi: -48,
          lastSeen: new Date().toISOString(),
          firmwareVersion: '1.0.5',
          ipAddress: '192.168.1.104',
          isPaired: false,
        },
      ];
      return { success: true, message: 'Found 2 devices', devices: discoveredDevices };
    }
  },

  // Pair with device
  async pairDevice(mac: string, name?: string): Promise<{ success: boolean; message?: string }> {
    try {
      return await api.fetch<{ success: boolean; message?: string }>('/api/jboard/pair', {
        method: 'POST',
        body: JSON.stringify({ mac, name }),
      });
    } catch {
      console.log('Mock: Pairing with device:', mac);
      return { success: true, message: 'Device paired (mock mode)' };
    }
  },

  // Unpair device
  async unpairDevice(mac: string): Promise<{ success: boolean; message?: string }> {
    try {
      return await api.fetch<{ success: boolean; message?: string }>('/api/jboard/unpair', {
        method: 'POST',
        body: JSON.stringify({ mac }),
      });
    } catch {
      console.log('Mock: Unpairing device:', mac);
      return { success: true, message: 'Device unpaired (mock mode)' };
    }
  },

  // Send message to peer
  async sendMessage(to: string, type: string, payload: any): Promise<{ success: boolean; message?: string }> {
    try {
      return await api.fetch<{ success: boolean; message?: string }>('/api/jboard/send', {
        method: 'POST',
        body: JSON.stringify({ to, type, payload }),
      });
    } catch {
      console.log('Mock: Sending message to', to, ':', type, payload);
      return { success: true, message: 'Message sent (mock mode)' };
    }
  },

  // Broadcast to all peers
  async broadcast(type: string, payload: any): Promise<{ success: boolean; message?: string }> {
    try {
      return await api.fetch<{ success: boolean; message?: string }>('/api/jboard/broadcast', {
        method: 'POST',
        body: JSON.stringify({ type, payload }),
      });
    } catch {
      console.log('Mock: Broadcasting:', type, payload);
      return { success: true, message: 'Broadcast sent (mock mode)' };
    }
  },

  // Get message history
  async getMessages(limit: number = 50): Promise<JBoardMessage[]> {
    try {
      return await api.fetch<JBoardMessage[]>(`/api/jboard/messages?limit=${limit}`);
    } catch {
      return mockMessages;
    }
  },
};

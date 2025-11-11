import { api } from './api'
import {
  SensorStatus,
  SensorType,
  AlertSeverity,
} from '../types/sensors'
import type {
  Sensor,
  SensorAlert,
  SensorHistory,
  SensorStats,
  SensorAutomationRule,
  SensorGroup,
  SensorCalibration,
  SensorConfig,
  RemoteSensor,
  SensorDataLog,
  LoggingConfig,
} from '../types/sensors'

// Mock data for development
const mockSensors: Sensor[] = [
  {
    id: 'temp-1',
    name: 'Temperature',
    type: SensorType.TEMPERATURE,
    currentReading: {
      value: 22.5,
      unit: '°C',
      timestamp: Date.now(),
      status: SensorStatus.ACTIVE,
    },
    config: {
      enabled: true,
      samplingRate: 1000,
      smoothing: 3,
      threshold: {
        min: 15,
        max: 30,
        warningMin: 18,
        warningMax: 28,
      },
      calibrationOffset: 0,
    },
    pin: 34,
    lastCalibrated: Date.now() - 86400000,
  },
  {
    id: 'humid-1',
    name: 'Humidity',
    type: SensorType.HUMIDITY,
    currentReading: {
      value: 45,
      unit: '%',
      timestamp: Date.now(),
      status: SensorStatus.ACTIVE,
    },
    config: {
      enabled: true,
      samplingRate: 2000,
      smoothing: 5,
      threshold: {
        min: 30,
        max: 70,
        warningMin: 35,
        warningMax: 65,
      },
      calibrationOffset: 0,
    },
    pin: 35,
    lastCalibrated: Date.now() - 86400000,
  },
  {
    id: 'light-1',
    name: 'Light Level',
    type: SensorType.LIGHT,
    currentReading: {
      value: 350,
      unit: 'lux',
      timestamp: Date.now(),
      status: SensorStatus.ACTIVE,
    },
    config: {
      enabled: true,
      samplingRate: 500,
      smoothing: 2,
      threshold: {
        min: 100,
        max: 1000,
        warningMin: 150,
        warningMax: 900,
      },
      calibrationOffset: 0,
    },
    pin: 36,
  },
  {
    id: 'sound-1',
    name: 'Sound Level',
    type: SensorType.SOUND,
    currentReading: {
      value: 65,
      unit: 'dB',
      timestamp: Date.now(),
      status: SensorStatus.ACTIVE,
    },
    config: {
      enabled: true,
      samplingRate: 100,
      smoothing: 1,
      threshold: {
        min: 40,
        max: 85,
        warningMin: 50,
        warningMax: 80,
      },
      calibrationOffset: 0,
      triggerEffect: 'rainbow',
    },
    pin: 39,
  },
]

const mockAlerts: SensorAlert[] = [
  {
    id: 'alert-1',
    sensorId: 'light-1',
    sensorName: 'Light Level',
    severity: AlertSeverity.WARNING,
    message: 'Light level below warning threshold (350 lux < 400 lux)',
    timestamp: Date.now() - 300000,
    acknowledged: false,
  },
]

const mockAutomationRules: SensorAutomationRule[] = [
  {
    id: 'rule-1',
    name: 'High Temperature Alert',
    sensorId: 'temp-1',
    condition: 'above',
    value1: 28,
    action: 'send_alert',
    actionData: 'Temperature too high!',
    enabled: true,
  },
  {
    id: 'rule-2',
    name: 'Low Light Effect',
    sensorId: 'light-1',
    condition: 'below',
    value1: 200,
    action: 'trigger_effect',
    actionData: 'rainbow',
    enabled: true,
  },
]

const mockGroups: SensorGroup[] = [
  {
    id: 'group-1',
    name: 'Environmental',
    sensorIds: ['temp-1', 'humid-1'],
    icon: '🌡️',
  },
  {
    id: 'group-2',
    name: 'Ambient',
    sensorIds: ['light-1', 'sound-1'],
    icon: '💡',
  },
]

const mockRemoteSensors: RemoteSensor[] = [
  {
    id: 'remote-temp-1',
    name: 'Living Room Temp',
    type: SensorType.TEMPERATURE,
    currentReading: {
      value: 23.2,
      unit: '°C',
      timestamp: Date.now(),
      status: SensorStatus.ACTIVE,
    },
    config: {
      enabled: true,
      samplingRate: 2000,
      smoothing: 3,
      threshold: {
        min: 15,
        max: 30,
      },
      calibrationOffset: 0,
    },
    deviceId: 'device-001',
    deviceName: 'Living Room JBoard',
    lastSync: Date.now() - 5000,
    rssi: -65,
  },
  {
    id: 'remote-motion-1',
    name: 'Hallway Motion',
    type: SensorType.MOTION,
    currentReading: {
      value: 1,
      unit: 'detected',
      timestamp: Date.now(),
      status: SensorStatus.ACTIVE,
    },
    config: {
      enabled: true,
      samplingRate: 500,
      smoothing: 1,
      threshold: {},
      calibrationOffset: 0,
    },
    deviceId: 'device-002',
    deviceName: 'Hallway JBoard',
    lastSync: Date.now() - 3000,
    rssi: -72,
  },
]

const mockDataLogs: SensorDataLog[] = [
  {
    id: 'log-1',
    sensorId: 'temp-1',
    startTime: Date.now() - 3600000,
    endTime: Date.now(),
    filename: 'temp-1_2025-11-11.csv',
    fileSize: 2.4,
    recordCount: 3600,
    status: 'active',
  },
  {
    id: 'log-2',
    sensorId: 'humid-1',
    startTime: Date.now() - 7200000,
    endTime: Date.now() - 3600000,
    filename: 'humid-1_2025-11-11_00.csv',
    fileSize: 1.8,
    recordCount: 1800,
    status: 'stopped',
  },
]

const mockLoggingConfig: LoggingConfig = {
  enabled: true,
  sensorIds: ['temp-1', 'humid-1'],
  interval: 1,
  maxFileSize: 10,
  autoRotate: true,
  format: 'csv',
}

// Generate mock historical data
function generateMockHistory(sensorId: string, hours: number = 1): SensorHistory {
  const now = Date.now()
  const interval = 60000 // 1 minute
  const points = hours * 60
  const data = []

  const baseValues: Record<string, number> = {
    'temp-1': 22,
    'humid-1': 45,
    'light-1': 350,
    'sound-1': 65,
  }

  const baseValue = baseValues[sensorId] || 50

  for (let i = points; i >= 0; i--) {
    const timestamp = now - i * interval
    const variance = (Math.random() - 0.5) * 10
    data.push({
      timestamp,
      value: baseValue + variance,
    })
  }

  return {
    sensorId,
    data,
    startTime: now - hours * 3600000,
    endTime: now,
  }
}

// API Functions
export const sensorsService = {
  // Get all sensors
  async getSensors(): Promise<Sensor[]> {
    try {
      return await api.fetch<Sensor[]>('/api/sensors')
    } catch {
      return mockSensors
    }
  },

  // Get sensor by ID
  async getSensor(id: string): Promise<Sensor> {
    try {
      return await api.fetch<Sensor>(`/api/sensors/${id}`)
    } catch {
      const sensor = mockSensors.find((s) => s.id === id)
      if (!sensor) throw new Error('Sensor not found')
      return sensor
    }
  },

  // Update sensor configuration
  async updateSensorConfig(id: string, config: Partial<SensorConfig>): Promise<void> {
    try {
      await api.fetch(`/api/sensors/${id}/config`, {
        method: 'PUT',
        body: JSON.stringify(config),
      })
    } catch {
      // Mock success
    }
  },

  // Calibrate sensor
  async calibrateSensor(
    id: string,
    referenceValue: number
  ): Promise<SensorCalibration> {
    try {
      return await api.fetch<SensorCalibration>(`/api/sensors/${id}/calibrate`, {
        method: 'POST',
        body: JSON.stringify({ referenceValue }),
      })
    } catch {
      const sensor = mockSensors.find((s) => s.id === id)
      return {
        sensorId: id,
        referenceValue,
        measuredValue: sensor?.currentReading.value || 0,
        offset: referenceValue - (sensor?.currentReading.value || 0),
        timestamp: Date.now(),
      }
    }
  },

  // Get sensor history
  async getSensorHistory(
    id: string,
    startTime: number,
    endTime: number
  ): Promise<SensorHistory> {
    try {
      return await api.fetch<SensorHistory>(
        `/api/sensors/${id}/history?start=${startTime}&end=${endTime}`
      )
    } catch {
      const hours = Math.ceil((endTime - startTime) / 3600000)
      return generateMockHistory(id, Math.min(hours, 24))
    }
  },

  // Get sensor statistics
  async getSensorStats(id: string, duration: number = 3600000): Promise<SensorStats> {
    try {
      return await api.fetch<SensorStats>(
        `/api/sensors/${id}/stats?duration=${duration}`
      )
    } catch {
      const sensor = mockSensors.find((s) => s.id === id)
      const current = sensor?.currentReading.value || 0
      return {
        min: current - 5,
        max: current + 5,
        avg: current,
        current,
      }
    }
  },

  // Get all alerts
  async getAlerts(acknowledged: boolean = false): Promise<SensorAlert[]> {
    try {
      return await api.fetch<SensorAlert[]>(
        `/api/sensors/alerts?acknowledged=${acknowledged}`
      )
    } catch {
      return mockAlerts.filter((a) => a.acknowledged === acknowledged)
    }
  },

  // Acknowledge alert
  async acknowledgeAlert(id: string): Promise<void> {
    try {
      await api.fetch(`/api/sensors/alerts/${id}/acknowledge`, {
        method: 'POST',
      })
    } catch {
      // Mock success
    }
  },

  // Clear all alerts
  async clearAlerts(): Promise<void> {
    try {
      await api.fetch('/api/sensors/alerts', {
        method: 'DELETE',
      })
    } catch {
      // Mock success
    }
  },

  // Get automation rules
  async getAutomationRules(): Promise<SensorAutomationRule[]> {
    try {
      return await api.fetch<SensorAutomationRule[]>('/api/sensors/automation/rules')
    } catch {
      return mockAutomationRules
    }
  },

  // Create automation rule
  async createAutomationRule(
    rule: Omit<SensorAutomationRule, 'id'>
  ): Promise<SensorAutomationRule> {
    try {
      return await api.fetch<SensorAutomationRule>('/api/sensors/automation/rules', {
        method: 'POST',
        body: JSON.stringify(rule),
      })
    } catch {
      return { ...rule, id: `rule-${Date.now()}` }
    }
  },

  // Update automation rule
  async updateAutomationRule(
    id: string,
    rule: Partial<SensorAutomationRule>
  ): Promise<void> {
    try {
      await api.fetch(`/api/sensors/automation/rules/${id}`, {
        method: 'PUT',
        body: JSON.stringify(rule),
      })
    } catch {
      // Mock success
    }
  },

  // Delete automation rule
  async deleteAutomationRule(id: string): Promise<void> {
    try {
      await api.fetch(`/api/sensors/automation/rules/${id}`, {
        method: 'DELETE',
      })
    } catch {
      // Mock success
    }
  },

  // Get sensor groups
  async getGroups(): Promise<SensorGroup[]> {
    try {
      return await api.fetch<SensorGroup[]>('/api/sensors/groups')
    } catch {
      return mockGroups
    }
  },

  // Create sensor group
  async createGroup(group: Omit<SensorGroup, 'id'>): Promise<SensorGroup> {
    try {
      return await api.fetch<SensorGroup>('/api/sensors/groups', {
        method: 'POST',
        body: JSON.stringify(group),
      })
    } catch {
      return { ...group, id: `group-${Date.now()}` }
    }
  },

  // Export sensor data
  async exportData(format: 'json' | 'csv' = 'csv'): Promise<Blob> {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/sensors/export?format=${format}`
      )
      return await response.blob()
    } catch {
      // Generate mock CSV
      const csv = mockSensors
        .map(
          (s) =>
            `${s.name},${s.currentReading.value},${s.currentReading.unit},${new Date(s.currentReading.timestamp).toISOString()}`
        )
        .join('\n')
      return new Blob([`Sensor,Value,Unit,Timestamp\n${csv}`], { type: 'text/csv' })
    }
  },

  // Remote Sensors (Phase 4)
  async getRemoteSensors(): Promise<RemoteSensor[]> {
    try {
      return await api.fetch<RemoteSensor[]>('/api/sensors/remote')
    } catch {
      return mockRemoteSensors
    }
  },

  async getRemoteSensor(deviceId: string, sensorId: string): Promise<RemoteSensor> {
    try {
      return await api.fetch<RemoteSensor>(`/api/jboard/devices/${deviceId}/sensors/${sensorId}`)
    } catch {
      const sensor = mockRemoteSensors.find((s) => s.id === sensorId && s.deviceId === deviceId)
      if (!sensor) throw new Error('Remote sensor not found')
      return sensor
    }
  },

  async refreshRemoteSensors(deviceId?: string): Promise<void> {
    try {
      const endpoint = deviceId
        ? `/api/jboard/devices/${deviceId}/sensors/refresh`
        : '/api/sensors/remote/refresh'
      await api.fetch(endpoint, { method: 'POST' })
    } catch {
      // Mock success
    }
  },

  // Data Logging (Phase 4)
  async getLoggingConfig(): Promise<LoggingConfig> {
    try {
      return await api.fetch<LoggingConfig>('/api/sensors/logging/config')
    } catch {
      return mockLoggingConfig
    }
  },

  async updateLoggingConfig(config: Partial<LoggingConfig>): Promise<void> {
    try {
      await api.fetch('/api/sensors/logging/config', {
        method: 'PUT',
        body: JSON.stringify(config),
      })
    } catch {
      // Mock success
    }
  },

  async getDataLogs(): Promise<SensorDataLog[]> {
    try {
      return await api.fetch<SensorDataLog[]>('/api/sensors/logging/logs')
    } catch {
      return mockDataLogs
    }
  },

  async startLogging(sensorIds: string[]): Promise<void> {
    try {
      await api.fetch('/api/sensors/logging/start', {
        method: 'POST',
        body: JSON.stringify({ sensorIds }),
      })
    } catch {
      // Mock success
    }
  },

  async stopLogging(sensorIds?: string[]): Promise<void> {
    try {
      await api.fetch('/api/sensors/logging/stop', {
        method: 'POST',
        body: JSON.stringify({ sensorIds }),
      })
    } catch {
      // Mock success
    }
  },

  async downloadLog(logId: string): Promise<Blob> {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/sensors/logging/logs/${logId}/download`
      )
      return await response.blob()
    } catch {
      const csv = `Timestamp,Value\n${Array.from({ length: 10 }, (_, i) => 
        `${Date.now() - i * 60000},${20 + Math.random() * 5}`
      ).join('\n')}`
      return new Blob([csv], { type: 'text/csv' })
    }
  },

  async deleteLog(logId: string): Promise<void> {
    try {
      await api.fetch(`/api/sensors/logging/logs/${logId}`, {
        method: 'DELETE',
      })
    } catch {
      // Mock success
    }
  },
}

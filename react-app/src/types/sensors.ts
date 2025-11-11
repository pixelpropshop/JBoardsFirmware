// Sensor Types and Interfaces

export enum SensorType {
  TEMPERATURE = 'temperature',
  HUMIDITY = 'humidity',
  PRESSURE = 'pressure',
  LIGHT = 'light',
  SOUND = 'sound',
  MOTION = 'motion',
  PROXIMITY = 'proximity',
  AIR_QUALITY = 'air_quality',
  VOLTAGE = 'voltage',
  CURRENT = 'current',
  CUSTOM = 'custom',
}

export enum SensorStatus {
  ACTIVE = 'active',
  IDLE = 'idle',
  ERROR = 'error',
  DISABLED = 'disabled',
  CALIBRATING = 'calibrating',
}

export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  CRITICAL = 'critical',
}

export interface SensorReading {
  value: number
  unit: string
  timestamp: number
  status: SensorStatus
}

export interface SensorThreshold {
  min?: number
  max?: number
  warningMin?: number
  warningMax?: number
}

export interface SensorConfig {
  enabled: boolean
  samplingRate: number // milliseconds
  smoothing: number // number of samples to average (1-10)
  threshold: SensorThreshold
  calibrationOffset: number
  triggerEffect?: string // effect ID to trigger on threshold breach
}

export interface Sensor {
  id: string
  name: string
  type: SensorType
  currentReading: SensorReading
  config: SensorConfig
  lastCalibrated?: number
  pin?: number
}

export interface SensorAlert {
  id: string
  sensorId: string
  sensorName: string
  severity: AlertSeverity
  message: string
  timestamp: number
  acknowledged: boolean
}

export interface SensorHistoryPoint {
  timestamp: number
  value: number
}

export interface SensorHistory {
  sensorId: string
  data: SensorHistoryPoint[]
  startTime: number
  endTime: number
}

export interface SensorStats {
  min: number
  max: number
  avg: number
  current: number
}

export interface SensorAutomationRule {
  id: string
  name: string
  sensorId: string
  condition: 'above' | 'below' | 'between' | 'outside'
  value1: number
  value2?: number // for 'between' and 'outside' conditions
  action: 'trigger_effect' | 'send_alert' | 'trigger_scene' | 'trigger_sequence' | 'trigger_remote_effect' | 'trigger_remote_scene' | 'trigger_remote_sequence'
  actionData: string // effect ID, alert message, scene ID, or sequence ID
  targetDeviceId?: string // for remote actions
  enabled: boolean
}

// TODO: Create dedicated Scenes feature
// Scenes should be instant presets (saved LED configurations without timeline)
// Currently "trigger_scene" uses sequence IDs as a temporary solution
// Future: Implement Scenes page with preset management separate from Sequences

export interface SensorGroup {
  id: string
  name: string
  sensorIds: string[]
  icon?: string
}

export interface SensorDashboardLayout {
  sensorId: string
  row: number
  col: number
  width: number
  height: number
}

export interface SensorCalibration {
  sensorId: string
  referenceValue: number
  measuredValue: number
  offset: number
  timestamp: number
}

export interface SensorLogEntry {
  sensorId: string
  timestamp: number
  value: number
  status: SensorStatus
}

// Remote sensor (from paired JBoard device)
export interface RemoteSensor extends Sensor {
  deviceId: string
  deviceName: string
  lastSync: number
  rssi: number
}

// Data logging
export interface SensorDataLog {
  id: string
  sensorId: string
  startTime: number
  endTime: number
  filename: string
  fileSize: number
  recordCount: number
  status: 'active' | 'stopped' | 'error'
}

export interface LoggingConfig {
  enabled: boolean
  sensorIds: string[]
  interval: number // seconds between logs
  maxFileSize: number // MB
  autoRotate: boolean
  format: 'csv' | 'json'
}

export interface SensorExportData {
  sensors: Sensor[]
  history: SensorHistory[]
  alerts: SensorAlert[]
  automationRules: SensorAutomationRule[]
  exportTimestamp: number
}

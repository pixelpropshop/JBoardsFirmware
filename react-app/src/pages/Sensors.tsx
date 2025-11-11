import { useState, useEffect } from 'react'
import { sensorsService } from '../services/sensorsService'
import { jboardService } from '../services/jboardService'
import type { Sensor, SensorAlert, SensorStatus, SensorHistory, SensorStats, SensorConfig, SensorAutomationRule, RemoteSensor, SensorDataLog, LoggingConfig } from '../types/sensors'
import type { JBoardDevice } from '../types/jboard'
import Toggle from '../components/Toggle'
import LineChart from '../components/LineChart'
import SensorConfigModal from '../components/SensorConfigModal'
import AutomationRuleModal from '../components/AutomationRuleModal'
import SignalStrength from '../components/SignalStrength'

export default function Sensors() {
  const [sensors, setSensors] = useState<Sensor[]>([])
  const [alerts, setAlerts] = useState<SensorAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSensor, setSelectedSensor] = useState<Sensor | null>(null)
  const [configPanelOpen, setConfigPanelOpen] = useState(false)
  const [historyPanelOpen, setHistoryPanelOpen] = useState(false)
  const [sensorHistory, setSensorHistory] = useState<SensorHistory | null>(null)
  const [sensorStats, setSensorStats] = useState<SensorStats | null>(null)
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h'>('1h')
  const [automationRules, setAutomationRules] = useState<SensorAutomationRule[]>([])
  const [ruleModalOpen, setRuleModalOpen] = useState(false)
  const [selectedRule, setSelectedRule] = useState<SensorAutomationRule | undefined>()
  const [activeTab, setActiveTab] = useState<'sensors' | 'automation' | 'remote' | 'logging'>('sensors')
  const [remoteSensors, setRemoteSensors] = useState<RemoteSensor[]>([])
  const [pairedDevices, setPairedDevices] = useState<JBoardDevice[]>([])
  const [dataLogs, setDataLogs] = useState<SensorDataLog[]>([])
  const [loggingConfig, setLoggingConfig] = useState<LoggingConfig | null>(null)

  // Load sensors and alerts
  const loadData = async () => {
    try {
      const [sensorsData, alertsData, rulesData, remoteSensorsData, pairedDevicesData, logsData, configData] = await Promise.all([
        sensorsService.getSensors(),
        sensorsService.getAlerts(),
        sensorsService.getAutomationRules(),
        sensorsService.getRemoteSensors(),
        jboardService.getPeers(),
        sensorsService.getDataLogs(),
        sensorsService.getLoggingConfig(),
      ])
      setSensors(sensorsData)
      setAlerts(alertsData)
      setAutomationRules(rulesData)
      setRemoteSensors(remoteSensorsData)
      setPairedDevices(pairedDevicesData)
      setDataLogs(logsData)
      setLoggingConfig(configData)
    } catch (error) {
      console.error('Failed to load sensor data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    // Auto-refresh every 2 seconds for real-time data
    const interval = setInterval(loadData, 2000)
    return () => clearInterval(interval)
  }, [])

  const handleToggleSensor = async (sensorId: string, enabled: boolean) => {
    try {
      await sensorsService.updateSensorConfig(sensorId, { enabled })
      setSensors(
        sensors.map((s) =>
          s.id === sensorId ? { ...s, config: { ...s.config, enabled } } : s
        )
      )
    } catch (error) {
      console.error('Failed to update sensor:', error)
    }
  }

  const handleViewHistory = async (sensor: Sensor) => {
    setSelectedSensor(sensor)
    setHistoryPanelOpen(true)
    
    // Load historical data
    const now = Date.now()
    const duration = timeRange === '1h' ? 3600000 : timeRange === '6h' ? 21600000 : 86400000
    const startTime = now - duration
    
    try {
      const [history, stats] = await Promise.all([
        sensorsService.getSensorHistory(sensor.id, startTime, now),
        sensorsService.getSensorStats(sensor.id, duration),
      ])
      setSensorHistory(history)
      setSensorStats(stats)
    } catch (error) {
      console.error('Failed to load sensor history:', error)
    }
  }

  const handleConfigureSensor = (sensor: Sensor) => {
    setSelectedSensor(sensor)
    setConfigPanelOpen(true)
  }

  const handleSaveConfig = async (config: Partial<SensorConfig>) => {
    if (!selectedSensor) return
    try {
      await sensorsService.updateSensorConfig(selectedSensor.id, config)
      setSensors(
        sensors.map((s) =>
          s.id === selectedSensor.id ? { ...s, config: { ...s.config, ...config } } : s
        )
      )
    } catch (error) {
      console.error('Failed to save configuration:', error)
      throw error
    }
  }

  const handleCalibrate = async (referenceValue: number) => {
    if (!selectedSensor) return
    try {
      const calibration = await sensorsService.calibrateSensor(selectedSensor.id, referenceValue)
      setSensors(
        sensors.map((s) =>
          s.id === selectedSensor.id
            ? {
                ...s,
                config: { ...s.config, calibrationOffset: calibration.offset },
                lastCalibrated: calibration.timestamp,
              }
            : s
        )
      )
    } catch (error) {
      console.error('Failed to calibrate sensor:', error)
      throw error
    }
  }

  const handleCreateRule = () => {
    setSelectedRule(undefined)
    setRuleModalOpen(true)
  }

  const handleEditRule = (rule: SensorAutomationRule) => {
    setSelectedRule(rule)
    setRuleModalOpen(true)
  }

  const handleSaveRule = async (rule: Omit<SensorAutomationRule, 'id'> | SensorAutomationRule) => {
    try {
      if ('id' in rule) {
        // Update existing rule
        await sensorsService.updateAutomationRule(rule.id, rule)
        setAutomationRules(automationRules.map((r) => (r.id === rule.id ? rule : r)))
      } else {
        // Create new rule
        const newRule = await sensorsService.createAutomationRule(rule)
        setAutomationRules([...automationRules, newRule])
      }
    } catch (error) {
      console.error('Failed to save automation rule:', error)
      throw error
    }
  }

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this automation rule?')) return
    try {
      await sensorsService.deleteAutomationRule(ruleId)
      setAutomationRules(automationRules.filter((r) => r.id !== ruleId))
    } catch (error) {
      console.error('Failed to delete automation rule:', error)
    }
  }

  const handleToggleRule = async (ruleId: string, enabled: boolean) => {
    try {
      await sensorsService.updateAutomationRule(ruleId, { enabled })
      setAutomationRules(automationRules.map((r) => (r.id === ruleId ? { ...r, enabled } : r)))
    } catch (error) {
      console.error('Failed to toggle automation rule:', error)
    }
  }

  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      await sensorsService.acknowledgeAlert(alertId)
      setAlerts(alerts.filter((a) => a.id !== alertId))
    } catch (error) {
      console.error('Failed to acknowledge alert:', error)
    }
  }

  const handleClearAllAlerts = async () => {
    try {
      await sensorsService.clearAlerts()
      setAlerts([])
    } catch (error) {
      console.error('Failed to clear alerts:', error)
    }
  }

  const handleExportData = async () => {
    try {
      const blob = await sensorsService.exportData('csv')
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `sensor-data-${Date.now()}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to export data:', error)
    }
  }

  const getStatusColor = (status: SensorStatus): string => {
    switch (status) {
      case 'active':
        return 'bg-green-500'
      case 'idle':
        return 'bg-gray-500'
      case 'error':
        return 'bg-red-500'
      case 'disabled':
        return 'bg-gray-400'
      case 'calibrating':
        return 'bg-blue-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getAlertColor = (severity: string): string => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500/10 border-red-500 text-red-600 dark:text-red-400'
      case 'warning':
        return 'bg-yellow-500/10 border-yellow-500 text-yellow-600 dark:text-yellow-400'
      case 'info':
        return 'bg-blue-500/10 border-blue-500 text-blue-600 dark:text-blue-400'
      default:
        return 'bg-gray-500/10 border-gray-500 text-gray-600 dark:text-gray-400'
    }
  }

  const isInWarningRange = (sensor: Sensor): boolean => {
    const { value } = sensor.currentReading
    const { threshold } = sensor.config
    if (!threshold.warningMin && !threshold.warningMax) return false
    if (threshold.warningMin && value < threshold.warningMin) return true
    if (threshold.warningMax && value > threshold.warningMax) return true
    return false
  }

  const isInCriticalRange = (sensor: Sensor): boolean => {
    const { value } = sensor.currentReading
    const { threshold } = sensor.config
    if (!threshold.min && !threshold.max) return false
    if (threshold.min && value < threshold.min) return true
    if (threshold.max && value > threshold.max) return true
    return false
  }

  const getThresholdIndicator = (sensor: Sensor): JSX.Element | null => {
    if (isInCriticalRange(sensor)) {
      return (
        <div className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
          <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
          Critical
        </div>
      )
    }
    if (isInWarningRange(sensor)) {
      return (
        <div className="flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-400">
          <span className="h-2 w-2 rounded-full bg-yellow-500" />
          Warning
        </div>
      )
    }
    return (
      <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
        <span className="h-2 w-2 rounded-full bg-green-500" />
        Normal
      </div>
    )
  }

  const getSensorIcon = (type: string): string => {
    const icons: Record<string, string> = {
      temperature: '🌡️',
      humidity: '💧',
      pressure: '🌀',
      light: '💡',
      sound: '🔊',
      motion: '🏃',
      proximity: '📏',
      air_quality: '🌫️',
      voltage: '⚡',
      current: '🔌',
      custom: '📊',
    }
    return icons[type] || '📊'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading sensors...</div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold mb-2">Sensors</h1>
            <p className="text-gray-500">Monitor environmental sensors and configure alerts</p>
          </div>
          <button
            onClick={handleExportData}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Export Data
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200 dark:border-gray-800 overflow-x-auto">
          <button
            onClick={() => setActiveTab('sensors')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'sensors'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Sensors ({sensors.length})
          </button>
          <button
            onClick={() => setActiveTab('automation')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'automation'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Automation ({automationRules.length})
          </button>
          <button
            onClick={() => setActiveTab('remote')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'remote'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Remote ({remoteSensors.length})
          </button>
          <button
            onClick={() => setActiveTab('logging')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'logging'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Data Logging
          </button>
        </div>
      </div>

      {/* Alerts Banner */}
      {alerts.length > 0 && (
        <div className="mb-6 space-y-2">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`rounded-lg border p-4 ${getAlertColor(alert.severity)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm uppercase">{alert.severity}</span>
                    <span className="text-sm">•</span>
                    <span className="text-sm">{alert.sensorName}</span>
                  </div>
                  <p className="text-sm">{alert.message}</p>
                  <p className="text-xs mt-1 opacity-75">
                    {new Date(alert.timestamp).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => handleAcknowledgeAlert(alert.id)}
                  className="ml-4 text-xs px-3 py-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          ))}
          {alerts.length > 1 && (
            <button
              onClick={handleClearAllAlerts}
              className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              Clear all alerts
            </button>
          )}
        </div>
      )}

      {/* Sensor Stats Summary */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-4 bg-white/60 dark:bg-gray-950/60">
          <div className="text-sm text-gray-500 mb-1">Total Sensors</div>
          <div className="text-2xl font-bold">{sensors.length}</div>
        </div>
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-4 bg-white/60 dark:bg-gray-950/60">
          <div className="text-sm text-gray-500 mb-1">Active</div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {sensors.filter((s) => s.config.enabled && s.currentReading.status === 'active').length}
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-4 bg-white/60 dark:bg-gray-950/60">
          <div className="text-sm text-gray-500 mb-1">Active Alerts</div>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            {alerts.length}
          </div>
        </div>
      </div>

      {/* Sensors Tab Content */}
      {activeTab === 'sensors' && (
        <>
          {/* Sensors Grid */}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {sensors.map((sensor) => (
          <div
            key={sensor.id}
            className="rounded-lg border border-gray-200 dark:border-gray-800 p-5 bg-white/60 dark:bg-gray-950/60 hover:border-blue-500/50 transition-colors"
          >
            {/* Sensor Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{getSensorIcon(sensor.type)}</span>
                <div>
                  <h3 className="font-medium">{sensor.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <div
                      className={`h-2 w-2 rounded-full ${getStatusColor(sensor.currentReading.status)}`}
                    />
                    <span className="text-xs text-gray-500 capitalize">
                      {sensor.currentReading.status}
                    </span>
                  </div>
                </div>
              </div>
              <Toggle
                id={`sensor-${sensor.id}`}
                checked={sensor.config.enabled}
                onChange={(enabled) => handleToggleSensor(sensor.id, enabled)}
                label=""
              />
            </div>

            {/* Current Reading */}
            <div className="mb-4">
              <div className="text-4xl font-bold mb-2">
                {sensor.currentReading.value.toFixed(1)}
                <span className="text-lg text-gray-500 ml-2">{sensor.currentReading.unit}</span>
              </div>
              {getThresholdIndicator(sensor)}
            </div>

            {/* Threshold Visualization */}
            {sensor.config.threshold && (
              <div className="mb-4">
                <div className="text-xs text-gray-500 mb-2">Threshold Range</div>
                <div className="relative h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                  {/* Warning range */}
                  {sensor.config.threshold.warningMin !== undefined &&
                    sensor.config.threshold.warningMax !== undefined && (
                      <div
                        className="absolute h-full bg-yellow-500/30"
                        style={{
                          left: `${((sensor.config.threshold.warningMin - (sensor.config.threshold.min || 0)) / ((sensor.config.threshold.max || 100) - (sensor.config.threshold.min || 0))) * 100}%`,
                          right: `${100 - ((sensor.config.threshold.warningMax - (sensor.config.threshold.min || 0)) / ((sensor.config.threshold.max || 100) - (sensor.config.threshold.min || 0))) * 100}%`,
                        }}
                      />
                    )}
                  {/* Normal range (green) */}
                  <div
                    className="absolute h-full bg-green-500"
                    style={{
                      left: `${sensor.config.threshold.min ? ((sensor.config.threshold.min - (sensor.config.threshold.min || 0)) / ((sensor.config.threshold.max || 100) - (sensor.config.threshold.min || 0))) * 100 : 0}%`,
                      right: `${sensor.config.threshold.max ? 100 - ((sensor.config.threshold.max - (sensor.config.threshold.min || 0)) / ((sensor.config.threshold.max || 100) - (sensor.config.threshold.min || 0))) * 100 : 0}%`,
                    }}
                  />
                  {/* Current value indicator */}
                  <div
                    className="absolute top-0 w-1 h-full bg-white border border-gray-800"
                    style={{
                      left: `${((sensor.currentReading.value - (sensor.config.threshold.min || 0)) / ((sensor.config.threshold.max || 100) - (sensor.config.threshold.min || 0))) * 100}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>{sensor.config.threshold.min || 0}</span>
                  <span>{sensor.config.threshold.max || 100}</span>
                </div>
              </div>
            )}

            {/* Sensor Details */}
            <div className="text-xs text-gray-500 space-y-1">
              {sensor.pin !== undefined && <div>Pin: GPIO {sensor.pin}</div>}
              <div>Sampling: {sensor.config.samplingRate}ms</div>
              {sensor.lastCalibrated && (
                <div>
                  Last calibrated: {new Date(sensor.lastCalibrated).toLocaleDateString()}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                onClick={() => handleViewHistory(sensor)}
                className="py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-500/10 rounded-lg transition-colors"
              >
                History
              </button>
              <button
                onClick={() => handleConfigureSensor(sensor)}
                className="py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
              >
                Configure
              </button>
            </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {sensors.length === 0 && (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-lg font-medium mb-2">No Sensors Available</h3>
              <p className="text-gray-500">No sensors are configured on this device</p>
            </div>
          )}
        </>
      )}

      {/* Automation Tab Content */}
      {activeTab === 'automation' && (
        <>
          {/* Create Rule Button */}
          <div className="mb-6">
            <button
              onClick={handleCreateRule}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              + Create Automation Rule
            </button>
          </div>

          {/* Automation Rules List */}
          <div className="space-y-4">
            {automationRules.map((rule) => {
              const sensor = sensors.find((s) => s.id === rule.sensorId)
              return (
                <div
                  key={rule.id}
                  className="rounded-lg border border-gray-200 dark:border-gray-800 p-5 bg-white/60 dark:bg-gray-950/60"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium">{rule.name}</h3>
                        <Toggle
                          id={`rule-${rule.id}`}
                          checked={rule.enabled}
                          onChange={(enabled) => handleToggleRule(rule.id, enabled)}
                          label=""
                        />
                      </div>
                      <p className="text-sm text-gray-500">
                        {sensor?.name || 'Unknown Sensor'} • {rule.condition} {rule.value1}
                        {rule.value2 !== undefined && ` - ${rule.value2}`}
                        {sensor?.currentReading.unit}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditRule(rule)}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        title="Edit rule"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteRule(rule.id)}
                        className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        title="Delete rule"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">Condition:</span>
                      <span className="text-gray-600 dark:text-gray-400">
                        {rule.condition === 'above' && `Above ${rule.value1}`}
                        {rule.condition === 'below' && `Below ${rule.value1}`}
                        {rule.condition === 'between' && `Between ${rule.value1} and ${rule.value2}`}
                        {rule.condition === 'outside' && `Outside ${rule.value1}-${rule.value2}`}
                        {sensor?.currentReading.unit}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Action:</span>
                      <span className="text-gray-600 dark:text-gray-400">
                        {rule.action === 'send_alert' && `Send alert: "${rule.actionData}"`}
                        {rule.action === 'trigger_effect' && `Trigger effect: ${rule.actionData}`}
                        {rule.action === 'trigger_scene' && `Activate scene: ${rule.actionData}`}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Empty State */}
          {automationRules.length === 0 && (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">🤖</div>
              <h3 className="text-lg font-medium mb-2">No Automation Rules</h3>
              <p className="text-gray-500 mb-4">
                Create rules to automatically trigger actions based on sensor values
              </p>
              <button
                onClick={handleCreateRule}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Create Your First Rule
              </button>
            </div>
          )}
        </>
      )}

      {/* Remote Sensors Tab Content */}
      {activeTab === 'remote' && (
        <>
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Monitor sensors from paired JBoard devices
            </p>
            <button
              onClick={() => sensorsService.refreshRemoteSensors()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Refresh All
            </button>
          </div>

          {remoteSensors.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {remoteSensors.map((sensor) => (
                <div
                  key={`${sensor.deviceId}-${sensor.id}`}
                  className="rounded-lg border border-gray-200 dark:border-gray-800 p-5 bg-white/60 dark:bg-gray-950/60 hover:border-blue-500/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-2xl">{getSensorIcon(sensor.type)}</span>
                        <div>
                          <h3 className="font-medium">{sensor.name}</h3>
                          <p className="text-xs text-gray-500">{sensor.deviceName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <SignalStrength rssi={sensor.rssi} size="sm" />
                        <span className="text-xs text-gray-500">
                          {Math.floor((Date.now() - sensor.lastSync) / 1000)}s ago
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="text-4xl font-bold mb-2">
                      {sensor.currentReading.value.toFixed(1)}
                      <span className="text-lg text-gray-500 ml-2">{sensor.currentReading.unit}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <div className={`h-2 w-2 rounded-full ${getStatusColor(sensor.currentReading.status)}`} />
                      <span className="capitalize">{sensor.currentReading.status}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => sensorsService.refreshRemoteSensors(sensor.deviceId)}
                    className="w-full py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                  >
                    Refresh
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📡</div>
              <h3 className="text-lg font-medium mb-2">No Remote Sensors</h3>
              <p className="text-gray-500">
                Pair JBoard devices with sensors to monitor them remotely
              </p>
            </div>
          )}
        </>
      )}

      {/* Data Logging Tab Content */}
      {activeTab === 'logging' && loggingConfig && (
        <>
          <div className="mb-6 space-y-4">
            <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-5 bg-white/60 dark:bg-gray-950/60">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium">Logging Configuration</h3>
                <Toggle
                  id="logging-enabled"
                  checked={loggingConfig.enabled}
                  onChange={async (enabled) => {
                    await sensorsService.updateLoggingConfig({ enabled })
                    setLoggingConfig({ ...loggingConfig, enabled })
                  }}
                  label=""
                />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-gray-500 mb-1">Interval</div>
                  <div className="font-medium">{loggingConfig.interval}s</div>
                </div>
                <div>
                  <div className="text-gray-500 mb-1">Format</div>
                  <div className="font-medium uppercase">{loggingConfig.format}</div>
                </div>
                <div>
                  <div className="text-gray-500 mb-1">Max File Size</div>
                  <div className="font-medium">{loggingConfig.maxFileSize} MB</div>
                </div>
                <div>
                  <div className="text-gray-500 mb-1">Auto Rotate</div>
                  <div className="font-medium">{loggingConfig.autoRotate ? 'Yes' : 'No'}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-medium">Data Logs</h3>
            <button
              onClick={() => loadData()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Refresh
            </button>
          </div>

          {dataLogs.length > 0 ? (
            <div className="space-y-3">
              {dataLogs.map((log) => {
                const sensor = sensors.find((s) => s.id === log.sensorId)
                return (
                  <div
                    key={log.id}
                    className="rounded-lg border border-gray-200 dark:border-gray-800 p-4 bg-white/60 dark:bg-gray-950/60"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-medium">{sensor?.name || log.sensorId}</h4>
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-medium ${
                              log.status === 'active'
                                ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                                : log.status === 'stopped'
                                ? 'bg-gray-500/10 text-gray-600 dark:text-gray-400'
                                : 'bg-red-500/10 text-red-600 dark:text-red-400'
                            }`}
                          >
                            {log.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-gray-500">
                          <div>
                            <span className="font-medium">{log.recordCount}</span> records
                          </div>
                          <div>
                            <span className="font-medium">{log.fileSize}</span> MB
                          </div>
                          <div>{log.filename}</div>
                          <div>
                            {new Date(log.startTime).toLocaleDateString()} -{' '}
                            {log.endTime ? new Date(log.endTime).toLocaleDateString() : 'ongoing'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={async () => {
                            const blob = await sensorsService.downloadLog(log.id)
                            const url = URL.createObjectURL(blob)
                            const a = document.createElement('a')
                            a.href = url
                            a.download = log.filename
                            document.body.appendChild(a)
                            a.click()
                            document.body.removeChild(a)
                            URL.revokeObjectURL(url)
                          }}
                          className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                          title="Download"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                            />
                          </svg>
                        </button>
                        {log.status !== 'active' && (
                          <button
                            onClick={async () => {
                              if (confirm(`Delete log ${log.filename}?`)) {
                                await sensorsService.deleteLog(log.id)
                                setDataLogs(dataLogs.filter((l) => l.id !== log.id))
                              }
                            }}
                            className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                            title="Delete"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-lg font-medium mb-2">No Data Logs</h3>
              <p className="text-gray-500 mb-4">
                Enable logging to start recording sensor data to SD card
              </p>
            </div>
          )}
        </>
      )}

      {/* Automation Rule Modal */}
      {ruleModalOpen && (
        <AutomationRuleModal
          sensors={sensors}
          pairedDevices={pairedDevices}
          rule={selectedRule}
          onClose={() => {
            setRuleModalOpen(false)
            setSelectedRule(undefined)
          }}
          onSave={handleSaveRule}
        />
      )}

      {/* Configuration Modal */}
      {configPanelOpen && selectedSensor && (
        <SensorConfigModal
          sensor={selectedSensor}
          onClose={() => {
            setConfigPanelOpen(false)
            setSelectedSensor(null)
          }}
          onSave={handleSaveConfig}
          onCalibrate={handleCalibrate}
        />
      )}

      {/* History Panel */}
      {historyPanelOpen && selectedSensor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">{selectedSensor.name} History</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedSensor.type} • Current: {selectedSensor.currentReading.value.toFixed(1)}{selectedSensor.currentReading.unit}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setHistoryPanelOpen(false)
                    setSelectedSensor(null)
                    setSensorHistory(null)
                    setSensorStats(null)
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Time Range Selector */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex gap-2">
              {[
                { value: '1h', label: '1 Hour' },
                { value: '6h', label: '6 Hours' },
                { value: '24h', label: '24 Hours' },
              ].map((range) => (
                <button
                  key={range.value}
                  onClick={() => {
                    setTimeRange(range.value as typeof timeRange)
                    handleViewHistory(selectedSensor)
                  }}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    timeRange === range.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Statistics */}
              {sensorStats && (
                <div className="grid grid-cols-4 gap-4 mb-6">
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="text-xs text-gray-500 mb-1">Current</div>
                    <div className="text-lg font-bold">
                      {sensorStats.current.toFixed(1)}
                      <span className="text-sm text-gray-500 ml-1">{selectedSensor.currentReading.unit}</span>
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="text-xs text-gray-500 mb-1">Average</div>
                    <div className="text-lg font-bold">
                      {sensorStats.avg.toFixed(1)}
                      <span className="text-sm text-gray-500 ml-1">{selectedSensor.currentReading.unit}</span>
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="text-xs text-gray-500 mb-1">Minimum</div>
                    <div className="text-lg font-bold">
                      {sensorStats.min.toFixed(1)}
                      <span className="text-sm text-gray-500 ml-1">{selectedSensor.currentReading.unit}</span>
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="text-xs text-gray-500 mb-1">Maximum</div>
                    <div className="text-lg font-bold">
                      {sensorStats.max.toFixed(1)}
                      <span className="text-sm text-gray-500 ml-1">{selectedSensor.currentReading.unit}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Chart */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                {sensorHistory ? (
                  <div className="pl-12">
                    <LineChart
                      data={sensorHistory.data}
                      width={700}
                      height={300}
                      color="#3b82f6"
                      showGrid
                      showAxes
                      unit={selectedSensor.currentReading.unit}
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-gray-500">Loading history...</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

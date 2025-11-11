import { useState, useEffect } from 'react'
import type { Sensor, SensorConfig } from '../types/sensors'
import Toggle from './Toggle'

interface SensorConfigModalProps {
  sensor: Sensor
  onClose: () => void
  onSave: (config: Partial<SensorConfig>) => Promise<void>
  onCalibrate?: (referenceValue: number) => Promise<void>
}

export default function SensorConfigModal({
  sensor,
  onClose,
  onSave,
  onCalibrate,
}: SensorConfigModalProps) {
  const [config, setConfig] = useState<SensorConfig>(sensor.config)
  const [calibrateValue, setCalibrateValue] = useState('')
  const [saving, setSaving] = useState(false)
  const [calibrating, setCalibrating] = useState(false)
  const [activeTab, setActiveTab] = useState<'general' | 'thresholds' | 'calibration'>('general')

  useEffect(() => {
    setConfig(sensor.config)
  }, [sensor])

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(config)
      onClose()
    } catch (error) {
      console.error('Failed to save configuration:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleCalibrate = async () => {
    if (!onCalibrate || !calibrateValue) return
    setCalibrating(true)
    try {
      await onCalibrate(parseFloat(calibrateValue))
      setCalibrateValue('')
    } catch (error) {
      console.error('Failed to calibrate sensor:', error)
    } finally {
      setCalibrating(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">{sensor.name} Configuration</h2>
              <p className="text-sm text-gray-500 mt-1">
                {sensor.type} • GPIO {sensor.pin}
              </p>
            </div>
            <button
              onClick={onClose}
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

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-800 px-6">
          {[
            { id: 'general', label: 'General' },
            { id: 'thresholds', label: 'Thresholds' },
            { id: 'calibration', label: 'Calibration' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* General Tab */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="text-sm font-medium">Enable Sensor</label>
                  <Toggle
                    id="config-enabled"
                    checked={config.enabled}
                    onChange={(enabled) => setConfig({ ...config, enabled })}
                    label=""
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium block mb-2">
                  Sampling Rate (ms)
                </label>
                <input
                  type="number"
                  min="100"
                  max="10000"
                  step="100"
                  value={config.samplingRate}
                  onChange={(e) =>
                    setConfig({ ...config, samplingRate: parseInt(e.target.value) || 1000 })
                  }
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  How often to read the sensor (100-10000ms)
                </p>
              </div>

              <div>
                <label className="text-sm font-medium block mb-2">
                  Smoothing (samples)
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={config.smoothing}
                  onChange={(e) =>
                    setConfig({ ...config, smoothing: parseInt(e.target.value) || 1 })
                  }
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Number of samples to average (1-10)
                </p>
              </div>

              <div>
                <label className="text-sm font-medium block mb-2">
                  Trigger Effect (optional)
                </label>
                <input
                  type="text"
                  value={config.triggerEffect || ''}
                  onChange={(e) => setConfig({ ...config, triggerEffect: e.target.value })}
                  placeholder="Effect ID"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Effect to trigger on threshold breach
                </p>
              </div>
            </div>
          )}

          {/* Thresholds Tab */}
          {activeTab === 'thresholds' && (
            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium block mb-2">Critical Minimum</label>
                <input
                  type="number"
                  step="0.1"
                  value={config.threshold.min ?? ''}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      threshold: {
                        ...config.threshold,
                        min: e.target.value ? parseFloat(e.target.value) : undefined,
                      },
                    })
                  }
                  placeholder="Leave empty to disable"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-sm font-medium block mb-2">Warning Minimum</label>
                <input
                  type="number"
                  step="0.1"
                  value={config.threshold.warningMin ?? ''}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      threshold: {
                        ...config.threshold,
                        warningMin: e.target.value ? parseFloat(e.target.value) : undefined,
                      },
                    })
                  }
                  placeholder="Leave empty to disable"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-sm font-medium block mb-2">Warning Maximum</label>
                <input
                  type="number"
                  step="0.1"
                  value={config.threshold.warningMax ?? ''}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      threshold: {
                        ...config.threshold,
                        warningMax: e.target.value ? parseFloat(e.target.value) : undefined,
                      },
                    })
                  }
                  placeholder="Leave empty to disable"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-sm font-medium block mb-2">Critical Maximum</label>
                <input
                  type="number"
                  step="0.1"
                  value={config.threshold.max ?? ''}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      threshold: {
                        ...config.threshold,
                        max: e.target.value ? parseFloat(e.target.value) : undefined,
                      },
                    })
                  }
                  placeholder="Leave empty to disable"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  <strong>Note:</strong> Values outside critical thresholds trigger critical alerts.
                  Values outside warning thresholds trigger warning alerts.
                </p>
              </div>
            </div>
          )}

          {/* Calibration Tab */}
          {activeTab === 'calibration' && (
            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium block mb-2">Current Offset</label>
                <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                  {config.calibrationOffset.toFixed(3)}
                </div>
              </div>

              {sensor.lastCalibrated && (
                <div>
                  <label className="text-sm font-medium block mb-2">Last Calibrated</label>
                  <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                    {new Date(sensor.lastCalibrated).toLocaleString()}
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm font-medium block mb-2">
                  Reference Value
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={calibrateValue}
                  onChange={(e) => setCalibrateValue(e.target.value)}
                  placeholder="Enter known accurate value"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter a known accurate value to calibrate against
                </p>
              </div>

              <button
                onClick={handleCalibrate}
                disabled={!calibrateValue || calibrating || !onCalibrate}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {calibrating ? 'Calibrating...' : 'Calibrate Sensor'}
              </button>

              <div className="p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                <p className="text-sm text-yellow-600 dark:text-yellow-400">
                  <strong>Warning:</strong> Calibration adjusts the sensor offset to match the
                  reference value. Ensure you have an accurate reference measurement before
                  calibrating.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-800 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

import { useState } from 'react'
import type { Sensor, SensorAutomationRule } from '../types/sensors'
import type { JBoardDevice } from '../types/jboard'
import Toggle from './Toggle'

interface AutomationRuleModalProps {
  sensors: Sensor[]
  pairedDevices?: JBoardDevice[]
  rule?: SensorAutomationRule
  onClose: () => void
  onSave: (rule: Omit<SensorAutomationRule, 'id'> | SensorAutomationRule) => Promise<void>
}

export default function AutomationRuleModal({
  sensors,
  pairedDevices = [],
  rule,
  onClose,
  onSave,
}: AutomationRuleModalProps) {
  const [name, setName] = useState(rule?.name || '')
  const [sensorId, setSensorId] = useState(rule?.sensorId || sensors[0]?.id || '')
  const [condition, setCondition] = useState<'above' | 'below' | 'between' | 'outside'>(
    rule?.condition || 'above'
  )
  const [value1, setValue1] = useState(rule?.value1?.toString() || '')
  const [value2, setValue2] = useState(rule?.value2?.toString() || '')
  const [action, setAction] = useState<SensorAutomationRule['action']>(
    rule?.action || 'send_alert'
  )
  const [actionData, setActionData] = useState(rule?.actionData || '')
  const [targetDeviceId, setTargetDeviceId] = useState(rule?.targetDeviceId || '')
  const [enabled, setEnabled] = useState(rule?.enabled ?? true)
  const [saving, setSaving] = useState(false)

  const selectedSensor = sensors.find((s) => s.id === sensorId)
  const needsValue2 = condition === 'between' || condition === 'outside'
  const isRemoteAction = action.includes('remote')

  const handleSave = async () => {
    if (!name || !sensorId || !value1 || !actionData) return
    if (needsValue2 && !value2) return
    if (isRemoteAction && !targetDeviceId) return

    setSaving(true)
    try {
      const ruleData = {
        ...(rule?.id && { id: rule.id }),
        name,
        sensorId,
        condition,
        value1: parseFloat(value1),
        ...(needsValue2 && { value2: parseFloat(value2) }),
        action,
        actionData,
        ...(isRemoteAction && { targetDeviceId }),
        enabled,
      }
      await onSave(ruleData as any)
      onClose()
    } catch (error) {
      console.error('Failed to save automation rule:', error)
    } finally {
      setSaving(false)
    }
  }

  const isValid = () => {
    if (!name || !sensorId || !value1 || !actionData) return false
    if (needsValue2 && !value2) return false
    if (isRemoteAction && !targetDeviceId) return false
    return true
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">
                {rule ? 'Edit Automation Rule' : 'Create Automation Rule'}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Automatically trigger actions based on sensor values
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Rule Name */}
          <div>
            <label className="text-sm font-medium block mb-2">Rule Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., High Temperature Alert"
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Enable Rule */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Enable Rule</label>
            <Toggle
              id="rule-enabled"
              checked={enabled}
              onChange={setEnabled}
              label=""
            />
          </div>

          {/* Sensor Selection */}
          <div>
            <label className="text-sm font-medium block mb-2">Sensor</label>
            <select
              value={sensorId}
              onChange={(e) => setSensorId(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {sensors.map((sensor) => (
                <option key={sensor.id} value={sensor.id}>
                  {sensor.name} ({sensor.currentReading.value.toFixed(1)}
                  {sensor.currentReading.unit})
                </option>
              ))}
            </select>
          </div>

          {/* Condition */}
          <div>
            <label className="text-sm font-medium block mb-2">Condition</label>
            <select
              value={condition}
              onChange={(e) =>
                setCondition(e.target.value as typeof condition)
              }
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="above">Above threshold</option>
              <option value="below">Below threshold</option>
              <option value="between">Between values</option>
              <option value="outside">Outside range</option>
            </select>
          </div>

          {/* Threshold Values */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium block mb-2">
                {needsValue2 ? 'Value 1' : 'Threshold Value'}
              </label>
              <input
                type="number"
                step="0.1"
                value={value1}
                onChange={(e) => setValue1(e.target.value)}
                placeholder={selectedSensor?.currentReading.unit || 'Value'}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {needsValue2 && (
              <div>
                <label className="text-sm font-medium block mb-2">Value 2</label>
                <input
                  type="number"
                  step="0.1"
                  value={value2}
                  onChange={(e) => setValue2(e.target.value)}
                  placeholder={selectedSensor?.currentReading.unit || 'Value'}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>

          {/* Action Type */}
          <div>
            <label className="text-sm font-medium block mb-2">Action</label>
            <select
              value={action}
              onChange={(e) => {
                setAction(e.target.value as typeof action)
                // Reset target device when switching between local/remote actions
                if (!e.target.value.includes('remote')) {
                  setTargetDeviceId('')
                }
              }}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="send_alert">Send Alert</option>
              <option value="trigger_effect">Trigger Effect (Local)</option>
              <option value="trigger_scene">Trigger Scene (Local)</option>
              <option value="trigger_sequence">Trigger Sequence (Local)</option>
              {pairedDevices.length > 0 && (
                <>
                  <option value="trigger_remote_effect">Trigger Effect (Remote)</option>
                  <option value="trigger_remote_scene">Trigger Scene (Remote)</option>
                  <option value="trigger_remote_sequence">Trigger Sequence (Remote)</option>
                </>
              )}
            </select>
          </div>

          {/* Target Device (for remote actions) */}
          {isRemoteAction && (
            <div>
              <label className="text-sm font-medium block mb-2">Target Device</label>
              <select
                value={targetDeviceId}
                onChange={(e) => setTargetDeviceId(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select device...</option>
                {pairedDevices.map((device) => (
                  <option key={device.mac} value={device.mac}>
                    {device.name} ({device.ipAddress})
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Select the JBoard device to trigger the action on
              </p>
            </div>
          )}

          {/* Action Data */}
          <div>
            <label className="text-sm font-medium block mb-2">
              {action === 'send_alert'
                ? 'Alert Message'
                : action.includes('effect')
                ? 'Effect ID'
                : action.includes('sequence')
                ? 'Sequence ID'
                : 'Scene ID'}
            </label>
            <input
              type="text"
              value={actionData}
              onChange={(e) => setActionData(e.target.value)}
              placeholder={
                action === 'send_alert'
                  ? 'e.g., Temperature is too high!'
                  : action.includes('effect')
                  ? 'e.g., rainbow'
                  : action.includes('sequence')
                  ? 'e.g., seq-1'
                  : 'e.g., scene-1'
              }
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              {action === 'send_alert'
                ? 'Message to display when condition is met'
                : action.includes('effect')
                ? `ID of the effect to trigger${isRemoteAction ? ' on the remote device' : ''}`
                : action.includes('sequence')
                ? `ID of the sequence to play${isRemoteAction ? ' on the remote device' : ''}`
                : `ID of the scene to activate${isRemoteAction ? ' on the remote device' : ''}`}
            </p>
          </div>

          {/* Preview */}
          <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <div className="text-sm text-blue-600 dark:text-blue-400">
              <strong>Preview:</strong> When {selectedSensor?.name || 'sensor'} is{' '}
              {condition === 'above' && `above ${value1}${selectedSensor?.currentReading.unit || ''}`}
              {condition === 'below' && `below ${value1}${selectedSensor?.currentReading.unit || ''}`}
              {condition === 'between' &&
                `between ${value1} and ${value2}${selectedSensor?.currentReading.unit || ''}`}
              {condition === 'outside' &&
                `outside ${value1}-${value2}${selectedSensor?.currentReading.unit || ''}`}
              , {action === 'send_alert' && `send alert: "${actionData}"`}
              {action === 'trigger_effect' && `trigger effect: ${actionData}`}
              {action === 'trigger_scene' && `activate scene: ${actionData}`}
              {action === 'trigger_sequence' && `play sequence: ${actionData}`}
              {action === 'trigger_remote_effect' && 
                `trigger effect "${actionData}" on ${pairedDevices.find(d => d.mac === targetDeviceId)?.name || 'remote device'}`}
              {action === 'trigger_remote_scene' && 
                `activate scene "${actionData}" on ${pairedDevices.find(d => d.mac === targetDeviceId)?.name || 'remote device'}`}
              {action === 'trigger_remote_sequence' && 
                `play sequence "${actionData}" on ${pairedDevices.find(d => d.mac === targetDeviceId)?.name || 'remote device'}`}
            </div>
          </div>
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
            disabled={!isValid() || saving}
            className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : rule ? 'Update Rule' : 'Create Rule'}
          </button>
        </div>
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { 
  getBoardInfo, 
  getPixelConfig, 
  updateOutput,
  allOff
} from '../services/pixelsService'
import {
  BoardInfo,
  PixelOutputConfig,
  PixelOutput,
  PixelType,
  ColorOrder,
  checkPowerLimits,
  estimateCurrentDraw,
  PIXEL_SPECS
} from '../types/pixels'
import { effectsService } from '../services/effectsService'
import { Effect, EffectParameter } from '../types/effects'
import Toggle from '../components/Toggle'

export default function Pixels() {
  const [boardInfo, setBoardInfo] = useState<BoardInfo | null>(null)
  const [config, setConfig] = useState<PixelOutputConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingOutput, setEditingOutput] = useState<string | null>(null)
  const [testingOutput, setTestingOutput] = useState<string | null>(null)
  
  // Effects integration for testing
  const [effects, setEffects] = useState<Effect[]>([])
  const [selectedEffect, setSelectedEffect] = useState<Effect | null>(null)
  const [effectParams, setEffectParams] = useState<Record<string, any>>({})

  useEffect(() => {
    loadData()
    loadEffects()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [board, pixelConfig] = await Promise.all([
        getBoardInfo(),
        getPixelConfig()
      ])
      setBoardInfo(board)
      setConfig(pixelConfig)
    } catch (error) {
      console.error('Failed to load pixel configuration:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadEffects = async () => {
    try {
      const effectsList = await effectsService.getEffects()
      setEffects(effectsList)
      // Default to first effect
      if (effectsList.length > 0) {
        const defaultEffect = effectsList[0]
        setSelectedEffect(defaultEffect)
        // Initialize params with default values
        const params: Record<string, any> = {}
        defaultEffect.parameters.forEach(param => {
          params[param.id] = param.value
        })
        setEffectParams(params)
      }
    } catch (error) {
      console.error('Failed to load effects:', error)
    }
  }

  const handleEffectChange = (effectId: string) => {
    const effect = effects.find(e => e.id === effectId)
    if (effect) {
      setSelectedEffect(effect)
      // Initialize params with default values
      const params: Record<string, any> = {}
      effect.parameters.forEach(param => {
        params[param.id] = param.value
      })
      setEffectParams(params)
    }
  }

  const handleParamChange = (paramId: string, value: any) => {
    setEffectParams(prev => ({ ...prev, [paramId]: value }))
  }

  const handleToggleOutput = async (id: string, enabled: boolean) => {
    if (!config) return
    
    try {
      const updated = await updateOutput(id, { enabled })
      setConfig({
        ...config,
        outputs: config.outputs.map(o => 
          o.id === id ? { ...o, ...updated } : o
        )
      })
    } catch (error) {
      console.error('Failed to update output:', error)
    }
  }

  const handleUpdateOutput = async (id: string, update: Partial<PixelOutput>) => {
    if (!config) return
    
    try {
      const updated = await updateOutput(id, update)
      setConfig({
        ...config,
        outputs: config.outputs.map(o => 
          o.id === id ? { ...o, ...updated } : o
        )
      })
      setEditingOutput(null)
    } catch (error) {
      console.error('Failed to update output:', error)
    }
  }

  const handleTestOutput = async (id: string) => {
    if (!selectedEffect) return

    try {
      await effectsService.applyEffect(selectedEffect.id, { 
        ...effectParams,
        outputId: id  // Specify which output to test
      })
      setTestingOutput(id)
    } catch (error) {
      console.error('Failed to start test:', error)
    }
  }

  const handleStopTest = async (_id: string) => {
    try {
      await allOff()
      setTestingOutput(null)
    } catch (error) {
      console.error('Failed to stop test:', error)
    }
  }

  const handleTestAll = async () => {
    if (!selectedEffect) return

    try {
      await effectsService.applyEffect(selectedEffect.id, effectParams)
      setTestingOutput('all')
    } catch (error) {
      console.error('Failed to test all outputs:', error)
    }
  }

  const handleAllOff = async () => {
    try {
      await allOff()
      setTestingOutput(null)
    } catch (error) {
      console.error('Failed to turn off outputs:', error)
    }
  }

  if (loading || !boardInfo || !config) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-1/4"></div>
          <div className="h-24 bg-gray-200 dark:bg-gray-800 rounded"></div>
          <div className="h-48 bg-gray-200 dark:bg-gray-800 rounded"></div>
        </div>
      </div>
    )
  }

  const warnings = checkPowerLimits(config)
  const totalEnabledPixels = config.outputs
    .filter(o => o.enabled)
    .reduce((sum, o) => sum + o.pixelCount, 0)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold mb-2">Pixel Outputs</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Configure addressable LED pixel outputs
        </p>
      </div>

      {/* Board Info Card */}
      <div className="card p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold mb-1">Board Information</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {boardInfo.variant} • Firmware v{boardInfo.firmwareVersion}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-brand-600">
              {boardInfo.outputCount}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Outputs
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200 dark:border-gray-800">
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Pixels</div>
            <div className="text-lg font-semibold">{totalEnabledPixels}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Max Per Output</div>
            <div className="text-lg font-semibold">{boardInfo.maxPixelsPerOutput}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Estimated Power</div>
            <div className="text-lg font-semibold">{config.estimatedPower.toFixed(1)}W</div>
          </div>
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Power Limit</div>
            <div className="text-lg font-semibold">{config.powerLimit}W</div>
          </div>
        </div>

        {/* Power Warnings */}
        {warnings.length > 0 && (
          <div className="space-y-2 pt-4 border-t border-gray-200 dark:border-gray-800">
            {warnings.map((warning, index) => (
              <div
                key={index}
                className={`p-3 rounded text-sm ${
                  warning.level === 'critical'
                    ? 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200'
                    : 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200'
                }`}
              >
                {warning.message}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Test Panel with Effects */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Testing Tools</h2>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Using Effects System
          </span>
        </div>
        
        {/* Effect Selection */}
        <div>
          <label className="block text-sm font-medium mb-2">Select Effect</label>
          <select
            value={selectedEffect?.id || ''}
            onChange={(e) => handleEffectChange(e.target.value)}
            className="input w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700 rounded-lg"
          >
            {effects.map(effect => (
              <option key={effect.id} value={effect.id}>
                {effect.icon} {effect.name}
              </option>
            ))}
          </select>
          {selectedEffect && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {selectedEffect.description}
            </p>
          )}
        </div>

        {/* Dynamic Effect Parameters */}
        {selectedEffect && selectedEffect.parameters.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {selectedEffect.parameters.map(param => (
              <EffectParameterControl
                key={param.id}
                parameter={param}
                value={effectParams[param.id]}
                onChange={(value) => handleParamChange(param.id, value)}
                colorCount={effectParams.colorCount}
                sparkleColorCount={effectParams.sparkleColorCount}
              />
            ))}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <button
            onClick={handleTestAll}
            disabled={testingOutput === 'all' || !selectedEffect}
            className="btn btn-primary"
          >
            {testingOutput === 'all' ? 'Testing All...' : 'Test All Outputs'}
          </button>
          <button
            onClick={handleAllOff}
            className="btn btn-secondary"
          >
            Turn All Off
          </button>
        </div>
      </div>

      {/* Output Cards */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Output Configuration</h2>
        
        {config.outputs.map((output) => (
          <OutputCard
            key={output.id}
            output={output}
            boardInfo={boardInfo}
            isEditing={editingOutput === output.id}
            isTesting={testingOutput === output.id || testingOutput === 'all'}
            onToggle={(enabled) => handleToggleOutput(output.id, enabled)}
            onEdit={() => setEditingOutput(output.id)}
            onSave={(update) => handleUpdateOutput(output.id, update)}
            onCancel={() => setEditingOutput(null)}
            onTest={() => handleTestOutput(output.id)}
            onStopTest={() => handleStopTest(output.id)}
          />
        ))}
      </div>
    </div>
  )
}

interface OutputCardProps {
  output: PixelOutput
  boardInfo: BoardInfo
  isEditing: boolean
  isTesting: boolean
  onToggle: (enabled: boolean) => void
  onEdit: () => void
  onSave: (update: Partial<PixelOutput>) => void
  onCancel: () => void
  onTest: () => void
  onStopTest: () => void
}

interface EffectParameterControlProps {
  parameter: EffectParameter
  value: any
  onChange: (value: any) => void
  colorCount?: string
  sparkleColorCount?: string
}

function EffectParameterControl({ 
  parameter, 
  value, 
  onChange,
  colorCount,
  sparkleColorCount
}: EffectParameterControlProps) {
  // Hide color parameters beyond the selected count
  if (parameter.id.startsWith('color') && colorCount) {
    const colorNum = parseInt(parameter.id.replace('color', ''))
    if (!isNaN(colorNum) && colorNum > parseInt(colorCount)) {
      return null
    }
  }
  if (parameter.id.startsWith('sparkleColor') && sparkleColorCount) {
    const colorNum = parseInt(parameter.id.replace('sparkleColor', ''))
    if (!isNaN(colorNum) && colorNum > parseInt(sparkleColorCount)) {
      return null
    }
  }

  switch (parameter.type) {
    case 'color':
      return (
        <div>
          <label className="block text-sm font-medium mb-2">{parameter.name}</label>
          <div className="flex gap-2">
            <input
              type="color"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="h-10 w-20 rounded border border-gray-300 dark:border-gray-700"
            />
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="input flex-1 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700 rounded-lg"
            />
          </div>
        </div>
      )

    case 'slider':
      return (
        <div>
          <label className="block text-sm font-medium mb-2">
            {parameter.name}: {value}{parameter.unit || ''}
          </label>
          <input
            type="range"
            min={parameter.min || 0}
            max={parameter.max || 100}
            step={parameter.step || 1}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full"
          />
        </div>
      )

    case 'toggle':
      return (
        <div className="flex items-center gap-2">
          <Toggle
            id={parameter.id}
            checked={value}
            onChange={onChange}
            label={parameter.name}
          />
        </div>
      )

    case 'select':
      return (
        <div>
          <label className="block text-sm font-medium mb-2">{parameter.name}</label>
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="input w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700 rounded-lg"
          >
            {parameter.options?.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      )

    case 'number':
      return (
        <div>
          <label className="block text-sm font-medium mb-2">{parameter.name}</label>
          <input
            type="number"
            min={parameter.min}
            max={parameter.max}
            step={parameter.step || 1}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="input w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700 rounded-lg"
          />
        </div>
      )

    default:
      return null
  }
}

function OutputCard({
  output,
  boardInfo,
  isEditing,
  isTesting,
  onToggle,
  onEdit,
  onSave,
  onCancel,
  onTest,
  onStopTest
}: OutputCardProps) {
  const [formData, setFormData] = useState(output)

  useEffect(() => {
    setFormData(output)
  }, [output])

  const handleSave = () => {
    onSave({
      name: formData.name,
      gpio: formData.gpio,
      pixelCount: formData.pixelCount,
      pixelType: formData.pixelType,
      colorOrder: formData.colorOrder,
      maxCurrent: formData.maxCurrent,
      voltage: formData.voltage
    })
  }

  const currentDraw = estimateCurrentDraw(output)
  const spec = PIXEL_SPECS[output.pixelType]

  if (isEditing) {
    return (
      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Edit Output {output.number}</h3>
          <div className="flex gap-2">
            <button onClick={handleSave} className="btn btn-primary btn-sm">
              Save
            </button>
            <button onClick={onCancel} className="btn btn-secondary btn-sm">
              Cancel
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Output Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">GPIO Pin</label>
            <select
              value={formData.gpio}
              onChange={(e) => setFormData({ ...formData, gpio: Number(e.target.value) })}
              className="input w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700 rounded-lg"
            >
              {boardInfo.availableGPIOs.map(gpio => (
                <option key={gpio} value={gpio}>GPIO {gpio}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Pixel Count</label>
            <input
              type="number"
              min="1"
              max={boardInfo.maxPixelsPerOutput}
              value={formData.pixelCount}
              onChange={(e) => setFormData({ ...formData, pixelCount: Number(e.target.value) })}
              className="input w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Pixel Type</label>
            <select
              value={formData.pixelType}
              onChange={(e) => setFormData({ ...formData, pixelType: e.target.value as PixelType })}
              className="input w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700 rounded-lg"
            >
              {Object.values(PixelType).map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Color Order</label>
            <select
              value={formData.colorOrder}
              onChange={(e) => setFormData({ ...formData, colorOrder: e.target.value as ColorOrder })}
              className="input w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700 rounded-lg"
            >
              {Object.values(ColorOrder).map(order => (
                <option key={order} value={order}>{order}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Supply Voltage</label>
            <select
              value={formData.voltage}
              onChange={(e) => setFormData({ ...formData, voltage: Number(e.target.value) })}
              className="input w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700 rounded-lg"
            >
              <option value={5}>5V</option>
              <option value={12}>12V</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Max Current (mA)</label>
            <input
              type="number"
              min="100"
              max="10000"
              step="100"
              value={formData.maxCurrent}
              onChange={(e) => setFormData({ ...formData, maxCurrent: Number(e.target.value) })}
              className="input w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700 rounded-lg"
            />
          </div>
        </div>

        <div className="p-3 bg-gray-100 dark:bg-gray-900 rounded text-sm">
          <div className="font-medium mb-1">{PIXEL_SPECS[formData.pixelType].notes}</div>
          <div className="text-gray-600 dark:text-gray-400">
            Typical: {spec.voltage}V, {spec.currentPerPixel}mA per pixel at full white
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-semibold text-lg">
              Output {output.number}: {output.name}
            </h3>
            <Toggle
              id={`output-${output.id}`}
              checked={output.enabled}
              onChange={onToggle}
              label={output.enabled ? 'Enabled' : 'Disabled'}
            />
            {output.enabled && (
              <span className="text-xs px-2 py-1 rounded bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200">
                Active
              </span>
            )}
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-gray-600 dark:text-gray-400">Pixels</div>
              <div className="font-medium">{output.pixelCount}</div>
            </div>
            <div>
              <div className="text-gray-600 dark:text-gray-400">Type</div>
              <div className="font-medium">{output.pixelType}</div>
            </div>
            <div>
              <div className="text-gray-600 dark:text-gray-400">Color Order</div>
              <div className="font-medium">{output.colorOrder}</div>
            </div>
            <div>
              <div className="text-gray-600 dark:text-gray-400">GPIO</div>
              <div className="font-medium">Pin {output.gpio}</div>
            </div>
            <div>
              <div className="text-gray-600 dark:text-gray-400">Voltage</div>
              <div className="font-medium">{output.voltage}V</div>
            </div>
            <div>
              <div className="text-gray-600 dark:text-gray-400">Est. Current</div>
              <div className="font-medium">{currentDraw.toFixed(0)}mA</div>
            </div>
            <div>
              <div className="text-gray-600 dark:text-gray-400">Max Current</div>
              <div className="font-medium">{output.maxCurrent}mA</div>
            </div>
            <div>
              <div className="text-gray-600 dark:text-gray-400">Status</div>
              <div className="font-medium capitalize">{output.status}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={onEdit} className="btn btn-secondary btn-sm">
          Configure
        </button>
        {output.enabled && (
          <>
            {isTesting ? (
              <button onClick={onStopTest} className="btn btn-secondary btn-sm">
                Stop Test
              </button>
            ) : (
              <button onClick={onTest} className="btn btn-primary btn-sm">
                Test
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

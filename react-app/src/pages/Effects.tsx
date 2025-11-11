import { useState, useEffect } from 'react';
import { effectsService } from '../services/effectsService';
import type { Effect, LEDState, EffectParameter, EffectPreset } from '../types/effects';
import ConfirmDialog from '../components/ConfirmDialog';

export default function Effects() {
  const [effects, setEffects] = useState<Effect[]>([]);
  const [ledState, setLedState] = useState<LEDState | null>(null);
  const [presets, setPresets] = useState<EffectPreset[]>([]);
  const [selectedEffect, setSelectedEffect] = useState<Effect | null>(null);
  const [parameters, setParameters] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showPresetModal, setShowPresetModal] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [savingPreset, setSavingPreset] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [effectsData, stateData, presetsData] = await Promise.all([
        effectsService.getEffects(),
        effectsService.getLEDState(),
        effectsService.getPresets(),
      ]);
      setEffects(effectsData);
      setLedState(stateData);
      setPresets(presetsData);

      // Auto-select active effect
      if (stateData.activeEffect) {
        const active = effectsData.find((e) => e.id === stateData.activeEffect);
        if (active) {
          setSelectedEffect(active);
          setParameters(stateData.activeParameters || {});
        }
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load effects' });
    } finally {
      setLoading(false);
    }
  };

  const handlePowerToggle = async () => {
    if (!ledState) return;
    try {
      const result = await effectsService.setPower(!ledState.power);
      if (result.success) {
        setLedState({ ...ledState, power: !ledState.power });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to toggle power' });
    }
  };

  const handleBrightnessChange = async (value: number) => {
    if (!ledState) return;
    try {
      await effectsService.setBrightness(value);
      setLedState({ ...ledState, brightness: value });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to set brightness' });
    }
  };

  const handleEffectSelect = (effect: Effect) => {
    setSelectedEffect(effect);
    // Initialize parameters with default values
    const defaultParams: Record<string, any> = {};
    effect.parameters.forEach((param) => {
      defaultParams[param.id] = param.value;
    });
    setParameters(defaultParams);
    setMessage(null);
  };

  const handleParameterChange = (paramId: string, value: any) => {
    setParameters((prev) => ({ ...prev, [paramId]: value }));
  };

  const handleApply = async () => {
    if (!selectedEffect) return;

    setApplying(true);
    setMessage(null);
    try {
      const result = await effectsService.applyEffect(selectedEffect.id, parameters);
      if (result.success) {
        setMessage({ type: 'success', text: `${selectedEffect.name} applied!` });
        if (ledState) {
          setLedState({
            ...ledState,
            activeEffect: selectedEffect.id,
            activeParameters: parameters,
          });
        }
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to apply effect' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to apply effect' });
    } finally {
      setApplying(false);
    }
  };

  const handleSavePreset = async () => {
    if (!selectedEffect || !presetName.trim()) return;

    setSavingPreset(true);
    try {
      const result = await effectsService.savePreset(presetName.trim(), selectedEffect.id, parameters);
      if (result.success && result.preset) {
        setPresets([...presets, result.preset]);
        setMessage({ type: 'success', text: 'Preset saved!' });
        setShowPresetModal(false);
        setPresetName('');
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to save preset' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save preset' });
    } finally {
      setSavingPreset(false);
    }
  };

  const handleLoadPreset = (preset: EffectPreset) => {
    const effect = effects.find((e) => e.id === preset.effectId);
    if (effect) {
      setSelectedEffect(effect);
      setParameters(preset.parameters);
      setMessage({ type: 'success', text: `Loaded preset: ${preset.name}` });
    }
  };

  const handleDeletePreset = (presetId: string) => {
    setConfirmDelete(presetId);
  };

  const performDeletePreset = async (presetId: string) => {
    try {
      const result = await effectsService.deletePreset(presetId);
      if (result.success) {
        setPresets(presets.filter((p) => p.id !== presetId));
        setMessage({ type: 'success', text: 'Preset deleted' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete preset' });
    }
  };

  const renderParameterControl = (param: EffectParameter, effect: Effect) => {
    // Special handling for Color Flow effect
    if (effect.id === 'gradient') {
      // Skip individual color parameters - we'll render them specially
      if (param.id.startsWith('color') && param.id !== 'colorCount') {
        return null;
      }
    }

    // Special handling for Sparkle effect
    if (effect.id === 'sparkle') {
      // Skip individual sparkle color parameters - we'll render them specially
      if (param.id.startsWith('sparkleColor') && param.id !== 'sparkleColorCount') {
        return null;
      }
    }

    // Special handling for Bars effect
    if (effect.id === 'bars') {
      // Skip individual color parameters - we'll render them specially
      if (param.id.startsWith('color') && param.id !== 'colorCount') {
        return null;
      }
    }

    switch (param.type) {
      case 'slider':
        return (
          <div key={param.id}>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">{param.name}</label>
              <span className="text-sm text-gray-500">
                {parameters[param.id] ?? param.value}
                {param.unit}
              </span>
            </div>
            <input
              type="range"
              min={param.min}
              max={param.max}
              step={param.step}
              value={parameters[param.id] ?? param.value}
              onChange={(e) => handleParameterChange(param.id, Number(e.target.value))}
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-brand-600"
            />
          </div>
        );

      case 'color':
        return (
          <div key={param.id}>
            <label className="block text-sm font-medium mb-2">{param.name}</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={parameters[param.id] ?? param.value}
                onChange={(e) => handleParameterChange(param.id, e.target.value)}
                className="w-12 h-12 rounded border border-gray-300 dark:border-gray-700 cursor-pointer"
              />
              <input
                type="text"
                value={parameters[param.id] ?? param.value}
                onChange={(e) => handleParameterChange(param.id, e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 font-mono text-sm"
                placeholder="#000000"
              />
            </div>
          </div>
        );

      case 'toggle':
        return (
          <div key={param.id} className="flex items-center justify-between">
            <label className="text-sm font-medium">{param.name}</label>
            <button
              onClick={() => handleParameterChange(param.id, !(parameters[param.id] ?? param.value))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                parameters[param.id] ?? param.value ? 'bg-brand-600' : 'bg-gray-300 dark:bg-gray-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  parameters[param.id] ?? param.value ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        );

      case 'select':
        return (
          <div key={param.id}>
            <label className="block text-sm font-medium mb-2">{param.name}</label>
            <select
              value={parameters[param.id] ?? param.value}
              onChange={(e) => handleParameterChange(param.id, e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
            >
              {param.options?.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        );

      case 'number':
        return (
          <div key={param.id}>
            <label className="block text-sm font-medium mb-2">{param.name}</label>
            <input
              type="number"
              min={param.min}
              max={param.max}
              step={param.step}
              value={parameters[param.id] ?? param.value}
              onChange={(e) => handleParameterChange(param.id, Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
            />
          </div>
        );

      default:
        return null;
    }
  };

  const categories = ['All', ...Array.from(new Set(effects.map((e) => e.category)))];
  const filteredEffects =
    categoryFilter === 'All' ? effects : effects.filter((e) => e.category === categoryFilter);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading effects...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-semibold mb-2">LED Effects</h1>
        <p className="text-gray-500">Choose and customize LED lighting effects</p>
      </div>

      {message && (
        <div
          className={`mb-4 p-3 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
              : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Power & Brightness Controls */}
      {ledState && (
        <div className="mb-4 rounded-lg border border-gray-200 dark:border-gray-800 p-4 bg-white/60 dark:bg-gray-950/60">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={handlePowerToggle}
                className={`p-3 rounded-lg transition-colors ${
                  ledState.power
                    ? 'bg-brand-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v10M18.36 6.64a9 9 0 1 1-12.73 0" />
                </svg>
              </button>
              <div>
                <div className="font-medium">Power</div>
                <div className="text-sm text-gray-500">{ledState.power ? 'On' : 'Off'}</div>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Brightness</label>
              <span className="text-sm text-gray-500">{ledState.brightness}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={ledState.brightness}
              onChange={(e) => handleBrightnessChange(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-brand-600"
            />
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Effects Grid - Takes 2 columns on large screens */}
        <div className="lg:col-span-2 space-y-4">
          {/* Category Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
                  categoryFilter === cat
                    ? 'bg-brand-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Effects Grid */}
          <div className="grid sm:grid-cols-2 gap-3">
            {filteredEffects.map((effect) => {
              const isActive = ledState?.activeEffect === effect.id;
              const isSelected = selectedEffect?.id === effect.id;

              return (
                <button
                  key={effect.id}
                  onClick={() => handleEffectSelect(effect)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    isSelected
                      ? 'border-brand-600 bg-brand-50 dark:bg-brand-900/20'
                      : 'border-gray-200 dark:border-gray-800 hover:border-brand-400 bg-white dark:bg-gray-800/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-3xl">{effect.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium">{effect.name}</h3>
                        {isActive && (
                          <span className="text-xs px-2 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{effect.description}</p>
                      <div className="mt-2 text-xs text-gray-500">{effect.category}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Presets */}
          {presets.length > 0 && (
            <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-4 bg-white/60 dark:bg-gray-950/60">
              <h3 className="font-medium mb-3">Saved Presets</h3>
              <div className="space-y-2">
                {presets.map((preset) => (
                  <div
                    key={preset.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-sm">{preset.name}</div>
                      <div className="text-xs text-gray-500">
                        {effects.find((e) => e.id === preset.effectId)?.name}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleLoadPreset(preset)}
                        className="px-3 py-1 text-xs rounded bg-brand-600 text-white hover:bg-brand-700"
                      >
                        Load
                      </button>
                      <button
                        onClick={() => handleDeletePreset(preset.id)}
                        className="px-3 py-1 text-xs rounded bg-red-600 text-white hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Parameters Panel - Takes 1 column */}
        <div className="lg:col-span-1">
          {selectedEffect ? (
            <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-4 bg-white/60 dark:bg-gray-950/60 sticky top-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="text-3xl">{selectedEffect.icon}</div>
                <div>
                  <h2 className="text-lg font-medium">{selectedEffect.name}</h2>
                  <p className="text-sm text-gray-500">{selectedEffect.category}</p>
                </div>
              </div>

              <div className="space-y-4 mb-4">
                {/* Special rendering for Color Flow effect */}
                {selectedEffect.id === 'gradient' ? (
                  <>
                    {/* Color Count Selector */}
                    {selectedEffect.parameters
                      .filter((p) => p.id === 'colorCount')
                      .map((param) => renderParameterControl(param, selectedEffect))}
                    
                    {/* Dynamic Color Pickers */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">Colors</label>
                        {Number(parameters['colorCount'] ?? 2) < 8 && (
                          <button
                            onClick={() => {
                              const current = Number(parameters['colorCount'] ?? 2);
                              handleParameterChange('colorCount', String(current + 1));
                            }}
                            className="text-xs px-2 py-1 rounded bg-brand-600 text-white hover:bg-brand-700"
                          >
                            + Add Color
                          </button>
                        )}
                      </div>
                      {selectedEffect.parameters
                        .filter((p) => p.id.startsWith('color') && p.id !== 'colorCount')
                        .slice(0, Number(parameters['colorCount'] ?? 2))
                        .map((param, index) => (
                          <div key={param.id}>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                {param.name}
                              </label>
                              {Number(parameters['colorCount'] ?? 2) > 2 && (
                                <button
                                  onClick={() => {
                                    const currentCount = Number(parameters['colorCount'] ?? 2);
                                    const colorIndex = index + 1; // color1, color2, etc.
                                    
                                    // Shift colors after the removed one
                                    const newParams = { ...parameters };
                                    for (let i = colorIndex; i < currentCount; i++) {
                                      newParams[`color${i}`] = parameters[`color${i + 1}`];
                                    }
                                    
                                    // Update all parameters and decrement count
                                    Object.keys(newParams).forEach(key => handleParameterChange(key, newParams[key]));
                                    handleParameterChange('colorCount', String(currentCount - 1));
                                  }}
                                  className="text-xs px-1.5 py-0.5 rounded bg-red-600 text-white hover:bg-red-700"
                                  title="Remove color"
                                >
                                  ×
                                </button>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <input
                                type="color"
                                value={parameters[param.id] ?? param.value}
                                onChange={(e) => handleParameterChange(param.id, e.target.value)}
                                className="w-12 h-10 rounded border border-gray-300 dark:border-gray-700 cursor-pointer"
                              />
                              <input
                                type="text"
                                value={parameters[param.id] ?? param.value}
                                onChange={(e) => handleParameterChange(param.id, e.target.value)}
                                className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 font-mono text-sm"
                                placeholder="#000000"
                              />
                            </div>
                          </div>
                        ))}
                    </div>
                    
                    {/* Other parameters (animate, speed) */}
                    {selectedEffect.parameters
                      .filter((p) => p.id !== 'colorCount' && !p.id.startsWith('color'))
                      .map((param) => renderParameterControl(param, selectedEffect))}
                  </>
                ) : selectedEffect.id === 'sparkle' ? (
                  <>
                    {/* Background Color */}
                    {selectedEffect.parameters
                      .filter((p) => p.id === 'backgroundColor')
                      .map((param) => renderParameterControl(param, selectedEffect))}
                    
                    {/* Sparkle Color Count Selector */}
                    {selectedEffect.parameters
                      .filter((p) => p.id === 'sparkleColorCount')
                      .map((param) => renderParameterControl(param, selectedEffect))}
                    
                    {/* Dynamic Sparkle Color Pickers */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">Sparkle Colors</label>
                        {Number(parameters['sparkleColorCount'] ?? 1) < 5 && (
                          <button
                            onClick={() => {
                              const current = Number(parameters['sparkleColorCount'] ?? 1);
                              handleParameterChange('sparkleColorCount', String(current + 1));
                            }}
                            className="text-xs px-2 py-1 rounded bg-brand-600 text-white hover:bg-brand-700"
                          >
                            + Add Color
                          </button>
                        )}
                      </div>
                      {selectedEffect.parameters
                        .filter((p) => p.id.startsWith('sparkleColor') && p.id !== 'sparkleColorCount')
                        .slice(0, Number(parameters['sparkleColorCount'] ?? 1))
                        .map((param, index) => (
                          <div key={param.id}>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                {param.name}
                              </label>
                              {Number(parameters['sparkleColorCount'] ?? 1) > 1 && (
                                <button
                                  onClick={() => {
                                    const currentCount = Number(parameters['sparkleColorCount'] ?? 1);
                                    const colorIndex = index + 1; // sparkleColor1, sparkleColor2, etc.
                                    
                                    // Shift colors after the removed one
                                    const newParams = { ...parameters };
                                    for (let i = colorIndex; i < currentCount; i++) {
                                      newParams[`sparkleColor${i}`] = parameters[`sparkleColor${i + 1}`];
                                    }
                                    
                                    // Update all parameters and decrement count
                                    Object.keys(newParams).forEach(key => handleParameterChange(key, newParams[key]));
                                    handleParameterChange('sparkleColorCount', String(currentCount - 1));
                                  }}
                                  className="text-xs px-1.5 py-0.5 rounded bg-red-600 text-white hover:bg-red-700"
                                  title="Remove color"
                                >
                                  ×
                                </button>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <input
                                type="color"
                                value={parameters[param.id] ?? param.value}
                                onChange={(e) => handleParameterChange(param.id, e.target.value)}
                                className="w-12 h-10 rounded border border-gray-300 dark:border-gray-700 cursor-pointer"
                              />
                              <input
                                type="text"
                                value={parameters[param.id] ?? param.value}
                                onChange={(e) => handleParameterChange(param.id, e.target.value)}
                                className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 font-mono text-sm"
                                placeholder="#000000"
                              />
                            </div>
                          </div>
                        ))}
                    </div>
                    
                    {/* Other parameters (density, speed) */}
                    {selectedEffect.parameters
                      .filter((p) => p.id !== 'backgroundColor' && p.id !== 'sparkleColorCount' && !p.id.startsWith('sparkleColor'))
                      .map((param) => renderParameterControl(param, selectedEffect))}
                  </>
                ) : selectedEffect.id === 'bars' ? (
                  <>
                    {/* Color Count Selector */}
                    {selectedEffect.parameters
                      .filter((p) => p.id === 'colorCount')
                      .map((param) => renderParameterControl(param, selectedEffect))}
                    
                    {/* Dynamic Bar Color Pickers */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">Bar Colors</label>
                        {Number(parameters['colorCount'] ?? 2) < 8 && (
                          <button
                            onClick={() => {
                              const current = Number(parameters['colorCount'] ?? 2);
                              handleParameterChange('colorCount', String(current + 1));
                            }}
                            className="text-xs px-2 py-1 rounded bg-brand-600 text-white hover:bg-brand-700"
                          >
                            + Add Color
                          </button>
                        )}
                      </div>
                      {selectedEffect.parameters
                        .filter((p) => p.id.startsWith('color') && p.id !== 'colorCount')
                        .slice(0, Number(parameters['colorCount'] ?? 2))
                        .map((param, index) => (
                          <div key={param.id}>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                {param.name}
                              </label>
                              {Number(parameters['colorCount'] ?? 2) > 2 && (
                                <button
                                  onClick={() => {
                                    const currentCount = Number(parameters['colorCount'] ?? 2);
                                    const colorIndex = index + 1; // color1, color2, etc.
                                    
                                    // Shift colors after the removed one
                                    const newParams = { ...parameters };
                                    for (let i = colorIndex; i < currentCount; i++) {
                                      newParams[`color${i}`] = parameters[`color${i + 1}`];
                                    }
                                    
                                    // Update all parameters and decrement count
                                    Object.keys(newParams).forEach(key => handleParameterChange(key, newParams[key]));
                                    handleParameterChange('colorCount', String(currentCount - 1));
                                  }}
                                  className="text-xs px-1.5 py-0.5 rounded bg-red-600 text-white hover:bg-red-700"
                                  title="Remove color"
                                >
                                  ×
                                </button>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <input
                                type="color"
                                value={parameters[param.id] ?? param.value}
                                onChange={(e) => handleParameterChange(param.id, e.target.value)}
                                className="w-12 h-10 rounded border border-gray-300 dark:border-gray-700 cursor-pointer"
                              />
                              <input
                                type="text"
                                value={parameters[param.id] ?? param.value}
                                onChange={(e) => handleParameterChange(param.id, e.target.value)}
                                className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 font-mono text-sm"
                                placeholder="#000000"
                              />
                            </div>
                          </div>
                        ))}
                    </div>
                    
                    {/* Other parameters (direction, width, spacing, speed) */}
                    {selectedEffect.parameters
                      .filter((p) => p.id !== 'colorCount' && !p.id.startsWith('color'))
                      .map((param) => renderParameterControl(param, selectedEffect))}
                  </>
                ) : (
                  /* Standard parameter rendering for other effects */
                  selectedEffect.parameters.map((param) => renderParameterControl(param, selectedEffect))
                )}
              </div>

              <div className="space-y-2">
                <button
                  onClick={handleApply}
                  disabled={applying}
                  className="w-full px-4 py-2 rounded-lg bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50 font-medium"
                >
                  {applying ? 'Applying...' : 'Apply Effect'}
                </button>
                <button
                  onClick={() => setShowPresetModal(true)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  Save as Preset
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-8 bg-white/60 dark:bg-gray-950/60 text-center text-gray-500">
              <svg
                className="mx-auto h-12 w-12 mb-3 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
                />
              </svg>
              <p>Select an effect to customize</p>
            </div>
          )}
        </div>
      </div>

      {/* Save Preset Modal */}
      {showPresetModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-semibold mb-4">Save Preset</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Preset Name</label>
              <input
                type="text"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                placeholder="My Custom Effect"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
                maxLength={32}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowPresetModal(false);
                  setPresetName('');
                }}
                disabled={savingPreset}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePreset}
                disabled={savingPreset || !presetName.trim()}
                className="flex-1 px-4 py-2 rounded-lg bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50"
              >
                {savingPreset ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {confirmDelete && (
        <ConfirmDialog
          title="Delete Preset"
          message="Delete this preset?"
          onConfirm={() => {
            performDeletePreset(confirmDelete);
            setConfirmDelete(null);
          }}
          onCancel={() => setConfirmDelete(null)}
          dangerous={true}
        />
      )}
    </div>
  );
}

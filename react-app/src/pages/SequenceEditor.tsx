import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { sequenceService } from '../services/sequenceService';
import { effectsService } from '../services/effectsService';
import type { EffectSequence, EffectSequenceStep, TransitionType } from '../types/sequence';
import type { Effect, EffectPreset } from '../types/effects';
import SequenceStepCard from '../components/SequenceStepCard';

const SequenceEditor: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = id !== undefined && id !== 'new';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loop, setLoop] = useState(true);
  const [steps, setSteps] = useState<EffectSequenceStep[]>([]);

  const [effects, setEffects] = useState<Effect[]>([]);
  const [presets, setPresets] = useState<EffectPreset[]>([]);
  const [showAddStepModal, setShowAddStepModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configStepIndex, setConfigStepIndex] = useState<number | null>(null);

  // Add step modal state
  const [addMode, setAddMode] = useState<'effect' | 'preset'>('effect');
  const [selectedEffectId, setSelectedEffectId] = useState('');
  const [selectedPresetId, setSelectedPresetId] = useState('');
  const [newStepDuration, setNewStepDuration] = useState(30);
  const [newStepTransition, setNewStepTransition] = useState<TransitionType>('fade');
  const [, setNewStepParameters] = useState<Record<string, any>>({});

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load available effects and presets
      const [effectsData, presetsData] = await Promise.all([
        effectsService.getEffects(),
        effectsService.getPresets(),
      ]);
      setEffects(effectsData);
      setPresets(presetsData);

      // Load sequence if editing
      if (isEditMode) {
        const sequence = await sequenceService.getSequence(id);
        if (sequence) {
          // Only effect sequences can be edited
          if (sequence.type === 'fseq') {
            setError('FSEQ sequences cannot be edited. They are read-only.');
            // Redirect back to sequences list
            setTimeout(() => navigate('/sequences'), 2000);
            return;
          }
          
          setName(sequence.name);
          setDescription(sequence.description || '');
          setLoop(sequence.loop);
          setSteps(sequence.steps);
        } else {
          setError('Sequence not found');
        }
      }
    } catch (err) {
      setError('Failed to load data');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Sequence name is required');
      return;
    }

    if (steps.length === 0) {
      setError('At least one step is required');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      if (isEditMode) {
        const sequence: EffectSequence = {
          id,
          type: 'effect',
          name: name.trim(),
          description: description.trim() || undefined,
          steps,
          loop,
          createdAt: new Date().toISOString(),
        };
        const result = await sequenceService.updateSequence(sequence);
        if (result.success) {
          navigate('/sequences');
        } else {
          setError(result.message || 'Failed to update sequence');
        }
      } else {
        const result = await sequenceService.createSequence(
          name.trim(),
          description.trim() || undefined,
          steps,
          loop
        );
        if (result.success) {
          navigate('/sequences');
        } else {
          setError(result.message || 'Failed to create sequence');
        }
      }
    } catch (err) {
      setError('Failed to save sequence');
      console.error('Error saving sequence:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleAddStep = () => {
    let effectId: string;
    let parameters: Record<string, any> = {};

    if (addMode === 'effect') {
      if (!selectedEffectId) {
        setError('Please select an effect');
        return;
      }

      const effect = effects.find((e) => e.id === selectedEffectId);
      if (!effect) {
        setError('Effect not found');
        return;
      }

      effectId = selectedEffectId;
      // Build parameters from effect defaults
      effect.parameters.forEach((param) => {
        parameters[param.id] = param.value;
      });
    } else {
      // addMode === 'preset'
      if (!selectedPresetId) {
        setError('Please select a preset');
        return;
      }

      const preset = presets.find((p) => p.id === selectedPresetId);
      if (!preset) {
        setError('Preset not found');
        return;
      }

      effectId = preset.effectId;
      parameters = { ...preset.parameters };
    }

    const newStep: EffectSequenceStep = {
      id: `step-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      effectId,
      parameters,
      duration: newStepDuration,
      transition: newStepTransition,
    };

    setSteps([...steps, newStep]);
    setShowAddStepModal(false);
    resetAddStepForm();
  };

  const resetAddStepForm = () => {
    setAddMode('effect');
    setSelectedEffectId('');
    setSelectedPresetId('');
    setNewStepDuration(30);
    setNewStepTransition('fade');
    setNewStepParameters({});
  };

  const handleRemoveStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const handleMoveStep = (index: number, direction: 'up' | 'down') => {
    const newSteps = [...steps];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newSteps[index], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[index]];
    setSteps(newSteps);
  };

  const handleUpdateStepDuration = (index: number, duration: number) => {
    const newSteps = [...steps];
    newSteps[index].duration = duration;
    setSteps(newSteps);
  };

  const handleUpdateStepTransition = (index: number, transition: TransitionType) => {
    const newSteps = [...steps];
    newSteps[index].transition = transition;
    setSteps(newSteps);
  };

  const handleConfigureParameters = (index: number) => {
    setConfigStepIndex(index);
    setShowConfigModal(true);
  };

  const handleSaveParameters = () => {
    if (configStepIndex !== null && configStep) {
      const newSteps = [...steps];
      newSteps[configStepIndex].parameters = { ...configStep.parameters };
      setSteps(newSteps);
    }
    setShowConfigModal(false);
    setConfigStepIndex(null);
  };

  const handleConfigParameterChange = (paramId: string, value: any) => {
    if (configStepIndex !== null && configStep) {
      const newSteps = [...steps];
      newSteps[configStepIndex].parameters = {
        ...newSteps[configStepIndex].parameters,
        [paramId]: value,
      };
      setSteps(newSteps);
    }
  };

  const calculateTotalDuration = (): number => {
    return steps.reduce((sum, step) => (step.duration > 0 ? sum + step.duration : sum), 0);
  };

  const formatDuration = (seconds: number): string => {
    if (seconds === 0) return 'Manual';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-600 dark:text-gray-400">Loading...</div>
        </div>
      </div>
    );
  }

  const selectedEffect = effects.find((e) => e.id === selectedEffectId);
  const configStep = configStepIndex !== null ? steps[configStepIndex] : null;
  const configEffect = configStep ? effects.find((e) => e.id === configStep.effectId) : null;

  return (
    <div className="p-6">
      <div className="mb-6">
        <button
          onClick={() => navigate('/sequences')}
          className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-4"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Sequences
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isEditMode ? 'Edit Sequence' : 'New Sequence'}
        </h1>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-700 rounded-lg text-red-700 dark:text-red-400">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-4 text-sm underline hover:no-underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Sequence Info */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-300 dark:border-gray-700 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sequence Name <span className="text-red-600 dark:text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Awesome Sequence"
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
              maxLength={64}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            id="loop"
            checked={loop}
            onChange={(e) => setLoop(e.target.checked)}
            className="w-4 h-4 text-blue-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500"
          />
          <label htmlFor="loop" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
            Loop sequence (restart from beginning when finished)
          </label>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-300 dark:border-gray-700 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Timeline</h2>
          <button
            onClick={() => setShowAddStepModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Step
          </button>
        </div>

        {steps.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎬</div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">No steps yet</p>
            <button
              onClick={() => setShowAddStepModal(true)}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded inline-flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add First Step
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {steps.map((step, index) => {
              const effect = effects.find((e) => e.id === step.effectId);
              return (
                <SequenceStepCard
                  key={step.id}
                  step={step}
                  index={index}
                  effect={effect}
                  onMoveUp={() => handleMoveStep(index, 'up')}
                  onMoveDown={() => handleMoveStep(index, 'down')}
                  onRemove={() => handleRemoveStep(index)}
                  onUpdateDuration={(duration) => handleUpdateStepDuration(index, duration)}
                  onUpdateTransition={(transition) => handleUpdateStepTransition(index, transition)}
                  onConfigureParameters={() => handleConfigureParameters(index)}
                  isFirst={index === 0}
                  isLast={index === steps.length - 1}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Summary & Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-300 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            <span className="font-semibold text-gray-900 dark:text-white">{steps.length}</span> step{steps.length !== 1 ? 's' : ''} •{' '}
            <span className="font-semibold text-gray-900 dark:text-white">{formatDuration(calculateTotalDuration())}</span>
            {steps.some((s) => s.duration === 0) && <span className="text-gray-500 dark:text-gray-500"> (+ manual steps)</span>}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/sequences')}
              className="px-6 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-50"
              disabled={saving || !name.trim() || steps.length === 0}
            >
              {saving ? 'Saving...' : 'Save Sequence'}
            </button>
          </div>
        </div>
      </div>

      {/* Add Step Modal */}
      {showAddStepModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-300 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Add Effect to Sequence</h3>
                <button
                  onClick={() => {
                    setShowAddStepModal(false);
                    resetAddStepForm();
                  }}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Mode Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Add From</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setAddMode('effect');
                      setSelectedPresetId('');
                    }}
                    className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                      addMode === 'effect'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    Effect (Default Settings)
                  </button>
                  <button
                    onClick={() => {
                      setAddMode('preset');
                      setSelectedEffectId('');
                    }}
                    className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                      addMode === 'preset'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    Preset (Custom Settings)
                  </button>
                </div>
              </div>

              {/* Effect Selector */}
              {addMode === 'effect' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Effect</label>
                  <select
                    value={selectedEffectId}
                    onChange={(e) => setSelectedEffectId(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="">-- Choose an effect --</option>
                    {effects.map((effect) => (
                      <option key={effect.id} value={effect.id}>
                        {effect.icon} {effect.name}
                      </option>
                    ))}
                  </select>
                  {selectedEffect && (
                    <div className="mt-3 p-3 bg-gray-100 dark:bg-gray-900 rounded border border-gray-300 dark:border-gray-700">
                      <p className="text-xs text-gray-600 dark:text-gray-400">{selectedEffect.description}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">Parameters will use default values (customizable after adding)</p>
                    </div>
                  )}
                </div>
              )}

              {/* Preset Selector */}
              {addMode === 'preset' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Preset</label>
                  {presets.length > 0 ? (
                    <>
                      <select
                        value={selectedPresetId}
                        onChange={(e) => setSelectedPresetId(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                      >
                        <option value="">-- Choose a preset --</option>
                        {presets.map((preset) => {
                          const effect = effects.find((e) => e.id === preset.effectId);
                          return (
                            <option key={preset.id} value={preset.id}>
                              {effect?.icon} {preset.name} ({effect?.name})
                            </option>
                          );
                        })}
                      </select>
                      {selectedPresetId && (() => {
                        const preset = presets.find((p) => p.id === selectedPresetId);
                        const effect = preset ? effects.find((e) => e.id === preset.effectId) : null;
                        return preset && effect ? (
                          <div className="mt-3 p-3 bg-gray-100 dark:bg-gray-900 rounded border border-gray-300 dark:border-gray-700">
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                              <span className="font-medium">{effect.name}</span> - {effect.description}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500">Parameters from your saved preset will be applied</p>
                          </div>
                        ) : null;
                      })()}
                    </>
                  ) : (
                    <div className="p-4 bg-gray-100 dark:bg-gray-900 rounded border border-gray-300 dark:border-gray-700 text-center">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">No presets saved yet</p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">Go to Effects page to save presets first</p>
                    </div>
                  )}
                </div>
              )}

              {/* Duration & Transition (always visible when effect or preset selected) */}
              {(selectedEffect || selectedPresetId) && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Duration (seconds)</label>
                    <input
                      type="number"
                      min="0"
                      max="3600"
                      step="5"
                      value={newStepDuration}
                      onChange={(e) => setNewStepDuration(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">0 = manual (infinite)</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Transition to Next</label>
                    <select
                      value={newStepTransition}
                      onChange={(e) => setNewStepTransition(e.target.value as TransitionType)}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="instant">Instant</option>
                      <option value="fade">Fade (1s)</option>
                      <option value="crossfade">Crossfade (1s)</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-300 dark:border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAddStepModal(false);
                  resetAddStepForm();
                }}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleAddStep}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-50"
                disabled={addMode === 'effect' ? !selectedEffectId : !selectedPresetId}
              >
                Add {addMode === 'effect' ? 'Effect' : 'Preset'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Configure Parameters Modal */}
      {showConfigModal && configStep && configEffect && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-300 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{configEffect.icon}</span>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{configEffect.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{configEffect.category}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowConfigModal(false);
                    setConfigStepIndex(null);
                  }}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {configEffect.parameters.map((param) => {
                const value = configStep.parameters[param.id] ?? param.value;

                switch (param.type) {
                  case 'slider':
                    return (
                      <div key={param.id}>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-medium text-gray-900 dark:text-white">{param.name}</label>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {value}
                            {param.unit}
                          </span>
                        </div>
                        <input
                          type="range"
                          min={param.min}
                          max={param.max}
                          step={param.step}
                          value={value}
                          onChange={(e) => handleConfigParameterChange(param.id, Number(e.target.value))}
                          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                      </div>
                    );

                  case 'color':
                    return (
                      <div key={param.id}>
                        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">{param.name}</label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={value}
                            onChange={(e) => handleConfigParameterChange(param.id, e.target.value)}
                            className="w-12 h-12 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                          />
                          <input
                            type="text"
                            value={value}
                            onChange={(e) => handleConfigParameterChange(param.id, e.target.value)}
                            className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm focus:outline-none focus:border-blue-500"
                            placeholder="#000000"
                          />
                        </div>
                      </div>
                    );

                  case 'toggle':
                    return (
                      <div key={param.id} className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-900 dark:text-white">{param.name}</label>
                        <button
                          onClick={() => handleConfigParameterChange(param.id, !value)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            value ? 'bg-blue-600' : 'bg-gray-600'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              value ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    );

                  case 'select':
                    return (
                      <div key={param.id}>
                        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">{param.name}</label>
                        <select
                          value={value}
                          onChange={(e) => handleConfigParameterChange(param.id, e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
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
                        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">{param.name}</label>
                        <input
                          type="number"
                          min={param.min}
                          max={param.max}
                          step={param.step}
                          value={value}
                          onChange={(e) => handleConfigParameterChange(param.id, Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    );

                  default:
                    return null;
                }
              })}

              {configEffect.parameters.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-600 dark:text-gray-400">This effect has no configurable parameters.</p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-300 dark:border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowConfigModal(false);
                  setConfigStepIndex(null);
                }}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveParameters}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SequenceEditor;

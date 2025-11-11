import React from 'react';
import type { EffectSequenceStep, TransitionType } from '../types/sequence';
import type { Effect } from '../types/effects';

interface SequenceStepCardProps {
  step: EffectSequenceStep;
  index: number;
  effect: Effect | undefined;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
  onUpdateDuration: (duration: number) => void;
  onUpdateTransition: (transition: TransitionType) => void;
  onConfigureParameters: () => void;
  isFirst: boolean;
  isLast: boolean;
}

const SequenceStepCard: React.FC<SequenceStepCardProps> = ({
  step,
  index,
  effect,
  onMoveUp,
  onMoveDown,
  onRemove,
  onUpdateDuration,
  onUpdateTransition,
  onConfigureParameters,
  isFirst,
  isLast,
}) => {
  const formatDuration = (seconds: number): string => {
    if (seconds === 0) return 'Manual';
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${minutes}m ${secs}s` : `${minutes}m`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-300 dark:border-gray-700">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 flex-1">
          <div className="flex flex-col gap-1">
            <button
              onClick={onMoveUp}
              disabled={isFirst}
              className="p-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Move up"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
            <button
              onClick={onMoveDown}
              disabled={isLast}
              className="p-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Move down"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-gray-500 dark:text-gray-400 font-mono text-sm">{index + 1}.</span>
              <span className="text-xl">{effect?.icon || '❓'}</span>
              <h4 className="font-semibold text-gray-900 dark:text-white">{effect?.name || 'Unknown Effect'}</h4>
            </div>
            <div className="flex flex-wrap gap-3 text-sm text-gray-700 dark:text-gray-300">
              <div className="flex items-center gap-2">
                <label className="text-gray-600 dark:text-gray-400">Duration:</label>
                <input
                  type="number"
                  min="0"
                  max="3600"
                  step="5"
                  value={step.duration}
                  onChange={(e) => onUpdateDuration(parseInt(e.target.value) || 0)}
                  className="w-20 px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
                <span className="text-gray-600 dark:text-gray-400">{formatDuration(step.duration)}</span>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-gray-600 dark:text-gray-400">Transition:</label>
                <select
                  value={step.transition}
                  onChange={(e) => onUpdateTransition(e.target.value as TransitionType)}
                  className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="instant">Instant</option>
                  <option value="fade">Fade</option>
                  <option value="crossfade">Crossfade</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2 ml-4">
          <button
            onClick={onConfigureParameters}
            className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
            title="Configure parameters"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <button
            onClick={onRemove}
            className="p-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
            title="Remove step"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SequenceStepCard;

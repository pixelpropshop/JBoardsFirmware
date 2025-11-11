import React from 'react';
import type { Sequence } from '../types/sequence';

interface SequenceCardProps {
  sequence: Sequence;
  onPlay: (id: string) => void;
  onEdit: (id: string) => void;
  onDuplicate: (id: string) => void;
  onExport: (id: string) => void;
  onDelete: (id: string) => void;
}

const SequenceCard: React.FC<SequenceCardProps> = ({ sequence, onPlay, onEdit, onDuplicate, onExport, onDelete }) => {
  // Calculate total duration
  const totalDuration = sequence.type === 'effect' 
    ? sequence.steps.reduce((sum, step) => {
        // Skip manual/infinite steps (duration = 0)
        return step.duration > 0 ? sum + step.duration : sum;
      }, 0)
    : sequence.duration;

  // Format duration as mm:ss or hh:mm:ss
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

  const hasManualStep = sequence.type === 'effect' && sequence.steps.some((step) => step.duration === 0);
  
  // Determine icon based on sequence type
  const sequenceIcon = sequence.type === 'fseq' ? '🎄' : '🎵';
  
  // Determine step count
  const stepCount = sequence.type === 'effect' ? sequence.steps.length : 'FSEQ';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-300 dark:border-gray-700 hover:border-blue-500 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{sequenceIcon}</span>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{sequence.name}</h3>
            {sequence.type === 'fseq' && (
              <span className="px-2 py-0.5 text-xs bg-purple-600 text-white rounded">xLights</span>
            )}
          </div>
          {sequence.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{sequence.description}</p>
          )}
          <div className="flex flex-wrap gap-3 text-sm text-gray-700 dark:text-gray-300">
            {sequence.type === 'effect' && (
              <span className="flex items-center gap-1">
                <span className="text-blue-600 dark:text-blue-400">{sequence.steps.length}</span>
                {sequence.steps.length === 1 ? 'effect' : 'effects'}
              </span>
            )}
            <span className="flex items-center gap-1">
              <span className="text-blue-600 dark:text-blue-400">{formatDuration(totalDuration)}</span>
              {hasManualStep && <span className="text-gray-500 dark:text-gray-500">(+ manual)</span>}
            </span>
            {(sequence.type === 'effect' ? sequence.loop : sequence.loop) && (
              <span className="flex items-center gap-1">
                <span className="text-green-600 dark:text-green-400">🔁</span>
                Loop enabled
              </span>
            )}
            {sequence.type === 'fseq' && (
              <span className="flex items-center gap-1">
                <span className="text-purple-600 dark:text-purple-400">📁</span>
                {(sequence.fileSize / 1024 / 1024).toFixed(1)} MB
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2 ml-4">
          <button
            onClick={() => onPlay(sequence.id)}
            className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            title="Play sequence"
          >
            <svg
              className="w-5 h-5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
            </svg>
          </button>
          <button
            onClick={() => onEdit(sequence.id)}
            className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            title={sequence.type === 'fseq' ? 'Edit FSEQ settings' : 'Edit sequence'}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>
          {sequence.type === 'effect' && (
            <>
              <button
                onClick={() => onDuplicate(sequence.id)}
                className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                title="Duplicate sequence"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </button>
              <button
                onClick={() => onExport(sequence.id)}
                className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                title="Export sequence"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
              </button>
            </>
          )}
          <button
            onClick={() => onDelete(sequence.id)}
            className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            title="Delete sequence"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
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
    </div>
  );
};

export default SequenceCard;

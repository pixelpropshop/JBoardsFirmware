import React, { useEffect, useState } from 'react';
import { sequenceService } from '../services/sequenceService';
import type { SequencePlaybackState, Sequence } from '../types/sequence';

const SequencePlaybackWidget: React.FC = () => {
  const [playbackState, setPlaybackState] = useState<SequencePlaybackState | null>(null);
  const [sequence, setSequence] = useState<Sequence | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Initial load
    loadPlaybackState();

    // Poll for updates every second
    const interval = setInterval(loadPlaybackState, 1000);

    return () => clearInterval(interval);
  }, []);

  const loadPlaybackState = async () => {
    try {
      const state = await sequenceService.getPlaybackState();
      setPlaybackState(state);

      if (state) {
        setIsVisible(true);
        // Load sequence details if not already loaded or changed
        if (!sequence || sequence.id !== state.sequenceId) {
          const seq = await sequenceService.getSequence(state.sequenceId);
          setSequence(seq);
        }
      } else {
        // Delay hiding to allow for smooth transitions
        setTimeout(() => {
          if (!playbackState) {
            setIsVisible(false);
          }
        }, 300);
      }
    } catch (err) {
      console.error('Error loading playback state:', err);
    }
  };

  const handlePlayPause = async () => {
    if (!playbackState) return;

    try {
      if (playbackState.isPlaying) {
        await sequenceService.pauseSequence();
      } else if (playbackState.isPaused) {
        await sequenceService.resumeSequence();
      }
      loadPlaybackState();
    } catch (err) {
      console.error('Error toggling playback:', err);
    }
  };

  const handleStop = async () => {
    try {
      await sequenceService.stopSequence();
      loadPlaybackState();
    } catch (err) {
      console.error('Error stopping sequence:', err);
    }
  };

  const handleNext = async () => {
    try {
      await sequenceService.nextStep();
      loadPlaybackState();
    } catch (err) {
      console.error('Error skipping to next step:', err);
    }
  };

  const handlePrevious = async () => {
    try {
      await sequenceService.previousStep();
      loadPlaybackState();
    } catch (err) {
      console.error('Error going to previous step:', err);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isVisible || !playbackState || !sequence) {
    return null;
  }

  const currentStep = sequence.type === 'effect' ? sequence.steps[playbackState.currentStepIndex] : null;
  const totalDuration = sequence.type === 'effect'
    ? sequence.steps.reduce((sum, step) => (step.duration > 0 ? sum + step.duration : sum), 0)
    : sequence.duration;

  // Calculate progress percentage
  const progressPercentage = totalDuration > 0
    ? ((playbackState.totalElapsed / totalDuration) * 100)
    : 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-300 dark:border-gray-700 shadow-lg z-40 animate-slide-up">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center gap-4">
          {/* Sequence Info */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <span className="text-2xl">🎵</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-gray-900 dark:text-white truncate">{sequence.name}</h4>
                {sequence.loop && (
                  <span className="text-green-600 dark:text-green-400 text-xs">🔁</span>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <span className="truncate">
                  {sequence.type === 'effect' 
                    ? `Step ${playbackState.currentStepIndex + 1} of ${sequence.steps.length}`
                    : 'Playing FSEQ'}
                </span>
                {currentStep && (
                  <>
                    <span>•</span>
                    <span className="truncate">
                      {playbackState.remainingTime > 0
                        ? `${formatTime(playbackState.remainingTime)} remaining`
                        : 'Manual'}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="hidden md:block flex-1 min-w-0">
            <div className="relative">
              <div className="h-2 bg-gray-300 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all duration-1000"
                  style={{ width: `${Math.min(100, Math.max(0, progressPercentage))}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-500 mt-1">
                <span>{formatTime(playbackState.totalElapsed)}</span>
                <span>{totalDuration > 0 ? formatTime(totalDuration) : '--:--'}</span>
              </div>
            </div>
          </div>

          {/* Playback Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevious}
              className="p-2 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded transition-colors"
              title="Previous step"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.445 14.832A1 1 0 0010 14v-2.798l5.445 3.63A1 1 0 0017 14V6a1 1 0 00-1.555-.832L10 8.798V6a1 1 0 00-1.555-.832l-6 4a1 1 0 000 1.664l6 4z" />
              </svg>
            </button>

            <button
              onClick={handlePlayPause}
              className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              title={playbackState.isPlaying ? 'Pause' : 'Play'}
            >
              {playbackState.isPlaying ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>

            <button
              onClick={handleNext}
              className="p-2 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded transition-colors"
              title="Next step"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4.555 5.168A1 1 0 003 6v8a1 1 0 001.555.832L10 11.202V14a1 1 0 001.555.832l6-4a1 1 0 000-1.664l-6-4A1 1 0 0010 6v2.798l-5.445-3.63z" />
              </svg>
            </button>

            <button
              onClick={handleStop}
              className="p-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors ml-2"
              title="Stop"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SequencePlaybackWidget;

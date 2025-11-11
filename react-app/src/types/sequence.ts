// Sequence Types

export type SequenceType = 'effect' | 'fseq';

// Base interface for all sequences
export interface BaseSequence {
  id: string;
  name: string;
  description?: string;
  type: SequenceType;
  createdAt: string;
  updatedAt?: string;
}

// Effect Sequence Types

export type TransitionType = 'instant' | 'fade' | 'crossfade';

export interface EffectSequenceStep {
  id: string;
  effectId: string;
  parameters: Record<string, any>;
  duration: number; // Duration in seconds (0 = manual/infinite)
  transition: TransitionType;
}

export interface EffectSequence extends BaseSequence {
  type: 'effect';
  steps: EffectSequenceStep[];
  loop: boolean;
}

// FSEQ Sequence Types (xLights format)

export interface FseqSequence extends BaseSequence {
  type: 'fseq';
  fileUrl: string; // Path/URL to .fseq file
  fileSize: number; // File size in bytes
  duration: number; // Total duration in seconds
  frameRate: number; // Frames per second (e.g., 20, 40)
  channelCount: number; // Number of LED channels
  audioUrl?: string; // Optional synchronized audio file
  audioFileSize?: number; // Audio file size in bytes
  loop?: boolean; // Optional loop setting for FSEQ playback
}

// Union type for all sequence types
export type Sequence = EffectSequence | FseqSequence;

export interface SequencePlaybackState {
  sequenceId: string;
  currentStepIndex: number;
  isPlaying: boolean;
  isPaused: boolean;
  remainingTime: number; // Seconds left in current step
  totalElapsed: number; // Total playback time in seconds
}

export interface SequenceListItem {
  id: string;
  name: string;
  description?: string;
  type: SequenceType;
  stepCount?: number; // For effect sequences
  totalDuration: number; // Total duration in seconds
  loop?: boolean; // Optional for FSEQ
  createdAt: string;
  fileSize?: number; // For FSEQ sequences
  audioUrl?: string; // For FSEQ sequences
}

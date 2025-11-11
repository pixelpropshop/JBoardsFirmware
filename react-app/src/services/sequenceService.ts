// Effect Sequence service
import { api } from './api';
import type {
  EffectSequence,
  FseqSequence,
  Sequence,
  EffectSequenceStep,
  SequencePlaybackState,
} from '../types/sequence';
import { parseFseqFile, FseqParseError } from '../utils/fseqParser';

// Mock sequences data (combined effect and FSEQ sequences)
const mockEffectSequences: EffectSequence[] = [
  {
    id: 'seq-1',
    type: 'effect',
    name: 'Party Mode',
    description: 'High energy party sequence',
    loop: true,
    steps: [
      {
        id: 'step-1',
        effectId: 'rainbow',
        parameters: {
          speed: 80,
          mode: 'gradient',
          saturation: 100,
        },
        duration: 30,
        transition: 'fade',
      },
      {
        id: 'step-2',
        effectId: 'strobe',
        parameters: {
          color: '#ffffff',
          frequency: 15,
        },
        duration: 10,
        transition: 'instant',
      },
      {
        id: 'step-3',
        effectId: 'confetti',
        parameters: {
          density: 80,
          speed: 70,
        },
        duration: 45,
        transition: 'crossfade',
      },
      {
        id: 'step-4',
        effectId: 'chase',
        parameters: {
          color: '#ff00ff',
          speed: 60,
          size: 10,
          style: 'theater',
        },
        duration: 20,
        transition: 'fade',
      },
      {
        id: 'step-5',
        effectId: 'sparkle',
        parameters: {
          backgroundColor: '#000000',
          sparkleColorCount: '3',
          sparkleColor1: '#ffffff',
          sparkleColor2: '#00ffff',
          sparkleColor3: '#ff00ff',
          density: 70,
          speed: 50,
        },
        duration: 30,
        transition: 'crossfade',
      },
    ],
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'seq-2',
    type: 'effect',
    name: 'Sunset to Night',
    description: 'Peaceful evening transition',
    loop: false,
    steps: [
      {
        id: 'step-1',
        effectId: 'gradient',
        parameters: {
          colorCount: '3',
          color1: '#ff6b35',
          color2: '#f7931e',
          color3: '#fbb034',
          animate: true,
          speed: 20,
        },
        duration: 120,
        transition: 'crossfade',
      },
      {
        id: 'step-2',
        effectId: 'gradient',
        parameters: {
          colorCount: '2',
          color1: '#ff6b35',
          color2: '#1e3a8a',
          animate: true,
          speed: 15,
        },
        duration: 90,
        transition: 'crossfade',
      },
      {
        id: 'step-3',
        effectId: 'solid',
        parameters: {
          color: '#1e3a8a',
          cycle: false,
        },
        duration: 0, // Manual/infinite
        transition: 'fade',
      },
    ],
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: 'seq-3',
    type: 'effect',
    name: 'Holiday Lights',
    description: 'Festive holiday display',
    loop: true,
    steps: [
      {
        id: 'step-1',
        effectId: 'bars',
        parameters: {
          colorCount: '3',
          color1: '#ff0000',
          color2: '#00ff00',
          color3: '#ffffff',
          direction: 'horizontal',
          width: 20,
          spacing: 10,
          speed: 40,
        },
        duration: 60,
        transition: 'fade',
      },
      {
        id: 'step-2',
        effectId: 'sparkle',
        parameters: {
          backgroundColor: '#1e3a8a',
          sparkleColorCount: '4',
          sparkleColor1: '#ffffff',
          sparkleColor2: '#ffd700',
          sparkleColor3: '#ff0000',
          sparkleColor4: '#00ff00',
          density: 60,
          speed: 40,
        },
        duration: 45,
        transition: 'crossfade',
      },
      {
        id: 'step-3',
        effectId: 'gradient',
        parameters: {
          colorCount: '4',
          color1: '#ff0000',
          color2: '#00ff00',
          color3: '#ffd700',
          color4: '#ffffff',
          animate: true,
          speed: 30,
        },
        duration: 50,
        transition: 'fade',
      },
    ],
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
  },
];

// Mock FSEQ sequences
const mockFseqSequences: FseqSequence[] = [
  {
    id: 'fseq-1',
    type: 'fseq',
    name: 'Christmas Carol Medley',
    description: 'xLights sequence synchronized to music',
    fileUrl: '/sequences/christmas_carol.fseq',
    fileSize: 2457600, // ~2.4 MB
    duration: 180, // 3 minutes
    frameRate: 40,
    channelCount: 512,
    audioUrl: '/sequences/christmas_carol.mp3',
    audioFileSize: 4320000,
    loop: false,
    createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
  },
];

// Combined sequences array
const mockSequences: Sequence[] = [...mockEffectSequences, ...mockFseqSequences];

let mockPlaybackState: SequencePlaybackState | null = null;

export const sequenceService = {
  // Get all sequences (both effect and FSEQ)
  async getSequences(): Promise<Sequence[]> {
    try {
      const response = await api.fetch<{ sequences: Sequence[] }>('/api/sequences');
      return response.sequences;
    } catch {
      return mockSequences;
    }
  },

  // Get sequence by ID (returns either effect or FSEQ sequence)
  async getSequence(id: string): Promise<Sequence | null> {
    try {
      return await api.fetch<Sequence>(`/api/sequences/${id}`);
    } catch {
      return mockSequences.find((s) => s.id === id) || null;
    }
  },

  // Create new sequence
  async createSequence(
    name: string,
    description: string | undefined,
    steps: EffectSequenceStep[],
    loop: boolean
  ): Promise<{ success: boolean; message?: string; sequence?: EffectSequence }> {
    try {
      return await api.fetch<{ success: boolean; message?: string; sequence?: EffectSequence }>(
        '/api/sequences',
        {
          method: 'POST',
          body: JSON.stringify({ name, description, steps, loop }),
        }
      );
    } catch {
      console.log('Mock: Create sequence:', name);
      const sequence: EffectSequence = {
        id: `seq-${Date.now()}`,
        type: 'effect',
        name,
        description,
        steps,
        loop,
        createdAt: new Date().toISOString(),
      };
      mockEffectSequences.push(sequence);
      mockSequences.push(sequence);
      return { success: true, message: 'Sequence created (mock mode)', sequence };
    }
  },

  // Update sequence
  async updateSequence(
    sequence: EffectSequence
  ): Promise<{ success: boolean; message?: string; sequence?: EffectSequence }> {
    try {
      return await api.fetch<{ success: boolean; message?: string; sequence?: EffectSequence }>(
        `/api/sequences/${sequence.id}`,
        {
          method: 'PUT',
          body: JSON.stringify(sequence),
        }
      );
    } catch {
      console.log('Mock: Update sequence:', sequence.id);
      const effectIndex = mockEffectSequences.findIndex((s) => s.id === sequence.id);
      if (effectIndex > -1) {
        mockEffectSequences[effectIndex] = { ...sequence, updatedAt: new Date().toISOString() };
        const index = mockSequences.findIndex((s) => s.id === sequence.id);
        if (index > -1) {
          mockSequences[index] = mockEffectSequences[effectIndex];
        }
        return {
          success: true,
          message: 'Sequence updated (mock mode)',
          sequence: mockEffectSequences[effectIndex],
        };
      }
      return { success: false, message: 'Sequence not found' };
    }
  },

  // Delete sequence
  async deleteSequence(id: string): Promise<{ success: boolean; message?: string }> {
    try {
      return await api.fetch<{ success: boolean; message?: string }>(
        `/api/sequences/${id}`,
        {
          method: 'DELETE',
        }
      );
    } catch {
      console.log('Mock: Delete sequence:', id);
      const index = mockSequences.findIndex((s) => s.id === id);
      if (index > -1) {
        mockSequences.splice(index, 1);
        // Stop playback if this sequence was playing
        if (mockPlaybackState?.sequenceId === id) {
          mockPlaybackState = null;
        }
        return { success: true, message: 'Sequence deleted (mock mode)' };
      }
      return { success: false, message: 'Sequence not found' };
    }
  },

  // Playback control: Play sequence
  async playSequence(
    id: string,
    fromStep?: number
  ): Promise<{ success: boolean; message?: string; state?: SequencePlaybackState }> {
    try {
      return await api.fetch<{ success: boolean; message?: string; state?: SequencePlaybackState }>(
        `/api/sequences/${id}/play`,
        {
          method: 'POST',
          body: JSON.stringify({ fromStep: fromStep || 0 }),
        }
      );
    } catch {
      console.log('Mock: Play sequence:', id, 'from step:', fromStep || 0);
      const sequence = mockSequences.find((s) => s.id === id);
      if (!sequence) {
        return { success: false, message: 'Sequence not found' };
      }
      
      // Handle effect sequences
      if (sequence.type === 'effect') {
        mockPlaybackState = {
          sequenceId: id,
          currentStepIndex: fromStep || 0,
          isPlaying: true,
          isPaused: false,
          remainingTime: sequence.steps[fromStep || 0]?.duration || 0,
          totalElapsed: 0,
        };
      } else {
        // Handle FSEQ sequences (no steps, just duration)
        mockPlaybackState = {
          sequenceId: id,
          currentStepIndex: 0,
          isPlaying: true,
          isPaused: false,
          remainingTime: sequence.duration,
          totalElapsed: 0,
        };
      }
      return { success: true, message: 'Sequence playing (mock mode)', state: mockPlaybackState };
    }
  },

  // Pause sequence
  async pauseSequence(): Promise<{ success: boolean; message?: string; state?: SequencePlaybackState }> {
    try {
      return await api.fetch<{ success: boolean; message?: string; state?: SequencePlaybackState }>(
        '/api/sequences/pause',
        {
          method: 'POST',
        }
      );
    } catch {
      console.log('Mock: Pause sequence');
      if (mockPlaybackState) {
        mockPlaybackState.isPaused = true;
        mockPlaybackState.isPlaying = false;
        return { success: true, message: 'Sequence paused (mock mode)', state: mockPlaybackState };
      }
      return { success: false, message: 'No sequence playing' };
    }
  },

  // Resume sequence
  async resumeSequence(): Promise<{ success: boolean; message?: string; state?: SequencePlaybackState }> {
    try {
      return await api.fetch<{ success: boolean; message?: string; state?: SequencePlaybackState }>(
        '/api/sequences/resume',
        {
          method: 'POST',
        }
      );
    } catch {
      console.log('Mock: Resume sequence');
      if (mockPlaybackState && mockPlaybackState.isPaused) {
        mockPlaybackState.isPaused = false;
        mockPlaybackState.isPlaying = true;
        return { success: true, message: 'Sequence resumed (mock mode)', state: mockPlaybackState };
      }
      return { success: false, message: 'No paused sequence' };
    }
  },

  // Stop sequence
  async stopSequence(): Promise<{ success: boolean; message?: string }> {
    try {
      return await api.fetch<{ success: boolean; message?: string }>(
        '/api/sequences/stop',
        {
          method: 'POST',
        }
      );
    } catch {
      console.log('Mock: Stop sequence');
      mockPlaybackState = null;
      return { success: true, message: 'Sequence stopped (mock mode)' };
    }
  },

  // Next step
  async nextStep(): Promise<{ success: boolean; message?: string; state?: SequencePlaybackState }> {
    try {
      return await api.fetch<{ success: boolean; message?: string; state?: SequencePlaybackState }>(
        '/api/sequences/next',
        {
          method: 'POST',
        }
      );
    } catch {
      console.log('Mock: Next step');
      if (mockPlaybackState) {
        const sequence = mockSequences.find((s) => s.id === mockPlaybackState!.sequenceId);
        if (sequence && sequence.type === 'effect') {
          mockPlaybackState.currentStepIndex = (mockPlaybackState.currentStepIndex + 1) % sequence.steps.length;
          mockPlaybackState.remainingTime = sequence.steps[mockPlaybackState.currentStepIndex].duration;
          return { success: true, message: 'Next step (mock mode)', state: mockPlaybackState };
        } else if (sequence && sequence.type === 'fseq') {
          return { success: false, message: 'FSEQ sequences do not support step controls' };
        }
      }
      return { success: false, message: 'No sequence playing' };
    }
  },

  // Previous step
  async previousStep(): Promise<{ success: boolean; message?: string; state?: SequencePlaybackState }> {
    try {
      return await api.fetch<{ success: boolean; message?: string; state?: SequencePlaybackState }>(
        '/api/sequences/previous',
        {
          method: 'POST',
        }
      );
    } catch {
      console.log('Mock: Previous step');
      if (mockPlaybackState) {
        const sequence = mockSequences.find((s) => s.id === mockPlaybackState!.sequenceId);
        if (sequence && sequence.type === 'effect') {
          mockPlaybackState.currentStepIndex =
            mockPlaybackState.currentStepIndex === 0
              ? sequence.steps.length - 1
              : mockPlaybackState.currentStepIndex - 1;
          mockPlaybackState.remainingTime = sequence.steps[mockPlaybackState.currentStepIndex].duration;
          return { success: true, message: 'Previous step (mock mode)', state: mockPlaybackState };
        } else if (sequence && sequence.type === 'fseq') {
          return { success: false, message: 'FSEQ sequences do not support step controls' };
        }
      }
      return { success: false, message: 'No sequence playing' };
    }
  },

  // Get playback state
  async getPlaybackState(): Promise<SequencePlaybackState | null> {
    try {
      return await api.fetch<SequencePlaybackState | null>('/api/sequences/playback/state');
    } catch {
      return mockPlaybackState;
    }
  },

  // Upload FSEQ file
  async uploadFseq(
    file: File,
    name: string,
    description: string | undefined
  ): Promise<{ success: boolean; message?: string; sequence?: FseqSequence }> {
    // Validate file extension
    if (!file.name.toLowerCase().endsWith('.fseq')) {
      return {
        success: false,
        message: 'Invalid file type. Only .fseq files are supported.',
      };
    }

    // Parse FSEQ file to extract metadata
    let metadata;
    try {
      metadata = await parseFseqFile(file);
    } catch (error) {
      if (error instanceof FseqParseError) {
        return {
          success: false,
          message: `FSEQ parse error: ${error.message}`,
        };
      }
      return {
        success: false,
        message: 'Failed to parse FSEQ file',
      };
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', name);
      if (description) formData.append('description', description);

      return await api.fetch<{ success: boolean; message?: string; sequence?: FseqSequence }>(
        '/api/sequences/upload-fseq',
        {
          method: 'POST',
          body: formData,
        }
      );
    } catch (error) {
      console.log('Mock: Upload FSEQ:', name);
      
      // Mock FSEQ sequence creation using parsed metadata
      const sequence: FseqSequence = {
        id: `fseq-${Date.now()}`,
        type: 'fseq',
        name,
        description,
        fileUrl: `/sequences/${file.name}`,
        fileSize: file.size,
        duration: metadata.duration,
        frameRate: metadata.frameRate,
        channelCount: metadata.channelCount,
        loop: false,
        createdAt: new Date().toISOString(),
      };
      
      mockFseqSequences.push(sequence);
      mockSequences.push(sequence);
      return { success: true, message: 'FSEQ uploaded (mock mode)', sequence };
    }
  },

  // Update FSEQ metadata (name, audio, loop)
  async updateFseq(
    id: string,
    name: string,
    audioUrl: string | undefined,
    loop: boolean
  ): Promise<{ success: boolean; message?: string; sequence?: FseqSequence }> {
    try {
      return await api.fetch<{ success: boolean; message?: string; sequence?: FseqSequence }>(
        `/api/sequences/fseq/${id}`,
        {
          method: 'PUT',
          body: JSON.stringify({ name, audioUrl, loop }),
        }
      );
    } catch {
      console.log('Mock: Update FSEQ:', id);
      const fseqIndex = mockFseqSequences.findIndex((s) => s.id === id);
      if (fseqIndex > -1) {
        mockFseqSequences[fseqIndex] = {
          ...mockFseqSequences[fseqIndex],
          name,
          audioUrl,
          loop,
          updatedAt: new Date().toISOString(),
        };
        const index = mockSequences.findIndex((s) => s.id === id);
        if (index > -1) {
          mockSequences[index] = mockFseqSequences[fseqIndex];
        }
        return {
          success: true,
          message: 'FSEQ updated (mock mode)',
          sequence: mockFseqSequences[fseqIndex],
        };
      }
      return { success: false, message: 'FSEQ sequence not found' };
    }
  },
};

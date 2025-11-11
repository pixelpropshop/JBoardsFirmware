// LED Effects service
import { api } from './api';
import type { Effect, EffectCategory, LEDState, EffectPreset } from '../types/effects';

// Mock effects data
const mockEffects: Effect[] = [
  {
    id: 'solid',
    name: 'Solid Color',
    category: 'Solid' as EffectCategory,
    description: 'Display a single solid color with optional cycling',
    icon: '🎨',
    parameters: [
      {
        id: 'color',
        name: 'Color',
        type: 'color',
        value: '#ff0000',
      },
      {
        id: 'cycle',
        name: 'Cycle On/Off',
        type: 'toggle',
        value: false,
      },
      {
        id: 'speed',
        name: 'Cycle Speed',
        type: 'slider',
        value: 50,
        min: 1,
        max: 100,
        step: 1,
        unit: '%',
      },
    ],
  },
  {
    id: 'rainbow',
    name: 'Rainbow',
    category: 'Animated' as EffectCategory,
    description: 'Rainbow color cycle with multiple display modes',
    icon: '🌈',
    parameters: [
      {
        id: 'speed',
        name: 'Speed',
        type: 'slider',
        value: 50,
        min: 1,
        max: 100,
        step: 1,
        unit: '%',
      },
      {
        id: 'mode',
        name: 'Pattern',
        type: 'select',
        value: 'gradient',
        options: [
          { label: 'Gradient', value: 'gradient' },
          { label: 'Solid', value: 'solid' },
          { label: 'Diagonal Stripes', value: 'pride' },
        ],
      },
      {
        id: 'saturation',
        name: 'Saturation',
        type: 'slider',
        value: 100,
        min: 0,
        max: 100,
        step: 1,
        unit: '%',
      },
    ],
  },
  {
    id: 'chase',
    name: 'Chase',
    category: 'Animated' as EffectCategory,
    description: 'Moving light patterns including standard chase, theater, and scanner effects',
    icon: '🏃',
    parameters: [
      {
        id: 'color',
        name: 'Color',
        type: 'color',
        value: '#0000ff',
      },
      {
        id: 'speed',
        name: 'Speed',
        type: 'slider',
        value: 50,
        min: 1,
        max: 100,
        step: 1,
        unit: '%',
      },
      {
        id: 'size',
        name: 'Size',
        type: 'slider',
        value: 5,
        min: 1,
        max: 50,
        step: 1,
        unit: 'px',
      },
      {
        id: 'style',
        name: 'Style',
        type: 'select',
        value: 'standard',
        options: [
          { label: 'Standard', value: 'standard' },
          { label: 'Theater', value: 'theater' },
          { label: 'Scanner', value: 'scanner' },
        ],
      },
    ],
  },
  {
    id: 'breathe',
    name: 'Breathe',
    category: 'Animated' as EffectCategory,
    description: 'Gentle pulsing fade in and out',
    icon: '💨',
    parameters: [
      {
        id: 'color',
        name: 'Color',
        type: 'color',
        value: '#00ff00',
      },
      {
        id: 'speed',
        name: 'Speed',
        type: 'slider',
        value: 30,
        min: 1,
        max: 100,
        step: 1,
        unit: '%',
      },
    ],
  },
  {
    id: 'sparkle',
    name: 'Sparkle',
    category: 'Animated' as EffectCategory,
    description: 'Random twinkling lights with background color and multiple sparkle colors',
    icon: '✨',
    parameters: [
      {
        id: 'backgroundColor',
        name: 'Background Color',
        type: 'color',
        value: '#000000',
      },
      {
        id: 'sparkleColorCount',
        name: 'Number of Sparkle Colors',
        type: 'select',
        value: '1',
        options: [
          { label: '1 Color', value: '1' },
          { label: '2 Colors', value: '2' },
          { label: '3 Colors', value: '3' },
          { label: '4 Colors', value: '4' },
          { label: '5 Colors', value: '5' },
        ],
      },
      {
        id: 'sparkleColor1',
        name: 'Sparkle Color 1',
        type: 'color',
        value: '#ffffff',
      },
      {
        id: 'sparkleColor2',
        name: 'Sparkle Color 2',
        type: 'color',
        value: '#00ffff',
      },
      {
        id: 'sparkleColor3',
        name: 'Sparkle Color 3',
        type: 'color',
        value: '#ff00ff',
      },
      {
        id: 'sparkleColor4',
        name: 'Sparkle Color 4',
        type: 'color',
        value: '#ffff00',
      },
      {
        id: 'sparkleColor5',
        name: 'Sparkle Color 5',
        type: 'color',
        value: '#00ff00',
      },
      {
        id: 'density',
        name: 'Density',
        type: 'slider',
        value: 50,
        min: 1,
        max: 100,
        step: 1,
        unit: '%',
      },
      {
        id: 'speed',
        name: 'Speed',
        type: 'slider',
        value: 50,
        min: 1,
        max: 100,
        step: 1,
        unit: '%',
      },
    ],
  },
  {
    id: 'fire',
    name: 'Fire',
    category: 'Animated' as EffectCategory,
    description: 'Flickering fire simulation',
    icon: '🔥',
    parameters: [
      {
        id: 'intensity',
        name: 'Intensity',
        type: 'slider',
        value: 70,
        min: 1,
        max: 100,
        step: 1,
        unit: '%',
      },
      {
        id: 'cooling',
        name: 'Cooling',
        type: 'slider',
        value: 50,
        min: 1,
        max: 100,
        step: 1,
        unit: '%',
      },
    ],
  },
  {
    id: 'gradient',
    name: 'Color Flow',
    category: 'Pattern' as EffectCategory,
    description: 'Smooth color transitions through multiple colors',
    icon: '💫',
    parameters: [
      {
        id: 'colorCount',
        name: 'Number of Colors',
        type: 'select',
        value: '2',
        options: [
          { label: '2 Colors', value: '2' },
          { label: '3 Colors', value: '3' },
          { label: '4 Colors', value: '4' },
          { label: '5 Colors', value: '5' },
          { label: '6 Colors', value: '6' },
          { label: '7 Colors', value: '7' },
          { label: '8 Colors', value: '8' },
        ],
      },
      {
        id: 'color1',
        name: 'Color 1',
        type: 'color',
        value: '#ff0000',
      },
      {
        id: 'color2',
        name: 'Color 2',
        type: 'color',
        value: '#0000ff',
      },
      {
        id: 'color3',
        name: 'Color 3',
        type: 'color',
        value: '#00ff00',
      },
      {
        id: 'color4',
        name: 'Color 4',
        type: 'color',
        value: '#ffff00',
      },
      {
        id: 'color5',
        name: 'Color 5',
        type: 'color',
        value: '#ff00ff',
      },
      {
        id: 'color6',
        name: 'Color 6',
        type: 'color',
        value: '#00ffff',
      },
      {
        id: 'color7',
        name: 'Color 7',
        type: 'color',
        value: '#ff8800',
      },
      {
        id: 'color8',
        name: 'Color 8',
        type: 'color',
        value: '#8800ff',
      },
      {
        id: 'animate',
        name: 'Animate',
        type: 'toggle',
        value: false,
      },
      {
        id: 'speed',
        name: 'Speed',
        type: 'slider',
        value: 50,
        min: 1,
        max: 100,
        step: 1,
        unit: '%',
      },
    ],
  },
  {
    id: 'strobe',
    name: 'Strobe',
    category: 'Animated' as EffectCategory,
    description: 'Fast flashing effect',
    icon: '⚡',
    parameters: [
      {
        id: 'color',
        name: 'Color',
        type: 'color',
        value: '#ffffff',
      },
      {
        id: 'frequency',
        name: 'Frequency',
        type: 'slider',
        value: 10,
        min: 1,
        max: 50,
        step: 1,
        unit: 'Hz',
      },
    ],
  },
  {
    id: 'bars',
    name: 'Bars',
    category: 'Pattern' as EffectCategory,
    description: 'Moving colored bar patterns with multiple colors',
    icon: '📊',
    parameters: [
      {
        id: 'colorCount',
        name: 'Number of Colors',
        type: 'select',
        value: '2',
        options: [
          { label: '2 Colors', value: '2' },
          { label: '3 Colors', value: '3' },
          { label: '4 Colors', value: '4' },
          { label: '5 Colors', value: '5' },
          { label: '6 Colors', value: '6' },
          { label: '7 Colors', value: '7' },
          { label: '8 Colors', value: '8' },
        ],
      },
      {
        id: 'color1',
        name: 'Bar Color 1',
        type: 'color',
        value: '#ff0000',
      },
      {
        id: 'color2',
        name: 'Bar Color 2',
        type: 'color',
        value: '#0000ff',
      },
      {
        id: 'color3',
        name: 'Bar Color 3',
        type: 'color',
        value: '#00ff00',
      },
      {
        id: 'color4',
        name: 'Bar Color 4',
        type: 'color',
        value: '#ffff00',
      },
      {
        id: 'color5',
        name: 'Bar Color 5',
        type: 'color',
        value: '#ff00ff',
      },
      {
        id: 'color6',
        name: 'Bar Color 6',
        type: 'color',
        value: '#00ffff',
      },
      {
        id: 'color7',
        name: 'Bar Color 7',
        type: 'color',
        value: '#ff8800',
      },
      {
        id: 'color8',
        name: 'Bar Color 8',
        type: 'color',
        value: '#8800ff',
      },
      {
        id: 'direction',
        name: 'Direction',
        type: 'select',
        value: 'horizontal',
        options: [
          { label: 'Horizontal', value: 'horizontal' },
          { label: 'Vertical', value: 'vertical' },
          { label: 'Diagonal', value: 'diagonal' },
        ],
      },
      {
        id: 'width',
        name: 'Bar Width',
        type: 'slider',
        value: 20,
        min: 5,
        max: 100,
        step: 5,
        unit: 'px',
      },
      {
        id: 'spacing',
        name: 'Spacing',
        type: 'slider',
        value: 10,
        min: 0,
        max: 50,
        step: 5,
        unit: 'px',
      },
      {
        id: 'speed',
        name: 'Speed',
        type: 'slider',
        value: 50,
        min: 1,
        max: 100,
        step: 1,
        unit: '%',
      },
    ],
  },
  {
    id: 'wave',
    name: 'Wave',
    category: 'Animated' as EffectCategory,
    description: 'Wave patterns including standard, ripple, and ocean simulation',
    icon: '🌊',
    parameters: [
      {
        id: 'style',
        name: 'Wave Style',
        type: 'select',
        value: 'standard',
        options: [
          { label: 'Standard', value: 'standard' },
          { label: 'Ripple', value: 'ripple' },
          { label: 'Ocean', value: 'ocean' },
        ],
      },
      {
        id: 'color1',
        name: 'Wave Color',
        type: 'color',
        value: '#00ffff',
      },
      {
        id: 'color2',
        name: 'Background',
        type: 'color',
        value: '#000080',
      },
      {
        id: 'speed',
        name: 'Speed',
        type: 'slider',
        value: 40,
        min: 1,
        max: 100,
        step: 1,
        unit: '%',
      },
      {
        id: 'width',
        name: 'Wave Width',
        type: 'slider',
        value: 20,
        min: 5,
        max: 100,
        step: 5,
        unit: 'px',
      },
      {
        id: 'intensity',
        name: 'Intensity',
        type: 'slider',
        value: 60,
        min: 1,
        max: 100,
        step: 1,
        unit: '%',
      },
    ],
  },
  {
    id: 'confetti',
    name: 'Confetti',
    category: 'Animated' as EffectCategory,
    description: 'Colorful celebration effect',
    icon: '🎊',
    parameters: [
      {
        id: 'density',
        name: 'Density',
        type: 'slider',
        value: 60,
        min: 1,
        max: 100,
        step: 1,
        unit: '%',
      },
      {
        id: 'speed',
        name: 'Speed',
        type: 'slider',
        value: 50,
        min: 1,
        max: 100,
        step: 1,
        unit: '%',
      },
    ],
  },
  {
    id: 'meteor',
    name: 'Meteor',
    category: 'Animated' as EffectCategory,
    description: 'Shooting star effect',
    icon: '☄️',
    parameters: [
      {
        id: 'color',
        name: 'Color',
        type: 'color',
        value: '#ffffff',
      },
      {
        id: 'speed',
        name: 'Speed',
        type: 'slider',
        value: 60,
        min: 1,
        max: 100,
        step: 1,
        unit: '%',
      },
      {
        id: 'trail',
        name: 'Trail Length',
        type: 'slider',
        value: 30,
        min: 5,
        max: 100,
        step: 5,
        unit: 'px',
      },
    ],
  },
  {
    id: 'noise',
    name: 'Noise',
    category: 'Animated' as EffectCategory,
    description: 'Perlin noise-based colorful patterns',
    icon: '🌀',
    parameters: [
      {
        id: 'speed',
        name: 'Speed',
        type: 'slider',
        value: 30,
        min: 1,
        max: 100,
        step: 1,
        unit: '%',
      },
      {
        id: 'scale',
        name: 'Scale',
        type: 'slider',
        value: 50,
        min: 10,
        max: 100,
        step: 5,
        unit: '%',
      },
      {
        id: 'palette',
        name: 'Color Palette',
        type: 'select',
        value: 'rainbow',
        options: [
          { label: 'Rainbow', value: 'rainbow' },
          { label: 'Ocean', value: 'ocean' },
          { label: 'Forest', value: 'forest' },
          { label: 'Lava', value: 'lava' },
          { label: 'Cloud', value: 'cloud' },
        ],
      },
    ],
  },
  {
    id: 'matrix',
    name: 'Matrix',
    category: 'Animated' as EffectCategory,
    description: 'Falling code rain effect',
    icon: '💻',
    parameters: [
      {
        id: 'speed',
        name: 'Speed',
        type: 'slider',
        value: 50,
        min: 1,
        max: 100,
        step: 1,
        unit: '%',
      },
      {
        id: 'color',
        name: 'Color',
        type: 'color',
        value: '#00ff00',
      },
      {
        id: 'density',
        name: 'Trail Density',
        type: 'slider',
        value: 40,
        min: 1,
        max: 100,
        step: 1,
        unit: '%',
      },
    ],
  },
  {
    id: 'police',
    name: 'Police',
    category: 'Animated' as EffectCategory,
    description: 'Red and blue emergency lights',
    icon: '🚨',
    parameters: [
      {
        id: 'speed',
        name: 'Flash Speed',
        type: 'slider',
        value: 60,
        min: 1,
        max: 100,
        step: 1,
        unit: '%',
      },
      {
        id: 'pattern',
        name: 'Pattern',
        type: 'select',
        value: 'alternating',
        options: [
          { label: 'Alternating', value: 'alternating' },
          { label: 'Simultaneous', value: 'simultaneous' },
          { label: 'Chase', value: 'chase' },
        ],
      },
    ],
  },
  {
    id: 'aurora',
    name: 'Aurora',
    category: 'Animated' as EffectCategory,
    description: 'Northern lights simulation',
    icon: '🌌',
    parameters: [
      {
        id: 'speed',
        name: 'Speed',
        type: 'slider',
        value: 25,
        min: 1,
        max: 100,
        step: 1,
        unit: '%',
      },
      {
        id: 'intensity',
        name: 'Intensity',
        type: 'slider',
        value: 65,
        min: 1,
        max: 100,
        step: 1,
        unit: '%',
      },
      {
        id: 'palette',
        name: 'Color Palette',
        type: 'select',
        value: 'green',
        options: [
          { label: 'Green', value: 'green' },
          { label: 'Blue', value: 'blue' },
          { label: 'Purple', value: 'purple' },
          { label: 'Multi-Color', value: 'multi' },
        ],
      },
    ],
  },
];

const mockLEDState: LEDState = {
  power: true,
  brightness: 80,
  activeEffect: 'rainbow',
  activeParameters: {
    speed: 50,
  },
};

const mockPresets: EffectPreset[] = [
  {
    id: 'preset-1',
    name: 'Warm Sunset',
    effectId: 'gradient',
    parameters: {
      color1: '#ff6b35',
      color2: '#f7931e',
      animate: true,
    },
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'preset-2',
    name: 'Ocean Waves',
    effectId: 'wave',
    parameters: {
      color1: '#00d4ff',
      color2: '#0047ab',
      speed: 30,
      width: 25,
    },
    createdAt: new Date(Date.now() - 172800000).toISOString(),
  },
];

export const effectsService = {
  // Get all available effects
  async getEffects(): Promise<Effect[]> {
    try {
      return await api.fetch<Effect[]>('/api/effects');
    } catch {
      return mockEffects;
    }
  },

  // Get current LED state
  async getLEDState(): Promise<LEDState> {
    try {
      return await api.fetch<LEDState>('/api/led/state');
    } catch {
      return mockLEDState;
    }
  },

  // Set LED power
  async setPower(power: boolean): Promise<{ success: boolean; message?: string }> {
    try {
      return await api.fetch<{ success: boolean; message?: string }>('/api/led/power', {
        method: 'POST',
        body: JSON.stringify({ power }),
      });
    } catch {
      console.log('Mock: Set power:', power);
      mockLEDState.power = power;
      return { success: true, message: `LED ${power ? 'on' : 'off'} (mock mode)` };
    }
  },

  // Set brightness
  async setBrightness(brightness: number): Promise<{ success: boolean; message?: string }> {
    try {
      return await api.fetch<{ success: boolean; message?: string }>('/api/led/brightness', {
        method: 'POST',
        body: JSON.stringify({ brightness }),
      });
    } catch {
      console.log('Mock: Set brightness:', brightness);
      mockLEDState.brightness = brightness;
      return { success: true, message: `Brightness set to ${brightness}% (mock mode)` };
    }
  },

  // Apply effect
  async applyEffect(
    effectId: string,
    parameters: Record<string, any>
  ): Promise<{ success: boolean; message?: string }> {
    try {
      return await api.fetch<{ success: boolean; message?: string }>('/api/effects/apply', {
        method: 'POST',
        body: JSON.stringify({ effectId, parameters }),
      });
    } catch {
      console.log('Mock: Apply effect:', effectId, parameters);
      mockLEDState.activeEffect = effectId;
      mockLEDState.activeParameters = parameters;
      return { success: true, message: `Effect applied (mock mode)` };
    }
  },

  // Get saved presets
  async getPresets(): Promise<EffectPreset[]> {
    try {
      return await api.fetch<EffectPreset[]>('/api/effects/presets');
    } catch {
      return mockPresets;
    }
  },

  // Save preset
  async savePreset(
    name: string,
    effectId: string,
    parameters: Record<string, any>
  ): Promise<{ success: boolean; message?: string; preset?: EffectPreset }> {
    try {
      return await api.fetch<{ success: boolean; message?: string; preset?: EffectPreset }>(
        '/api/effects/presets',
        {
          method: 'POST',
          body: JSON.stringify({ name, effectId, parameters }),
        }
      );
    } catch {
      console.log('Mock: Save preset:', name, effectId, parameters);
      const preset: EffectPreset = {
        id: `preset-${Date.now()}`,
        name,
        effectId,
        parameters,
        createdAt: new Date().toISOString(),
      };
      mockPresets.push(preset);
      return { success: true, message: 'Preset saved (mock mode)', preset };
    }
  },

  // Delete preset
  async deletePreset(presetId: string): Promise<{ success: boolean; message?: string }> {
    try {
      return await api.fetch<{ success: boolean; message?: string }>(
        `/api/effects/presets/${presetId}`,
        {
          method: 'DELETE',
        }
      );
    } catch {
      console.log('Mock: Delete preset:', presetId);
      const index = mockPresets.findIndex((p) => p.id === presetId);
      if (index > -1) {
        mockPresets.splice(index, 1);
      }
      return { success: true, message: 'Preset deleted (mock mode)' };
    }
  },
};

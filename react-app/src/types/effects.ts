// LED Effects types

export enum EffectCategory {
  SOLID = 'Solid',
  ANIMATED = 'Animated',
  PATTERN = 'Pattern',
  REACTIVE = 'Reactive',
  CUSTOM = 'Custom',
}

export interface Effect {
  id: string;
  name: string;
  category: EffectCategory;
  description: string;
  icon?: string; // emoji or icon name
  parameters: EffectParameter[];
  isActive?: boolean;
  isCustom?: boolean;
}

export interface EffectParameter {
  id: string;
  name: string;
  type: 'slider' | 'color' | 'toggle' | 'select' | 'number';
  value: any;
  min?: number;
  max?: number;
  step?: number;
  options?: { label: string; value: any }[];
  unit?: string;
}

export interface LEDState {
  power: boolean;
  brightness: number;
  activeEffect: string | null;
  activeParameters: Record<string, any>;
}

export interface EffectPreset {
  id: string;
  name: string;
  effectId: string;
  parameters: Record<string, any>;
  createdAt: string;
}

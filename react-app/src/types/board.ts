// Board configuration types for multi-board support

export enum BoardModel {
  JSENSE_BOARD = 'jsense',
  LED_CONTROLLER = 'led-controller',
  SENSOR_HUB = 'sensor-hub',
  AUDIO_REACTIVE = 'audio-reactive',
  EFFECTS_CONTROLLER = 'effects-controller',
}

export type ProtocolType = 'e131' | 'ddp' | 'dmx' | 'artnet';

export interface BoardFeatures {
  pixelControl: boolean;
  audioReactive: boolean;
  sensors: boolean;
  jboardNetwork: boolean;
  protocols: ProtocolType[];
  maxPixels: number;
  outputs: number;
  fseqSupport: boolean;
}

export interface BoardUI {
  showEffects: boolean;
  showSequences: boolean;
  showAudio: boolean;
  showSensors: boolean;
  showFiles: boolean;
  showJBoardNetwork: boolean;
}

export interface BoardInfo {
  model: BoardModel;
  name: string;
  hardware: string;
  firmware: string;
  features: BoardFeatures;
  ui: BoardUI;
}

// Board configuration presets
export const BOARD_CONFIGS: Record<BoardModel, Omit<BoardInfo, 'firmware'>> = {
  [BoardModel.JSENSE_BOARD]: {
    model: BoardModel.JSENSE_BOARD,
    name: 'JSense Board',
    hardware: 'ESP32-S3',
    features: {
      pixelControl: true,
      audioReactive: true,
      sensors: true,
      jboardNetwork: true,
      protocols: ['e131', 'ddp', 'dmx', 'artnet'],
      maxPixels: 4096,
      outputs: 8,
      fseqSupport: true,
    },
    ui: {
      showEffects: true,
      showSequences: true,
      showAudio: true,
      showSensors: true,
      showFiles: true,
      showJBoardNetwork: true,
    },
  },
  [BoardModel.LED_CONTROLLER]: {
    model: BoardModel.LED_CONTROLLER,
    name: 'LED Controller',
    hardware: 'ESP32',
    features: {
      pixelControl: true,
      audioReactive: false,
      sensors: false,
      jboardNetwork: true,
      protocols: ['e131', 'ddp', 'artnet'],
      maxPixels: 1024,
      outputs: 2,
      fseqSupport: true,
    },
    ui: {
      showEffects: true,
      showSequences: true,
      showAudio: false,
      showSensors: false,
      showFiles: true,
      showJBoardNetwork: true,
    },
  },
  [BoardModel.SENSOR_HUB]: {
    model: BoardModel.SENSOR_HUB,
    name: 'Sensor Hub',
    hardware: 'ESP32',
    features: {
      pixelControl: false,
      audioReactive: false,
      sensors: true,
      jboardNetwork: true,
      protocols: [],
      maxPixels: 0,
      outputs: 0,
      fseqSupport: false,
    },
    ui: {
      showEffects: false,
      showSequences: false,
      showAudio: false,
      showSensors: true,
      showFiles: false,
      showJBoardNetwork: true,
    },
  },
  [BoardModel.AUDIO_REACTIVE]: {
    model: BoardModel.AUDIO_REACTIVE,
    name: 'Audio Reactive',
    hardware: 'ESP32-S3',
    features: {
      pixelControl: true,
      audioReactive: true,
      sensors: false,
      jboardNetwork: true,
      protocols: ['e131', 'ddp'],
      maxPixels: 2048,
      outputs: 4,
      fseqSupport: false,
    },
    ui: {
      showEffects: true,
      showSequences: false,
      showAudio: true,
      showSensors: false,
      showFiles: false,
      showJBoardNetwork: true,
    },
  },
  [BoardModel.EFFECTS_CONTROLLER]: {
    model: BoardModel.EFFECTS_CONTROLLER,
    name: 'Effects Controller',
    hardware: 'ESP32',
    features: {
      pixelControl: true,
      audioReactive: false,
      sensors: false,
      jboardNetwork: true,
      protocols: ['e131', 'ddp', 'dmx'],
      maxPixels: 2048,
      outputs: 4,
      fseqSupport: true,
    },
    ui: {
      showEffects: true,
      showSequences: true,
      showAudio: false,
      showSensors: false,
      showFiles: true,
      showJBoardNetwork: true,
    },
  },
};

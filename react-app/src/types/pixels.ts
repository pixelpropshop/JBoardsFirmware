// Pixel Outputs Types

export enum BoardVariant {
  JBOARD_2 = '2-output',
  JBOARD_4 = '4-output',
  JBOARD_8 = '8-output',
  JBOARD_16 = '16-output',
}

export interface BoardInfo {
  variant: BoardVariant
  outputCount: number
  maxPixelsPerOutput: number
  availableGPIOs: number[]
  powerRating: number  // Watts
  firmwareVersion: string
}

export enum PixelType {
  WS2811 = 'WS2811',
  WS2812 = 'WS2812',
  WS2812B = 'WS2812B',
  SK6812 = 'SK6812',
  SK6812_RGBW = 'SK6812_RGBW',
  APA102 = 'APA102',
  APA106 = 'APA106',
}

export enum ColorOrder {
  RGB = 'RGB',
  RBG = 'RBG',
  GRB = 'GRB',
  GBR = 'GBR',
  BRG = 'BRG',
  BGR = 'BGR',
  RGBW = 'RGBW',
  GRBW = 'GRBW',
}

export interface PixelOutput {
  id: string
  number: number          // Output number (1-N)
  name: string           // User-friendly name
  enabled: boolean       // Enable/disable output
  
  // Hardware Configuration
  gpio: number           // GPIO pin
  pixelCount: number     // Number of pixels
  pixelType: PixelType   // Pixel chipset
  colorOrder: ColorOrder // Color channel order
  
  // Power Configuration
  maxCurrent: number     // Max current in mA
  voltage: number        // Supply voltage (5V or 12V)
  
  // Advanced Settings (Future)
  brightness?: number    // 0-255
  gamma?: number         // Gamma correction
  dither?: boolean       // Dithering enabled
  
  // Status
  lastUpdate: number     // Timestamp
  status: 'active' | 'inactive' | 'error'
  currentDraw?: number   // Estimated current in mA
}

export interface PixelOutputConfig {
  outputs: PixelOutput[]
  globalBrightness: number  // 0-255
  powerLimit: number        // Total power limit in watts
  totalPixels: number       // Sum of all pixel counts
  estimatedPower: number    // Estimated total power draw
}

export enum TestPattern {
  SOLID_COLOR = 'solid_color',
  RAINBOW = 'rainbow',
  CHASE = 'chase',
  FADE = 'fade',
  STROBE = 'strobe',
  WIPE = 'wipe',
}

export interface TestConfig {
  pattern: TestPattern
  color?: string        // Hex color for solid/chase
  speed?: number        // 1-100
  brightness?: number   // 0-255
  duration?: number     // Seconds (0 = continuous)
}

export interface OutputTest {
  outputId: string
  testConfig: TestConfig
  running: boolean
  startTime?: number
}

export interface PowerWarning {
  level: 'info' | 'warning' | 'critical'
  message: string
  outputId?: string
}

export interface PixelSpec {
  voltage: number
  currentPerPixel: number
  dataRate: number
  colorOrder: string
  hasWhiteChannel: boolean
  notes: string
}

export const PIXEL_SPECS: Record<PixelType, PixelSpec> = {
  [PixelType.WS2811]: {
    voltage: 12,
    currentPerPixel: 60,
    dataRate: 800,
    colorOrder: 'RGB',
    hasWhiteChannel: false,
    notes: 'External driver IC, typically 12V'
  },
  [PixelType.WS2812]: {
    voltage: 5,
    currentPerPixel: 60,
    dataRate: 800,
    colorOrder: 'GRB',
    hasWhiteChannel: false,
    notes: 'Integrated driver, 5V'
  },
  [PixelType.WS2812B]: {
    voltage: 5,
    currentPerPixel: 60,
    dataRate: 800,
    colorOrder: 'GRB',
    hasWhiteChannel: false,
    notes: 'Improved WS2812, 5V'
  },
  [PixelType.SK6812]: {
    voltage: 5,
    currentPerPixel: 60,
    dataRate: 800,
    colorOrder: 'GRB',
    hasWhiteChannel: false,
    notes: 'WS2812 compatible, 5V'
  },
  [PixelType.SK6812_RGBW]: {
    voltage: 5,
    currentPerPixel: 80,
    dataRate: 800,
    colorOrder: 'GRBW',
    hasWhiteChannel: true,
    notes: 'Includes dedicated white channel'
  },
  [PixelType.APA102]: {
    voltage: 5,
    currentPerPixel: 60,
    dataRate: 1000,
    colorOrder: 'BGR',
    hasWhiteChannel: false,
    notes: 'SPI-based, requires separate clock line'
  },
  [PixelType.APA106]: {
    voltage: 5,
    currentPerPixel: 60,
    dataRate: 800,
    colorOrder: 'RGB',
    hasWhiteChannel: false,
    notes: 'Similar to WS2812, 5V'
  }
}

// Helper functions
export function estimateCurrentDraw(output: PixelOutput): number {
  const spec = PIXEL_SPECS[output.pixelType]
  // Assume 50% brightness average for estimation
  const avgCurrentPerPixel = spec.currentPerPixel * 0.5
  return output.pixelCount * avgCurrentPerPixel
}

export function estimateTotalPower(config: PixelOutputConfig): number {
  let totalCurrent = 0
  
  config.outputs.forEach(output => {
    if (output.enabled) {
      totalCurrent += estimateCurrentDraw(output)
    }
  })
  
  // Most common voltage is 5V
  const voltage = 5
  return (totalCurrent / 1000) * voltage  // Watts
}

export function checkPowerLimits(config: PixelOutputConfig): PowerWarning[] {
  const warnings: PowerWarning[] = []
  const totalPower = estimateTotalPower(config)
  
  // Check total power
  if (totalPower > config.powerLimit * 0.9) {
    warnings.push({
      level: 'critical',
      message: `Total power draw (${totalPower.toFixed(1)}W) exceeds 90% of limit (${config.powerLimit}W)`
    })
  } else if (totalPower > config.powerLimit * 0.75) {
    warnings.push({
      level: 'warning',
      message: `Total power draw (${totalPower.toFixed(1)}W) exceeds 75% of limit (${config.powerLimit}W)`
    })
  }
  
  // Check per-output current
  config.outputs.forEach(output => {
    const current = estimateCurrentDraw(output)
    if (current > output.maxCurrent) {
      warnings.push({
        level: 'warning',
        message: `Output ${output.number} current (${current.toFixed(0)}mA) exceeds limit (${output.maxCurrent}mA)`,
        outputId: output.id
      })
    }
  })
  
  return warnings
}

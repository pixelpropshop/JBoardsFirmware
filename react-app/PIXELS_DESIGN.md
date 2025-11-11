# Pixel Outputs Design

## Overview

The Pixel Outputs system provides configuration and management for WS2811/WS2812B/SK6812 and other addressable LED pixel outputs on JSenseBoard. The system supports multiple board variants with different output counts (2, 4, 8, etc.) and provides comprehensive configuration, testing, and monitoring capabilities.

## Board Architecture

### Board Variants

Different JSenseBoard hardware variants support different pixel output counts:

```typescript
enum BoardVariant {
  JBOARD_2 = '2-output',    // 2 pixel outputs
  JBOARD_4 = '4-output',    // 4 pixel outputs
  JBOARD_8 = '8-output',    // 8 pixel outputs
  JBOARD_16 = '16-output',  // 16 pixel outputs (future)
}

interface BoardInfo {
  variant: BoardVariant
  outputCount: number
  maxPixelsPerOutput: number
  availableGPIOs: number[]
  powerRating: number  // Watts
  firmwareVersion: string
}
```

### Board Detection

The system auto-detects board configuration from firmware:

```typescript
// GET /api/hardware/info
{
  variant: 'JBOARD_4',
  outputCount: 4,
  maxPixelsPerOutput: 1000,
  availableGPIOs: [13, 12, 14, 27],
  powerRating: 60,
  firmwareVersion: '1.0.0'
}
```

## Pixel Output Configuration

### Output Configuration Structure

```typescript
enum PixelType {
  WS2811 = 'WS2811',
  WS2812 = 'WS2812',
  WS2812B = 'WS2812B',
  SK6812 = 'SK6812',
  SK6812_RGBW = 'SK6812_RGBW',
  APA102 = 'APA102',
  APA106 = 'APA106',
}

enum ColorOrder {
  RGB = 'RGB',
  RBG = 'RBG',
  GRB = 'GRB',
  GBR = 'GBR',
  BRG = 'BRG',
  BGR = 'BGR',
  RGBW = 'RGBW',
  GRBW = 'GRBW',
}

interface PixelOutput {
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

interface PixelOutputConfig {
  outputs: PixelOutput[]
  globalBrightness: number  // 0-255
  powerLimit: number        // Total power limit in watts
  totalPixels: number       // Sum of all pixel counts
  estimatedPower: number    // Estimated total power draw
}
```

## Pixel Type Specifications

### WS2811/WS2812 Family

```typescript
const PIXEL_SPECS = {
  WS2811: {
    voltage: 12,           // Typically 12V
    currentPerPixel: 60,   // mA at full white
    dataRate: 800,         // kHz
    colorOrder: 'RGB',
    hasWhiteChannel: false,
    notes: 'External driver IC, typically 12V'
  },
  WS2812: {
    voltage: 5,
    currentPerPixel: 60,
    dataRate: 800,
    colorOrder: 'GRB',
    hasWhiteChannel: false,
    notes: 'Integrated driver, 5V'
  },
  WS2812B: {
    voltage: 5,
    currentPerPixel: 60,
    dataRate: 800,
    colorOrder: 'GRB',
    hasWhiteChannel: false,
    notes: 'Improved WS2812, 5V'
  },
  SK6812: {
    voltage: 5,
    currentPerPixel: 60,
    dataRate: 800,
    colorOrder: 'GRB',
    hasWhiteChannel: false,
    notes: 'WS2812 compatible, 5V'
  },
  SK6812_RGBW: {
    voltage: 5,
    currentPerPixel: 80,   // Higher due to white channel
    dataRate: 800,
    colorOrder: 'GRBW',
    hasWhiteChannel: true,
    notes: 'Includes dedicated white channel'
  },
  APA102: {
    voltage: 5,
    currentPerPixel: 60,
    dataRate: 1000,        // Up to 20MHz
    colorOrder: 'BGR',
    hasWhiteChannel: false,
    notes: 'SPI-based, requires separate clock line'
  }
}
```

## Power Calculation

### Current Estimation

```typescript
function estimateCurrentDraw(output: PixelOutput): number {
  const spec = PIXEL_SPECS[output.pixelType]
  // Assume 50% brightness average for estimation
  const avgCurrentPerPixel = spec.currentPerPixel * 0.5
  return output.pixelCount * avgCurrentPerPixel
}

function estimateTotalPower(config: PixelOutputConfig): number {
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
```

### Power Warnings

```typescript
interface PowerWarning {
  level: 'info' | 'warning' | 'critical'
  message: string
  outputId?: string
}

function checkPowerLimits(config: PixelOutputConfig): PowerWarning[] {
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
        message: `Output ${output.number} current (${current}mA) exceeds limit (${output.maxCurrent}mA)`,
        outputId: output.id
      })
    }
  })
  
  return warnings
}
```

## Testing System

### Test Patterns

```typescript
enum TestPattern {
  SOLID_COLOR = 'solid_color',
  RAINBOW = 'rainbow',
  CHASE = 'chase',
  FADE = 'fade',
  STROBE = 'strobe',
  WIPE = 'wipe',
}

interface TestConfig {
  pattern: TestPattern
  color?: string        // Hex color for solid/chase
  speed?: number        // 1-100
  brightness?: number   // 0-255
  duration?: number     // Seconds (0 = continuous)
}

interface OutputTest {
  outputId: string
  testConfig: TestConfig
  running: boolean
  startTime?: number
}
```

### Test Functions

```typescript
// Start test on specific output
async function startOutputTest(
  outputId: string, 
  config: TestConfig
): Promise<void>

// Start test on all outputs
async function startAllOutputsTest(
  config: TestConfig
): Promise<void>

// Stop test
async function stopOutputTest(outputId?: string): Promise<void>

// Set solid color for testing
async function testSolidColor(
  outputId: string,
  color: string
): Promise<void>
```

## API Endpoints

### Get Pixel Configuration

```
GET /api/pixels/config
Response: PixelOutputConfig
```

### Update Output Configuration

```
PUT /api/pixels/outputs/{id}
Body: Partial<PixelOutput>
Response: PixelOutput
```

### Update All Outputs

```
PUT /api/pixels/config
Body: Partial<PixelOutputConfig>
Response: PixelOutputConfig
```

### Test Output

```
POST /api/pixels/outputs/{id}/test
Body: TestConfig
Response: { success: boolean }
```

### Stop Test

```
POST /api/pixels/outputs/{id}/stop
Response: { success: boolean }
```

### Test All Outputs

```
POST /api/pixels/test-all
Body: TestConfig
Response: { success: boolean }
```

### Turn Off All

```
POST /api/pixels/all-off
Response: { success: boolean }
```

## UI Components

### Main Page Structure

```
┌─────────────────────────────────────────┐
│ Pixel Outputs                           │
│ Configure addressable LED pixel outputs │
├─────────────────────────────────────────┤
│                                         │
│ Board Info: JBOARD-4 (4 Outputs)       │
│ Total Pixels: 400 | Power: 12.5W/60W   │
│                                         │
├─────────────────────────────────────────┤
│ ┌─ Output 1: Front Display ───────────┐│
│ │ ✓ Enabled    150 pixels   WS2812B   ││
│ │ GPIO: 13     RGB           5V        ││
│ │ [Test] [Configure]                  ││
│ └─────────────────────────────────────┘│
│                                         │
│ ┌─ Output 2: Rear Strip ──────────────┐│
│ │ ✓ Enabled    100 pixels   WS2812B   ││
│ │ GPIO: 12     GRB           5V        ││
│ │ [Test] [Configure]                  ││
│ └─────────────────────────────────────┘│
│                                         │
│ [+ Add Output]  [Test All] [All Off]   │
└─────────────────────────────────────────┘
```

### Output Configuration Card

```typescript
interface OutputCardProps {
  output: PixelOutput
  boardInfo: BoardInfo
  onUpdate: (output: Partial<PixelOutput>) => void
  onTest: () => void
  onDelete?: () => void
}
```

### Output Config Modal

```typescript
interface OutputConfigModalProps {
  output?: PixelOutput
  boardInfo: BoardInfo
  usedGPIOs: number[]
  onSave: (output: PixelOutput) => void
  onClose: () => void
}

// Form fields:
// - Output Name (text)
// - Enable/Disable (toggle)
// - GPIO Pin (dropdown, filtered by availability)
// - Pixel Count (number, 1-maxPixelsPerOutput)
// - Pixel Type (dropdown)
// - Color Order (dropdown)
// - Max Current (number, mA)
// - Supply Voltage (dropdown: 5V, 12V)
```

### Test Panel

```typescript
interface TestPanelProps {
  outputs: PixelOutput[]
  onTestOutput: (id: string, config: TestConfig) => void
  onTestAll: (config: TestConfig) => void
  onStopAll: () => void
}

// Controls:
// - Pattern selector
// - Color picker (for applicable patterns)
// - Brightness slider
// - Speed slider
// - [Start Test] [Stop] buttons
```

### Power Monitor

```typescript
interface PowerMonitorProps {
  config: PixelOutputConfig
  warnings: PowerWarning[]
}

// Display:
// - Total estimated power
// - Power bar (current / limit)
// - Warning/critical indicators
// - Per-output current draw
```

## Default Configuration

### Board-Specific Defaults

```typescript
const DEFAULT_CONFIGS = {
  'JBOARD_2': {
    outputs: [
      {
        number: 1,
        name: 'Output 1',
        gpio: 13,
        pixelCount: 50,
        pixelType: PixelType.WS2812B,
        colorOrder: ColorOrder.GRB,
        enabled: true,
        maxCurrent: 3000,
        voltage: 5
      },
      {
        number: 2,
        name: 'Output 2',
        gpio: 12,
        pixelCount: 50,
        pixelType: PixelType.WS2812B,
        colorOrder: ColorOrder.GRB,
        enabled: true,
        maxCurrent: 3000,
        voltage: 5
      }
    ],
    globalBrightness: 255,
    powerLimit: 30
  },
  'JBOARD_4': {
    outputs: [
      { number: 1, gpio: 13, /* ... */ },
      { number: 2, gpio: 12, /* ... */ },
      { number: 3, gpio: 14, /* ... */ },
      { number: 4, gpio: 27, /* ... */ }
    ],
    powerLimit: 60
  },
  'JBOARD_8': {
    outputs: [
      { number: 1, gpio: 13, /* ... */ },
      { number: 2, gpio: 12, /* ... */ },
      { number: 3, gpio: 14, /* ... */ },
      { number: 4, gpio: 27, /* ... */ },
      { number: 5, gpio: 26, /* ... */ },
      { number: 6, gpio: 25, /* ... */ },
      { number: 7, gpio: 33, /* ... */ },
      { number: 8, gpio: 32, /* ... */ }
    ],
    powerLimit: 120
  }
}
```

## Validation Rules

### GPIO Validation

```typescript
function validateGPIO(
  gpio: number, 
  boardInfo: BoardInfo,
  usedGPIOs: number[]
): ValidationResult {
  if (!boardInfo.availableGPIOs.includes(gpio)) {
    return {
      valid: false,
      errors: [`GPIO ${gpio} is not available on this board`]
    }
  }
  
  if (usedGPIOs.includes(gpio)) {
    return {
      valid: false,
      errors: [`GPIO ${gpio} is already in use`]
    }
  }
  
  return { valid: true, errors: [] }
}
```

### Output Validation

```typescript
function validateOutput(
  output: Partial<PixelOutput>,
  boardInfo: BoardInfo
): ValidationResult {
  const errors: string[] = []
  
  if (!output.name?.trim()) {
    errors.push('Output name is required')
  }
  
  if (!output.pixelCount || output.pixelCount < 1) {
    errors.push('Pixel count must be at least 1')
  }
  
  if (output.pixelCount > boardInfo.maxPixelsPerOutput) {
    errors.push(`Pixel count exceeds maximum (${boardInfo.maxPixelsPerOutput})`)
  }
  
  if (!output.pixelType) {
    errors.push('Pixel type is required')
  }
  
  if (!output.colorOrder) {
    errors.push('Color order is required')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}
```

## Future Enhancements

### Advanced Features (Phase 2)

- Per-output brightness control
- Gamma correction configuration
- Color temperature adjustment
- Dithering options
- Refresh rate settings

### Output Mapping (Phase 3)

- Group outputs into logical zones
- Universe assignment for E1.31/Art-Net
- DMX output mapping
- Effect/sequence routing

### Diagnostics (Phase 4)

- Real-time current monitoring
- Voltage drop detection
- Pixel health check
- Communication error detection

## Implementation Checklist

### Phase 1: Basic Configuration
- [x] Create types/pixels.ts
- [ ] Create services/pixelsService.ts
- [ ] Create pages/Pixels.tsx
- [ ] Add Pixels route to App.tsx
- [ ] Add Pixels to sidebar navigation
- [ ] Implement output configuration cards
- [ ] Add board info display
- [ ] Implement output config modal
- [ ] Add GPIO conflict detection
- [ ] Implement power calculation
- [ ] Add power warnings

### Phase 2: Testing Tools
- [ ] Create test panel component
- [ ] Implement solid color test
- [ ] Implement rainbow pattern test
- [ ] Implement chase pattern test
- [ ] Add test all outputs function
- [ ] Add turn all off function
- [ ] Add test status indicators

### Phase 3: Validation & Polish
- [ ] Add comprehensive validation
- [ ] Implement error handling
- [ ] Add loading states
- [ ] Add confirmation dialogs
- [ ] Update API_SPECIFICATION.md
- [ ] Add user documentation

## Notes

- WS2811 typically uses 12V, while WS2812/SK6812 use 5V
- Maximum safe GPIO current on ESP32: ~40mA per pin (pixels use separate power)
- Recommended to add level shifter for 5V pixels (ESP32 is 3.3V)
- Data line length limit: ~5-6 meters without signal amplification
- Consider power injection every 100-150 pixels for long strips
- APA102 requires separate data and clock lines (SPI)

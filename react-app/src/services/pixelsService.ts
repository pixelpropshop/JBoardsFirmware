import { api } from './api'
import { 
  PixelOutputConfig, 
  PixelOutput, 
  BoardInfo,
  TestConfig,
  BoardVariant,
  PixelType,
  ColorOrder
} from '../types/pixels'

// Mock data for development
const MOCK_BOARD_INFO: BoardInfo = {
  variant: BoardVariant.JBOARD_4,
  outputCount: 4,
  maxPixelsPerOutput: 1000,
  availableGPIOs: [13, 12, 14, 27],
  powerRating: 60,
  firmwareVersion: '1.0.0'
}

const MOCK_CONFIG: PixelOutputConfig = {
  outputs: [
    {
      id: '1',
      number: 1,
      name: 'Output 1',
      enabled: true,
      gpio: 13,
      pixelCount: 150,
      pixelType: PixelType.WS2812B,
      colorOrder: ColorOrder.GRB,
      maxCurrent: 3000,
      voltage: 5,
      lastUpdate: Date.now(),
      status: 'active'
    },
    {
      id: '2',
      number: 2,
      name: 'Output 2',
      enabled: true,
      gpio: 12,
      pixelCount: 100,
      pixelType: PixelType.WS2812B,
      colorOrder: ColorOrder.GRB,
      maxCurrent: 3000,
      voltage: 5,
      lastUpdate: Date.now(),
      status: 'active'
    },
    {
      id: '3',
      number: 3,
      name: 'Output 3',
      enabled: false,
      gpio: 14,
      pixelCount: 50,
      pixelType: PixelType.WS2812B,
      colorOrder: ColorOrder.GRB,
      maxCurrent: 3000,
      voltage: 5,
      lastUpdate: Date.now(),
      status: 'inactive'
    },
    {
      id: '4',
      number: 4,
      name: 'Output 4',
      enabled: false,
      gpio: 27,
      pixelCount: 50,
      pixelType: PixelType.WS2812B,
      colorOrder: ColorOrder.GRB,
      maxCurrent: 3000,
      voltage: 5,
      lastUpdate: Date.now(),
      status: 'inactive'
    }
  ],
  globalBrightness: 255,
  powerLimit: 60,
  totalPixels: 350,
  estimatedPower: 10.5
}

/**
 * Get board hardware information
 */
export async function getBoardInfo(): Promise<BoardInfo> {
  try {
    return await api.fetch<BoardInfo>('/api/hardware/info')
  } catch {
    console.log('Mock: Using JBOARD-4 configuration')
    return MOCK_BOARD_INFO
  }
}

/**
 * Get current pixel output configuration
 */
export async function getPixelConfig(): Promise<PixelOutputConfig> {
  try {
    return await api.fetch<PixelOutputConfig>('/api/pixels/config')
  } catch {
    console.log('Mock: Using default pixel configuration')
    return MOCK_CONFIG
  }
}

/**
 * Update a single output configuration
 */
export async function updateOutput(
  id: string, 
  update: Partial<PixelOutput>
): Promise<PixelOutput> {
  try {
    return await api.fetch<PixelOutput>(`/api/pixels/outputs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(update)
    })
  } catch {
    console.log('Mock: Output update')
    const output = MOCK_CONFIG.outputs.find(o => o.id === id)
    if (output) {
      return { ...output, ...update, lastUpdate: Date.now() }
    }
    throw new Error('Output not found')
  }
}

/**
 * Update entire pixel configuration
 */
export async function updatePixelConfig(
  config: Partial<PixelOutputConfig>
): Promise<PixelOutputConfig> {
  try {
    return await api.fetch<PixelOutputConfig>('/api/pixels/config', {
      method: 'PUT',
      body: JSON.stringify(config)
    })
  } catch {
    console.log('Mock: Pixel config update')
    return { ...MOCK_CONFIG, ...config }
  }
}

/**
 * Test a specific output with given test configuration
 */
export async function testOutput(
  id: string, 
  testConfig: TestConfig
): Promise<{ success: boolean }> {
  try {
    return await api.fetch<{ success: boolean }>(`/api/pixels/outputs/${id}/test`, {
      method: 'POST',
      body: JSON.stringify(testConfig)
    })
  } catch {
    console.log('Mock: Output test')
    return { success: true }
  }
}

/**
 * Stop test on a specific output
 */
export async function stopOutputTest(id: string): Promise<{ success: boolean }> {
  try {
    return await api.fetch<{ success: boolean }>(`/api/pixels/outputs/${id}/stop`, {
      method: 'POST'
    })
  } catch {
    console.log('Mock: Stop output test')
    return { success: true }
  }
}

/**
 * Test all outputs with given test configuration
 */
export async function testAllOutputs(
  testConfig: TestConfig
): Promise<{ success: boolean }> {
  try {
    return await api.fetch<{ success: boolean }>('/api/pixels/test-all', {
      method: 'POST',
      body: JSON.stringify(testConfig)
    })
  } catch {
    console.log('Mock: Test all outputs')
    return { success: true }
  }
}

/**
 * Turn off all outputs
 */
export async function allOff(): Promise<{ success: boolean }> {
  try {
    return await api.fetch<{ success: boolean }>('/api/pixels/all-off', {
      method: 'POST'
    })
  } catch {
    console.log('Mock: All outputs off')
    return { success: true }
  }
}

# Pixel Outputs API

Configuration and testing for addressable LED pixel outputs.

## 99. Get Board Information

**Endpoint:** `GET /api/pixels/board`

**Response:**
```json
{
  "variant": "JBOARD-8",
  "outputCount": 8,
  "maxPixelsPerOutput": 2048,
  "firmwareVersion": "1.0.0",
  "availableGPIOs": [16, 17, 18, 19, 21, 22, 23, 25]
}
```

## 100. Get Pixel Configuration

**Endpoint:** `GET /api/pixels/config`

**Response:**
```json
{
  "outputs": [
    {
      "id": "output-1",
      "number": 1,
      "name": "Main Strip",
      "enabled": true,
      "gpio": 16,
      "pixelCount": 300,
      "pixelType": "WS2812B",
      "colorOrder": "GRB",
      "voltage": 5,
      "maxCurrent": 3000,
      "status": "active"
    }
  ],
  "estimatedCurrent": 5000,
  "estimatedPower": 25.0,
  "powerLimit": 200,
  "supplyVoltage": 5
}
```

**Notes:**
- pixelType: WS2811, WS2812B, SK6812, SK6812_RGBW, APA102, WS2801
- colorOrder: RGB, GRB, BRG, RBG, GBR, BGR, RGBW, GRBW
- status: 'active', 'idle', 'error', 'testing'

## 101. Update Pixel Output

**Endpoint:** `PUT /api/pixels/output/{id}`

**Request:**
```json
{
  "name": "Updated Strip Name",
  "enabled": true,
  "gpio": 16,
  "pixelCount": 300,
  "pixelType": "WS2812B",
  "colorOrder": "GRB",
  "voltage": 5,
  "maxCurrent": 3000
}
```

## 102. Test Pixel Output

**Endpoint:** `POST /api/pixels/output/{id}/test`

**Request:**
```json
{
  "effectId": "rainbow",
  "parameters": {
    "speed": 50,
    "mode": "gradient",
    "saturation": 100
  },
  "brightness": 128,
  "duration": 0
}
```

**Notes:**
- Uses Effects system for test patterns
- duration: Test duration in seconds (0 = continuous)

## 103. Stop Output Test

**Endpoint:** `POST /api/pixels/output/{id}/stop`

## 104. Test All Outputs

**Endpoint:** `POST /api/pixels/test/all`

**Request:**
```json
{
  "effectId": "solid",
  "parameters": {
    "color": "#ff0000"
  },
  "brightness": 128,
  "duration": 0
}
```

## 105. Turn All Outputs Off

**Endpoint:** `POST /api/pixels/off`

## Pixel Types and Specifications

| Type | Voltage | Current/Pixel | Color Order | Data Rate | Notes |
|------|---------|---------------|-------------|-----------|-------|
| WS2812B | 5V | 60mA | GRB | 800kHz | Most common, integrated IC |
| WS2811 | 12V | 60mA | RGB | 800kHz | External IC, 3 LEDs per IC |
| SK6812 | 5V | 60mA | GRB | 800kHz | Similar to WS2812B |
| SK6812_RGBW | 5V | 80mA | GRBW | 800kHz | Adds white LED |
| APA102 | 5V | 60mA | BGR | 1MHz | Clock + data, higher refresh |
| WS2801 | 5V | 60mA | RGB | 25MHz | Clock + data, older type |

## Power Management

**Current Estimation:**
- RGB pixels: 60mA per pixel at full white
- RGBW pixels: 80mA per pixel at full white
- Varies with color and brightness

**Power Limits:**
- Critical: >100% of power limit (red, pulsing)
- Warning: 80-100% of power limit (yellow)
- Normal: <80% of power limit (green)

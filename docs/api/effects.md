# LED Effects API

LED effect management, presets, and control.

## 28. Get Available Effects

**Endpoint:** `GET /api/effects`

**Response:**
```json
[
  {
    "id": "solid",
    "name": "Solid Color",
    "category": "Solid",
    "description": "Display a single solid color",
    "icon": "🎨",
    "parameters": [
      {
        "id": "color",
        "name": "Color",
        "type": "color",
        "value": "#ff0000"
      }
    ]
  }
]
```

**Notes:**
- category: Solid, Animated, Pattern, Reactive, Custom
- parameter types: slider, color, toggle, select, number

## 29. Get LED State

**Endpoint:** `GET /api/led/state`

**Response:**
```json
{
  "power": true,
  "brightness": 80,
  "activeEffect": "rainbow",
  "activeParameters": {
    "speed": 50
  }
}
```

## 30. Set LED Power

**Endpoint:** `POST /api/led/power`

**Request:**
```json
{
  "power": true
}
```

## 31. Set LED Brightness

**Endpoint:** `POST /api/led/brightness`

**Request:**
```json
{
  "brightness": 75
}
```

**Notes:**
- brightness: 0-100 percentage

## 32. Apply Effect

**Endpoint:** `POST /api/effects/apply`

**Request:**
```json
{
  "effectId": "rainbow",
  "parameters": {
    "speed": 75
  }
}
```

## 33. Get Effect Presets

**Endpoint:** `GET /api/effects/presets`

**Response:**
```json
[
  {
    "id": "preset-1",
    "name": "Warm Sunset",
    "effectId": "gradient",
    "parameters": {
      "color1": "#ff6b35",
      "color2": "#f7931e",
      "animate": true
    },
    "createdAt": "2025-01-09T10:30:00Z"
  }
]
```

## 34. Save Effect Preset

**Endpoint:** `POST /api/effects/presets`

**Request:**
```json
{
  "name": "My Custom Effect",
  "effectId": "sparkle",
  "parameters": {
    "color": "#ffffff",
    "density": 60,
    "speed": 50
  }
}
```

## 35. Delete Effect Preset

**Endpoint:** `DELETE /api/effects/presets/{id}`

## Built-in Effects (16 Total)

### Basic Effects
1. **Solid Color** - Single static color
2. **Rainbow** - Rainbow cycle with patterns (gradient/solid/diagonal)
3. **Chase** - Moving patterns (standard/theater/scanner)
4. **Breathe** - Pulsing fade effect
5. **Sparkle** - Random twinkling lights
6. **Fire** - Flickering fire simulation
7. **Color Flow** - Smooth transitions through 2-8 colors
8. **Strobe** - Fast flashing
9. **Bars** - Moving colored bar patterns

### Advanced Effects
10. **Wave** - Wave patterns (standard/ripple/ocean)
11. **Confetti** - Colorful celebration effect
12. **Meteor** - Shooting star effect

### WLED-Inspired Effects
13. **Noise** - Perlin noise patterns
14. **Matrix** - Falling code rain
15. **Police** - Red and blue emergency lights
16. **Aurora** - Northern lights simulation

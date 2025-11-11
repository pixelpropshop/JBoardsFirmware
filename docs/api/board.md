# Board Configuration API

## 27. Get Board Information

**Endpoint:** `GET /api/board/info`

**Description:** Retrieve information about the current board model and capabilities.

**Response:**
```json
{
  "model": "jsense",
  "hardware": "ESP32-S3",
  "firmware": "1.0.0"
}
```

**Notes:**
- model: Board model identifier (jsense, led-controller, sensor-hub, audio-reactive, effects-controller)
- hardware: Hardware platform (ESP32, ESP32-S3, etc.)
- firmware: Current firmware version
- Frontend merges this with preset configurations for features and UI

## Board Models and Configurations

| Model | Name | Hardware | Features |
|-------|------|----------|----------|
| jsense | JSense Board | ESP32-S3 | Full-featured: 8 outputs, 4096 pixels, all protocols |
| led-controller | LED Controller | ESP32 | Basic: 2 outputs, 1024 pixels, E1.31/DDP/ArtNet |
| sensor-hub | Sensor Hub | ESP32 | Sensors only, no pixel control |
| audio-reactive | Audio Reactive | ESP32-S3 | Audio + pixels: 4 outputs, 2048 pixels, E1.31/DDP |
| effects-controller | Effects Controller | ESP32 | Effects: 4 outputs, 2048 pixels, E1.31/DDP/DMX |

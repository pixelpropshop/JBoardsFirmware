# JSense Board API Documentation

Split API documentation by category for easier navigation and reduced token usage.

## Quick Reference

| Category | File | Endpoints | Description |
|----------|------|-----------|-------------|
| **Network** | [network.md](./network.md) | 1-18 | WiFi, AP, Hostname, Profiles, Auto-reconnect, Captive Portal |
| **JBoard Network** | [jboard.md](./jboard.md) | 19-26 | P2P device communication, ESP-NOW |
| **Board Config** | [board.md](./board.md) | 27 | Board model and capabilities |
| **Effects** | [effects.md](./effects.md) | 28-35 | LED effects, presets, power/brightness |
| **Sequences** | [sequences.md](./sequences.md) | 36-49 | Effect sequences, FSEQ, playback control |
| **Files** | [files.md](./files.md) | 50-59 | Audio files, general file management, SD card |
| **System** | [system.md](./system.md) | 60-73 | Stats, firmware OTA, restart, factory reset, rollback |
| **Hardware** | [hardware.md](./hardware.md) | 74-82 | RTC, OLED display configuration |
| **Sensors** | [sensors.md](./sensors.md) | 83-98 | Environmental sensors, alerts, automation |
| **Pixels** | [pixels.md](./pixels.md) | 99-105 | Pixel output configuration, testing |

## Base URL

All endpoints relative to ESP32 web server root (e.g., `/api/...`)

## Common Patterns

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Descriptive error message"
}
```

### HTTP Status Codes
- `200 OK` - Successful request
- `400 Bad Request` - Invalid input
- `500 Internal Server Error` - Server error

## Development Notes

- Frontend auto-falls back to mock data if API unavailable
- CORS headers required for development mode
- See `.env.development` for API base URL configuration
- Service files contain TypeScript interfaces matching these endpoints

# JSense Board ESP32 Firmware

ESP32-S3 firmware for JSense Board LED controller with comprehensive sensor support, network management, and LED effects engine.

## Project Structure

```
firmware/
├── platformio.ini          # PlatformIO configuration
├── src/
│   ├── main.cpp           # Main entry point
│   ├── config.h           # Board configuration & feature flags
│   ├── api/               # Web server & API endpoints
│   ├── network/           # WiFi, AP, mDNS, ESP-NOW
│   ├── led/               # FastLED, effects, sequences
│   ├── storage/           # Config, files, FSEQ parser
│   ├── sensors/           # Sensor framework & drivers
│   ├── hardware/          # RTC, OLED display
│   └── utils/             # Logger, time, power management
├── lib/                   # Custom libraries (if needed)
├── data/                  # SPIFFS/LittleFS files
└── test/                  # Unit tests
```

## Board Variants

Firmware supports 4 board variants via compile-time flags:

| Variant | Outputs | Max Pixels/Out | Sensors | RTC | OLED | Audio | ESP-NOW | FSEQ |
|---------|---------|----------------|---------|-----|------|-------|---------|------|
| JBOARD-2 | 2 | 1024 | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| JBOARD-4 | 4 | 1024 | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| JBOARD-8 | 8 | 2048 | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ |
| JBOARD-16 | 16 | 2048 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

Default build target is `jboard-16` (full-featured).

## Hardware Requirements

- **MCU:** ESP32-S3 DevKit (dev) or ESP32 WROVER-E (production)
- **Flash:** 16MB
- **PSRAM:** 8MB
- **LED Outputs:** Up to 16 (WS2812B, WS2811, SK6812, APA102, etc.)
- **Optional:** RTC (DS3231), OLED (SSD1306), SD card, I2C sensors

## Development Setup

### Prerequisites

- [Visual Studio Code](https://code.visualstudio.com/)
- [PlatformIO IDE Extension](https://platformio.org/install/ide?install=vscode)
- ESP32-S3 DevKit or compatible board
- USB cable for programming

### Initial Setup

1. **Open Project in PlatformIO:**
   ```bash
   cd firmware
   code .
   ```

2. **Install Dependencies:**
   PlatformIO will automatically download all libraries on first build.

3. **Build Firmware:**
   ```bash
   pio run -e jboard-16
   ```

4. **Upload to Board:**
   ```bash
   pio run -e jboard-16 -t upload
   ```

5. **Monitor Serial Output:**
   ```bash
   pio device monitor -b 115200
   ```

### Build for Different Variants

```bash
# JBOARD-16 (default)
pio run -e jboard-16

# JBOARD-8
pio run -e jboard-8

# JBOARD-4
pio run -e jboard-4

# JBOARD-2
pio run -e jboard-2
```

## Implementation Phases

Firmware is being developed in 10 phases (see `BACKEND_IMPLEMENTATION_PLAN.md`):

- [x] **Phase 0:** Project Setup (platformio.ini, config.h, main.cpp)
- [ ] **Phase 1:** Foundation (web server, config, logging) - *2-3 days*
- [ ] **Phase 2:** Network (WiFi, AP, mDNS, captive portal) - *3-4 days*
- [ ] **Phase 3:** System (info, OTA, restart, factory reset) - *2-3 days*
- [ ] **Phase 4:** Hardware (RTC, OLED display) - *2 days*
- [ ] **Phase 5:** Board Config (variant detection, capabilities) - *1 day*
- [ ] **Phase 6:** Pixels (FastLED integration, multi-output) - *3-4 days*
- [ ] **Phase 7:** Effects (16 built-in effects, presets) - *4-5 days*
- [ ] **Phase 8:** Sequences (effect sequences, FSEQ support) - *5-6 days*
- [ ] **Phase 9:** Sensors (25+ sensor types, automation) - *4-5 days*
- [ ] **Phase 10:** JBoard Network (ESP-NOW P2P) - *3-4 days*

**MVP Timeline:** Phases 1-3, 5-7 = 15-19 days  
**Full Implementation:** 29-40 days

## Configuration

### WiFi Settings

Default AP mode (if no WiFi configured):
- **SSID:** `JSenseBoard`
- **Password:** `jsenseboard`
- **IP:** `192.168.4.1`

### Web Interface

- **HTTP:** Port 80
- **WebSocket:** Port 81
- **mDNS:** `http://jsenseboard.local`

### OTA Updates

- **Port:** 3232
- **Password:** `jsenseboard` (change in production!)

## API Endpoints

105 REST API endpoints across 10 categories (see `docs/api/`):

- **Network** (18 endpoints) - WiFi, AP, profiles, captive portal
- **Board** (1 endpoint) - Board info, variant detection
- **JBoard** (8 endpoints) - ESP-NOW peer-to-peer networking
- **Pixels** (7 endpoints) - LED output configuration
- **Effects** (8 endpoints) - Built-in effects, presets
- **Hardware** (9 endpoints) - RTC, OLED display
- **Files** (10 endpoints) - File management, audio
- **Sequences** (14 endpoints) - Effect sequences, FSEQ playback
- **System** (14 endpoints) - System info, OTA, firmware updates
- **Sensors** (16 endpoints) - Sensor management, automation

## Libraries Used

### Core
- **ESPAsyncWebServer** - Async web server
- **ArduinoJson** - JSON serialization
- **AsyncTCP** - Async networking

### LED Control
- **FastLED** - Industry-standard LED library

### Storage
- **LittleFS** - Flash filesystem (recommended for ESP32-S3)
- **SD** - SD card support

### Sensors
- **Adafruit Unified Sensor** - Sensor abstraction framework
- **Adafruit LIS3DH** - 3-axis accelerometer
- **Adafruit LSM6DS** - 6-axis IMU
- **Adafruit BME280** - Temp/humidity/pressure
- **Adafruit BH1750** - Light sensor
- *(See platformio.ini for complete list)*

### Hardware
- **RTClib** - RTC module support
- **Adafruit SSD1306** - OLED display
- **Adafruit GFX** - Graphics library

### Time
- **NTPClient** - Network time sync

## Debugging

### Serial Monitor

```bash
pio device monitor -b 115200
```

Boot info shows:
- Board variant & capabilities
- Hardware specs (CPU, RAM, Flash)
- MAC address
- Feature flags
- Initialization progress

### Log Levels

Set in `config.h`:
```cpp
#define LOG_LEVEL 3  // 0=NONE, 1=ERROR, 2=WARN, 3=INFO, 4=DEBUG, 5=VERBOSE
```

### Memory Monitoring

```cpp
Serial.print("Free Heap: ");
Serial.println(ESP.getFreeHeap());
```

## Troubleshooting

### Build Errors

**Issue:** Missing libraries  
**Solution:** PlatformIO will auto-install on first build. Wait for completion.

**Issue:** Board not detected  
**Solution:** Install CP2102/CH340 USB drivers for your OS.

**Issue:** Upload failed  
**Solution:** Hold BOOT button while uploading, or try slower baud rate.

### Runtime Issues

**Issue:** WiFi won't connect  
**Solution:** Device starts in AP mode. Connect to `JSenseBoard` AP and configure WiFi.

**Issue:** LEDs not working  
**Solution:** Check GPIO pin assignments in `config.h`, verify power supply.

**Issue:** Low memory warnings  
**Solution:** Reduce `MAX_PIXELS_PER_OUTPUT`, disable unused features.

## Performance

### Memory Usage
- **Flash:** ~1-2MB (varies by enabled features)
- **Heap:** ~250KB free (out of ~320KB total)
- **PSRAM:** Used for large allocations (FSEQ, buffers)

### Update Rate
- **LED Refresh:** 60 FPS (configurable)
- **Sensor Sampling:** 1Hz (configurable per sensor)
- **API Response:** <50ms typical

## License

MIT License - See root LICENSE file

## Support

- **GitHub:** [pixelpropshop/JBoards](https://github.com/pixelpropshop/JBoards)
- **Issues:** Use GitHub Issues for bug reports
- **Documentation:** See `/docs/` directory

## Development Status

**Current Phase:** Phase 0 - Project Setup ✅  
**Next Phase:** Phase 1 - Foundation & Core Infrastructure

See `BACKEND_PROGRESS.md` for detailed implementation status.

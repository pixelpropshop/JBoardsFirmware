# Backend Configuration Strategy

## Board Variant Approach

### Strategy: Full-Featured Reference with Conditional Compilation

**Decision:** Build firmware for **JBOARD-16** (maximum capabilities), then use compile-time flags to disable features for smaller board variants.

**Benefits:**
- Single codebase for all variants
- Easy to add/remove features
- Test once, deploy to any variant
- Frontend automatically adapts via board info API

---

## Board Variants Configuration

### config.h - Board Variant Definitions

```cpp
// Board variant selection (set ONE of these in platformio.ini)
// #define BOARD_JBOARD_2   // 2 outputs, basic features
// #define BOARD_JBOARD_4   // 4 outputs, mid-range features
// #define BOARD_JBOARD_8   // 8 outputs, advanced features
#define BOARD_JBOARD_16     // 16 outputs, all features (REFERENCE)

// Automatically configure based on variant
#ifdef BOARD_JBOARD_16
  #define BOARD_NAME "JBOARD-16"
  #define NUM_PIXEL_OUTPUTS 16
  #define MAX_PIXELS_PER_OUTPUT 2048
  #define FEATURE_SENSORS true
  #define FEATURE_RTC true
  #define FEATURE_OLED true
  #define FEATURE_AUDIO true
  #define FEATURE_JBOARD_NETWORK true
  #define FEATURE_FSEQ true
  
#elif defined(BOARD_JBOARD_8)
  #define BOARD_NAME "JBOARD-8"
  #define NUM_PIXEL_OUTPUTS 8
  #define MAX_PIXELS_PER_OUTPUT 2048
  #define FEATURE_SENSORS true
  #define FEATURE_RTC false
  #define FEATURE_OLED false
  #define FEATURE_AUDIO true
  #define FEATURE_JBOARD_NETWORK true
  #define FEATURE_FSEQ true
  
#elif defined(BOARD_JBOARD_4)
  #define BOARD_NAME "JBOARD-4"
  #define NUM_PIXEL_OUTPUTS 4
  #define MAX_PIXELS_PER_OUTPUT 1024
  #define FEATURE_SENSORS false
  #define FEATURE_RTC false
  #define FEATURE_OLED false
  #define FEATURE_AUDIO false
  #define FEATURE_JBOARD_NETWORK true
  #define FEATURE_FSEQ false
  
#elif defined(BOARD_JBOARD_2)
  #define BOARD_NAME "JBOARD-2"
  #define NUM_PIXEL_OUTPUTS 2
  #define MAX_PIXELS_PER_OUTPUT 1024
  #define FEATURE_SENSORS false
  #define FEATURE_RTC false
  #define FEATURE_OLED false
  #define FEATURE_AUDIO false
  #define FEATURE_JBOARD_NETWORK false
  #define FEATURE_FSEQ false
  
#else
  #error "No board variant defined! Set BOARD_JBOARD_X in platformio.ini"
#endif

// Hardware specifications
#define ESP32_VARIANT "ESP32-S3"  // or "ESP32-WROVER-E" for production
#define FLASH_SIZE_MB 16
#define PSRAM_SIZE_MB 8
#define FIRMWARE_VERSION "1.0.0"
```

### platformio.ini - Build Configurations

```ini
# Default environment (full-featured reference board)
[env:jboard-16]
platform = espressif32
board = esp32-s3-devkitc-1
framework = arduino

build_flags =
    -DBOARD_JBOARD_16
    -DCORE_DEBUG_LEVEL=3
    -DBOARD_HAS_PSRAM
    -mfix-esp32-psram-cache-issue
    -DARDUINO_USB_CDC_ON_BOOT=1

lib_deps = ${common.lib_deps}
monitor_speed = 115200
upload_speed = 921600

# Other board variants
[env:jboard-8]
platform = espressif32
board = esp32-s3-devkitc-1
framework = arduino
build_flags = -DBOARD_JBOARD_8 ${common.build_flags}
lib_deps = ${common.lib_deps}

[env:jboard-4]
platform = espressif32
board = esp32-s3-devkitc-1
framework = arduino
build_flags = -DBOARD_JBOARD_4 ${common.build_flags}
lib_deps = ${common.lib_deps}

[env:jboard-2]
platform = espressif32
board = esp32-s3-devkitc-1
framework = arduino
build_flags = -DBOARD_JBOARD_2 ${common.build_flags}
lib_deps = ${common.lib_deps}

# Common settings
[common]
build_flags =
    -DCORE_DEBUG_LEVEL=3
    -DBOARD_HAS_PSRAM
    -mfix-esp32-psram-cache-issue
    -DARDUINO_USB_CDC_ON_BOOT=1

lib_deps =
    # Core Web Server
    ESP Async WebServer @ ^1.2.3
    AsyncTCP @ ^1.1.1
    ArduinoJson @ ^6.21.3
    
    # LED Control
    fastled/FastLED @ ^3.6.0
    
    # Storage
    adafruit/SD @ ^1.2.4
    
    # RTC Support
    adafruit/RTClib @ ^2.1.1
    
    # OLED Display
    adafruit/Adafruit SSD1306 @ ^2.5.7
    adafruit/Adafruit GFX Library @ ^1.11.5
    
    # Sensor Libraries (Adafruit Unified Sensor framework)
    adafruit/Adafruit Unified Sensor @ ^1.1.9
    adafruit/Adafruit LIS3DH @ ^1.2.4
    adafruit/Adafruit LSM6DS @ ^4.6.3
    adafruit/Adafruit ICM20X @ ^2.0.5
    adafruit/Adafruit VL53L0X @ ^1.2.2
    adafruit/Adafruit BH1750 @ ^1.3.0
    adafruit/Adafruit VEML7700 Library @ ^2.1.5
    adafruit/Adafruit TSL2591 Library @ ^1.4.1
    adafruit/Adafruit APDS9960 Library @ ^1.2.5
    adafruit/Adafruit TCS34725 @ ^1.4.3
    adafruit/Adafruit BME280 Library @ ^2.2.2
    adafruit/Adafruit BMP3XX Library @ ^2.1.2
    adafruit/Adafruit SHT31 Library @ ^2.2.0
    adafruit/Adafruit BME680 Library @ ^2.0.2
    
    # Time
    arduino-libraries/NTPClient @ ^3.2.1
```

---

## Hardware Specifications

### Development Hardware
- **Board:** ESP32-S3 DevKit
- **Flash:** 16MB
- **PSRAM:** 8MB
- **USB:** Native USB (CDC) for programming/serial

### Production Hardware
- **Module:** ESP32 WROVER-E
- **Flash:** 16MB
- **PSRAM:** 8MB
- **Form Factor:** Module for PCB integration

---

## Sensor Support Matrix

### Motion & Orientation
| Sensor | Type | Interface | Library | Priority |
|--------|------|-----------|---------|----------|
| LIS3DH | 3-axis accelerometer | I2C/SPI | Adafruit_LIS3DH | HIGH |
| LSM6DS3/DSOX | 6-axis IMU (accel + gyro) | I2C/SPI | Adafruit_LSM6DS | HIGH |
| ICM20948 | 9-axis IMU (accel + gyro + mag) | I2C/SPI | Adafruit_ICM20X | MEDIUM |
| HCSR501 | PIR motion detection | Digital GPIO | Built-in | HIGH |
| RCWL0516 | Microwave doppler motion | Digital GPIO | Built-in | MEDIUM |
| SW420 | Vibration sensor | Digital GPIO | Built-in | LOW |
| KY002 | Tap/vibration switch | Digital GPIO | Built-in | LOW |

### Distance & Proximity
| Sensor | Type | Interface | Library | Priority |
|--------|------|-----------|---------|----------|
| HCSR04 | Ultrasonic distance | Digital GPIO | NewPing | MEDIUM |
| VL53L0X | Time-of-flight distance | I2C | Adafruit_VL53L0X | MEDIUM |

### Light & Color
| Sensor | Type | Interface | Library | Priority |
|--------|------|-----------|---------|----------|
| BH1750 | Ambient light (lux) | I2C | Adafruit_BH1750 | HIGH |
| VEML7700 | Ambient light (lux) | I2C | Adafruit_VEML7700 | MEDIUM |
| TSL2561 | Light sensor | I2C | Adafruit_TSL2591 | LOW |
| TSL2591 | Light sensor (better) | I2C | Adafruit_TSL2591 | MEDIUM |
| APDS9960 | RGB + Gesture + Proximity | I2C | Adafruit_APDS9960 | MEDIUM |
| TCS34725 | RGB color sensor | I2C | Adafruit_TCS34725 | MEDIUM |

### Environmental
| Sensor | Type | Interface | Library | Priority |
|--------|------|-----------|---------|----------|
| BME280 | Temp + Humidity + Pressure | I2C/SPI | Adafruit_BME280 | HIGH |
| BMP280 | Temp + Pressure | I2C/SPI | Adafruit_BMP280 | MEDIUM |
| BMP390 | Precision pressure/altitude | I2C/SPI | Adafruit_BMP3XX | LOW |
| SHT31 | Temp + Humidity | I2C | Adafruit_SHT31 | MEDIUM |
| SHTC3 | Temp + Humidity (low power) | I2C | Adafruit_SHTC3 | LOW |
| BME680 | Temp + Hum + Press + Gas | I2C/SPI | Adafruit_BME680 | MEDIUM |

### Audio
| Sensor | Type | Interface | Library | Priority |
|--------|------|-----------|---------|----------|
| INMP441 | I2S MEMS microphone | I2S | ESP32 I2S | HIGH |
| ICS43434 | I2S MEMS microphone | I2S | ESP32 I2S | HIGH |

### Real-Time Clock
| Module | Type | Interface | Library | Priority |
|--------|------|-----------|---------|----------|
| DS3231 | RTC with temperature | I2C | RTClib | HIGH |
| MCP7940 | RTC with SRAM | I2C | RTClib | MEDIUM |
| PCF8563 | RTC low power | I2C | RTClib | MEDIUM |

### Generic Inputs
| Type | Interface | Implementation | Priority |
|------|-----------|----------------|----------|
| Digital buttons | GPIO | Built-in digitalRead | HIGH |
| Analog inputs | ADC | Built-in analogRead | HIGH |
| Switches | GPIO | Built-in digitalRead | HIGH |

---

## Sensor Framework Design

### Auto-Detection System

```cpp
class SensorManager {
public:
    void scanI2C() {
        // Scan I2C bus for known sensor addresses
        // Automatically detect and initialize sensors
    }
    
    void registerSensor(Sensor* sensor) {
        sensors.push_back(sensor);
    }
    
    std::vector<Sensor*> getDetectedSensors() {
        return sensors;
    }
    
private:
    std::vector<Sensor*> sensors;
};

// Base sensor class
class Sensor {
public:
    virtual bool detect() = 0;  // Try to detect sensor on bus
    virtual bool initialize() = 0;
    virtual float read() = 0;
    virtual String getType() = 0;
    virtual String getUnit() = 0;
};

// Example: LIS3DH implementation
class LIS3DHSensor : public Sensor {
private:
    Adafruit_LIS3DH lis;
    
public:
    bool detect() override {
        return lis.begin(0x18) || lis.begin(0x19);  // Try both addresses
    }
    
    bool initialize() override {
        lis.setRange(LIS3DH_RANGE_4_G);
        return true;
    }
    
    float read() override {
        lis.read();
        return sqrt(pow(lis.x_g, 2) + pow(lis.y_g, 2) + pow(lis.z_g, 2));
    }
    
    String getType() override { return "accelerometer"; }
    String getUnit() override { return "g"; }
};
```

### Conditional Compilation for Sensors

```cpp
void SensorManager::autoDetect() {
    #if FEATURE_SENSORS
        Wire.begin();
        
        // Try to detect each sensor type
        #ifdef SENSOR_LIS3DH_ENABLED
        auto lis3dh = new LIS3DHSensor();
        if (lis3dh->detect()) {
            lis3dh->initialize();
            registerSensor(lis3dh);
        }
        #endif
        
        #ifdef SENSOR_BME280_ENABLED
        auto bme280 = new BME280Sensor();
        if (bme280->detect()) {
            bme280->initialize();
            registerSensor(bme280);
        }
        #endif
        
        // ... etc for all sensors
    #endif
}
```

---

## MVP Implementation Phases

### MVP Scope (Critical Path)
Focus on core functionality first, expand sensors later.

**MVP Includes:**
- Phase 1: Foundation (web server, config, logging)
- Phase 2: Network (WiFi, AP, mDNS, captive portal)
- Phase 3: System (info, OTA updates, restart)
- Phase 5: Board Config (variant detection)
- Phase 6: Pixel Management (FastLED integration)
- Phase 7: Effects Engine (all 16 effects)

**MVP Excludes (Add After):**
- Phase 4: Hardware (RTC, OLED) - Optional features
- Phase 8: Sequences (can use effects for now)
- Phase 9: Sensors (extensive work, defer to Phase 2 of development)
- Phase 10: JBoard Network (P2P networking, Phase 2)

**Timeline:**
- MVP: ~15-19 days (Phases 1, 2, 3, 5, 6, 7)
- Full Implementation: +15-21 days (Phases 4, 8, 9, 10)

---

## Conditional Compilation Strategy

### Feature-Based Compilation

All features compile by default for JBOARD-16, but can be conditionally excluded:

```cpp
// In APIServer.cpp
void APIServer::registerEndpoints() {
    // Core endpoints (always included)
    registerNetworkEndpoints();
    registerSystemEndpoints();
    registerBoardEndpoints();
    registerPixelEndpoints();
    registerEffectsEndpoints();
    
    // Conditional endpoints
    #if FEATURE_SENSORS
    registerSensorEndpoints();
    #endif
    
    #if FEATURE_RTC || FEATURE_OLED
    registerHardwareEndpoints();
    #endif
    
    #if FEATURE_FSEQ || FEATURE_AUDIO
    registerSequenceEndpoints();
    registerAudioEndpoints();
    #endif
    
    #if FEATURE_JBOARD_NETWORK
    registerJBoardEndpoints();
    #endif
}
```

### Memory Optimization

For smaller boards, features are excluded at compile-time:
- Reduces firmware size
- Frees heap memory
- Removes unused code paths
- Frontend adapts automatically via board info API

---

## Development Workflow

### 1. Primary Development (JBOARD-16)
- Develop all features on full-featured board
- Test with all hardware modules
- Comprehensive feature testing

### 2. Variant Testing
- Compile for each variant
- Verify disabled features don't break build
- Test frontend adaptation
- Confirm memory usage within limits

### 3. Production Ready
- Flash firmware for specific board variant
- Frontend queries board info on first connection
- UI adapts to available features
- No manual configuration needed

---

## Action Plan

### Immediate Next Steps

1. **Set Up PlatformIO Project** (Day 1)
   - Create new project for ESP32-S3
   - Configure platformio.ini with all environments
   - Add all library dependencies
   - Verify compilation

2. **Create Project Structure** (Day 1)
   - Set up directory structure (src/, lib/, data/)
   - Create config.h with board variants
   - Create placeholder files for all modules
   - Set up git repository

3. **Phase 1: Foundation** (Days 2-3)
   - Implement ESPAsyncWebServer
   - Basic CORS middleware
   - Health check endpoint
   - Preferences/config system
   - Logging framework
   - Test on ESP32-S3 hardware

4. **Phase 2: Network** (Days 4-7)
   - WiFi Station management
   - Access Point mode
   - mDNS responder
   - WiFi profiles system
   - Captive portal (DNS server)
   - Test all network endpoints

5. **Phase 3: System** (Days 8-10)
   - System information endpoints
   - OTA update handler
   - Restart/factory reset
   - Configuration export
   - Test firmware updates

6. **Phase 5: Board Config** (Day 11)
   - Board info endpoint
   - Return variant, output count, capabilities
   - Test with frontend

7. **Phase 6: Pixel Management** (Days 12-15)
   - FastLED initialization
   - Multi-output support
   - Pixel configuration CRUD
   - Test endpoints

8. **Phase 7: Effects Engine** (Days 16-20)
   - Effect base system
   - Implement all 16 effects
   - Effect management endpoints
   - Preset system
   - Test all effects visually

9. **MVP Testing & Integration** (Days 21-22)
   - Full integration testing
   - Frontend + backend together
   - Performance optimization
   - Bug fixes

10. **Expand Features (Post-MVP)**
    - Phase 4: Hardware (RTC, OLED)
    - Phase 8: Sequences & FSEQ
    - Phase 9: Comprehensive sensor support
    - Phase 10: JBoard Network

---

## Sensor Implementation Strategy (Post-MVP)

### Phase 9A: Sensor Framework (2 days)
- Base sensor class
- Auto-detection system
- I2C bus scanning
- Sensor manager
- Configuration endpoints

### Phase 9B: Priority Sensors (3 days)
Implement in order:
1. **Digital inputs** (GPIO buttons, HCSR501 PIR) - Simple, high value
2. **BME280** (temp/humidity/pressure) - Popular, multi-function
3. **BH1750** (light sensor) - Simple I2C, useful for automation
4. **LIS3DH** (accelerometer) - Motion detection, gesture
5. **INMP441** (I2S mic) - Audio reactive potential

### Phase 9C: Additional Sensors (As Needed)
- Add sensors based on user demand
- Modular design allows easy addition
- Each sensor = separate class file
- Auto-detection makes them plug-and-play

---

## Summary & Recommendations

### ✅ Approved Strategy
1. **Build for JBOARD-16** (full-featured reference)
2. **Use conditional compilation** for smaller variants
3. **SD card support** for audio and FSEQ files
4. **Comprehensive sensor library** support with auto-detection
5. **ESP32-S3 / WROVER-E** as hardware platform
6. **MVP first** (core LED control), expand later

### 📋 Next Actions
1. **Review and approve** this config strategy
2. **Set up PlatformIO** environment
3. **Create initial project** structure
4. **Begin Phase 1** implementation
5. **Daily progress updates** in BACKEND_PROGRESS.md

### ⏱️ Timeline
- **MVP:** 15-19 days (core functionality)
- **Full Implementation:** +15-21 days (all features)
- **Total:** 30-40 days estimated

### 🎯 Success Criteria
- MVP compiles and runs on ESP32-S3
- All core endpoints functional
- Frontend integrates successfully
- LED effects display correctly
- Network management reliable
- OTA updates working

Ready to proceed when you give the green light! 🚀

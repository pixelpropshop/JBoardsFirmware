#ifndef CONFIG_H
#define CONFIG_H

// ============================================================================
// JSense Board Configuration
// ============================================================================
// This file defines board variants and hardware configuration for all
// JBOARD models (JBOARD-2, JBOARD-4, JBOARD-8, JBOARD-16)
//
// Board variant is set via platformio.ini build flags:
//   -DBOARD_JBOARD_2, -DBOARD_JBOARD_4, -DBOARD_JBOARD_8, or -DBOARD_JBOARD_16
// ============================================================================

// ----------------------------------------------------------------------------
// Board Variant Detection & Configuration
// ----------------------------------------------------------------------------

#ifdef BOARD_JBOARD_16
  #define BOARD_NAME "JBOARD-16"
  #define BOARD_VARIANT 16
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
  #define BOARD_VARIANT 8
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
  #define BOARD_VARIANT 4
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
  #define BOARD_VARIANT 2
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

// ----------------------------------------------------------------------------
// Hardware Specifications
// ----------------------------------------------------------------------------

#define ESP32_VARIANT "ESP32-S3"
#define FLASH_SIZE_MB 16
#define PSRAM_SIZE_MB 8

// Firmware version (semantic versioning)
#define FIRMWARE_VERSION "1.0.6"
#define FIRMWARE_VERSION_MAJOR 1
#define FIRMWARE_VERSION_MINOR 0
#define FIRMWARE_VERSION_PATCH 6

// ----------------------------------------------------------------------------
// Network Configuration
// ----------------------------------------------------------------------------

// Default Access Point settings (when device starts without WiFi config)
#define DEFAULT_AP_SSID "JSenseBoard"
#define DEFAULT_AP_PASSWORD "jsenseboard"
#define DEFAULT_AP_CHANNEL 6
#define DEFAULT_AP_MAX_CONNECTIONS 4
#define DEFAULT_AP_HIDDEN false

// Default hostname (will be suffixed with MAC address last 4 digits)
#define DEFAULT_HOSTNAME "jsenseboard"

// mDNS service name
#define MDNS_SERVICE "jsenseboard"

// Network timeout settings (milliseconds)
#define WIFI_CONNECT_TIMEOUT 10000
#define WIFI_RECONNECT_INTERVAL 5000
#define WIFI_MAX_RECONNECT_ATTEMPTS 5

// ----------------------------------------------------------------------------
// Web Server Configuration
// ----------------------------------------------------------------------------

#define WEB_SERVER_PORT 80
#define WEBSOCKET_PORT 81

// CORS settings
#define CORS_ALLOW_ORIGIN "*"
#define CORS_MAX_AGE 600

// ----------------------------------------------------------------------------
// LED / Pixel Configuration
// ----------------------------------------------------------------------------

// Default pixel configuration
#define DEFAULT_PIXEL_TYPE WS2812B
#define DEFAULT_COLOR_ORDER GRB
#define DEFAULT_BRIGHTNESS 128  // 0-255
#define DEFAULT_MAX_MILLIAMPS 2000  // Per output

// FastLED refresh rate
#define LED_REFRESH_RATE_HZ 60

// GPIO pins for pixel outputs (JBOARD-16 layout)
// Adjust these based on actual PCB design
#if BOARD_VARIANT >= 2
  #define PIXEL_PIN_1 16
  #define PIXEL_PIN_2 17
#endif

#if BOARD_VARIANT >= 4
  #define PIXEL_PIN_3 18
  #define PIXEL_PIN_4 19
#endif

#if BOARD_VARIANT >= 8
  #define PIXEL_PIN_5 4
  #define PIXEL_PIN_6 5
  #define PIXEL_PIN_7 6
  #define PIXEL_PIN_8 7
#endif

#if BOARD_VARIANT >= 16
  #define PIXEL_PIN_9 8
  #define PIXEL_PIN_10 9
  #define PIXEL_PIN_11 10
  #define PIXEL_PIN_12 11
  #define PIXEL_PIN_13 12
  #define PIXEL_PIN_14 13
  #define PIXEL_PIN_15 14
  #define PIXEL_PIN_16 15
#endif

// ----------------------------------------------------------------------------
// Storage Configuration
// ----------------------------------------------------------------------------

// Filesystem type (LittleFS recommended for ESP32-S3)
#define USE_LITTLEFS true

// SD card configuration (if FEATURE_AUDIO or FEATURE_FSEQ enabled)
// NOTE: SD card not yet implemented on JBOARD-16 hardware - pins set to -1
#if FEATURE_AUDIO || FEATURE_FSEQ
  #define SD_CARD_CS_PIN -1
  #define SD_CARD_MOSI_PIN -1
  #define SD_CARD_MISO_PIN -1
  #define SD_CARD_SCK_PIN -1
#endif

// Configuration file paths
#define CONFIG_FILE_PATH "/config.json"
#define WIFI_PROFILES_PATH "/wifi_profiles.json"
#define SEQUENCES_PATH "/sequences/"
#define LOGS_PATH "/logs/"

// ----------------------------------------------------------------------------
// I2C Configuration (for sensors, RTC, OLED)
// ----------------------------------------------------------------------------

#define I2C_SDA_PIN 21
#define I2C_SCL_PIN 22
#define I2C_FREQUENCY 400000  // 400 kHz

// ----------------------------------------------------------------------------
// RTC Configuration
// ----------------------------------------------------------------------------

#if FEATURE_RTC
  #define RTC_TYPE DS3231  // or DS1307, MCP7940, PCF8563
#endif

// ----------------------------------------------------------------------------
// OLED Display Configuration
// ----------------------------------------------------------------------------

#if FEATURE_OLED
  #define OLED_WIDTH 128
  #define OLED_HEIGHT 64
  #define OLED_ADDRESS 0x3C
  #define OLED_RESET_PIN -1  // -1 if sharing Arduino reset pin
#endif

// ----------------------------------------------------------------------------
// Sensor Configuration
// ----------------------------------------------------------------------------

#if FEATURE_SENSORS
  // I2C sensor addresses (default addresses, auto-detection will find them)
  #define SENSOR_LIS3DH_ADDR 0x18  // or 0x19
  #define SENSOR_LSM6DS_ADDR 0x6A  // or 0x6B
  #define SENSOR_BME280_ADDR 0x76  // or 0x77
  #define SENSOR_BH1750_ADDR 0x23  // or 0x5C
  
  // Sensor sampling rate (milliseconds)
  #define SENSOR_SAMPLE_RATE 1000  // 1 second
  #define SENSOR_FAST_SAMPLE_RATE 100  // 100ms for high-speed sensors
  
  // Historical data storage
  #define SENSOR_HISTORY_SIZE 100  // Number of readings to store per sensor
#endif

// ----------------------------------------------------------------------------
// Logging Configuration
// ----------------------------------------------------------------------------

// Log levels: 0=NONE, 1=ERROR, 2=WARN, 3=INFO, 4=DEBUG, 5=VERBOSE
#define LOG_LEVEL 3  // INFO

// Log to serial
#define LOG_SERIAL true
#define LOG_SERIAL_BAUD 115200

// Log to file (requires SD card)
#define LOG_TO_FILE false
#define LOG_FILE_MAX_SIZE 1048576  // 1MB
#define LOG_FILE_MAX_COUNT 5  // Keep 5 log files

// ----------------------------------------------------------------------------
// NTP / Time Configuration
// ----------------------------------------------------------------------------

#define NTP_SERVER "pool.ntp.org"
#define NTP_UPDATE_INTERVAL 3600000  // 1 hour in milliseconds
#define DEFAULT_TIMEZONE "UTC"
#define DEFAULT_GMT_OFFSET 0

// ----------------------------------------------------------------------------
// OTA Update Configuration
// ----------------------------------------------------------------------------

#define OTA_ENABLED true
#define OTA_PORT 3232
#define OTA_PASSWORD "jsenseboard"  // Should be changed by user

// ----------------------------------------------------------------------------
// Memory Management
// ----------------------------------------------------------------------------

// Heap warning thresholds
#define LOW_HEAP_THRESHOLD 10000  // Bytes
#define CRITICAL_HEAP_THRESHOLD 5000  // Bytes

// Stack size for tasks
#define TASK_STACK_SIZE 4096

// ----------------------------------------------------------------------------
// Watchdog Timer
// ----------------------------------------------------------------------------

#define WATCHDOG_TIMEOUT_SECONDS 30

// ----------------------------------------------------------------------------
// Debug Options
// ----------------------------------------------------------------------------

// Enable debug output
#ifdef DEBUG
  #define DEBUG_NETWORK true
  #define DEBUG_PIXELS true
  #define DEBUG_EFFECTS true
  #define DEBUG_SENSORS true
  #define DEBUG_MEMORY true
#else
  #define DEBUG_NETWORK false
  #define DEBUG_PIXELS false
  #define DEBUG_EFFECTS false
  #define DEBUG_SENSORS false
  #define DEBUG_MEMORY false
#endif

#endif // CONFIG_H

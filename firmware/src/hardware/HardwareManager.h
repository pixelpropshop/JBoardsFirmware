#ifndef HARDWARE_MANAGER_H
#define HARDWARE_MANAGER_H

#include <Arduino.h>
#include <Wire.h>
#include <time.h>

// Forward declarations for optional hardware
// These will be conditionally compiled based on board variant
class Adafruit_SSD1306;
class RTC_DS3231;
class RTC_DS1307;

enum class DisplayMode {
    OFF,
    CLOCK,
    IP_ADDRESS,
    STATUS,
    ROTATING
};

class HardwareManager {
public:
    HardwareManager();
    ~HardwareManager();
    
    // Initialization
    void begin();
    
    // RTC Functions
    bool hasRTC();
    String getRTCTime();
    bool setRTCTime(int year, int month, int day, int hour, int minute, int second);
    bool syncRTCFromNTP();
    String getRTCInfo();
    
    // OLED Functions
    bool hasOLED();
    bool setDisplayMode(DisplayMode mode);
    DisplayMode getDisplayMode();
    bool setDisplayBrightness(uint8_t brightness); // 0-255
    bool setDisplayTimeout(uint32_t timeoutMs);
    bool displayTestPattern();
    void updateDisplay(); // Called from main loop
    String getDisplayInfo();
    
    // I2C Functions
    bool scanI2C();
    String getI2CDevices();
    
private:
    // I2C
    bool i2cInitialized;
    uint8_t i2cSDA;
    uint8_t i2cSCL;
    
    // RTC
    bool rtcPresent;
    bool rtcInitialized;
    RTC_DS3231* rtcDS3231;
    RTC_DS1307* rtcDS1307;
    bool isDS3231; // true if DS3231, false if DS1307
    
    // OLED
    bool oledPresent;
    bool oledInitialized;
    Adafruit_SSD1306* display;
    DisplayMode currentMode;
    uint8_t displayBrightness;
    uint32_t displayTimeout;
    uint32_t lastDisplayUpdate;
    uint32_t lastDisplayActivity;
    bool displaySleeping;
    
    // Private methods
    void initI2C();
    void detectRTC();
    void detectOLED();
    void wakeDisplay();
    void sleepDisplay();
    void renderClock();
    void renderIPAddress();
    void renderStatus();
    void renderRotating();
};

#endif // HARDWARE_MANAGER_H

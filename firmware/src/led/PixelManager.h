#ifndef PIXEL_MANAGER_H
#define PIXEL_MANAGER_H

#include <Arduino.h>
#include <FastLED.h>
#include <ArduinoJson.h>
#include "config.h"

// Pixel output configuration structure
struct PixelOutput {
    uint8_t id;                    // Output number (1-16)
    String name;                   // User-defined name
    bool enabled;                  // Output enabled/disabled
    uint8_t gpio;                  // GPIO pin number
    uint16_t pixelCount;           // Number of pixels
    String pixelType;              // "WS2812B", "WS2811", "SK6812", etc.
    String colorOrder;             // "RGB", "GRB", "BRG", etc.
    uint8_t voltage;               // Supply voltage (5 or 12)
    uint16_t maxCurrent;           // Max current in mA
    String status;                 // "active", "idle", "error", "testing"
    CRGB* leds;                    // FastLED array pointer
    bool initialized;              // Initialization status
};

class PixelManager {
public:
    PixelManager();
    ~PixelManager();
    
    // Initialization
    void begin();
    bool initializeOutput(uint8_t outputId);
    void initializeAllOutputs();
    
    // Configuration
    bool updateOutput(uint8_t outputId, const JsonObject& config);
    bool setOutputEnabled(uint8_t outputId, bool enabled);
    
    // Output control
    void setColor(uint8_t outputId, CRGB color);
    void setAllColors(CRGB color);
    void fill(uint8_t outputId, CRGB color, uint16_t start, uint16_t count);
    void clear(uint8_t outputId);
    void clearAll();
    void show(uint8_t outputId);
    void showAll();
    
    // Testing
    bool testOutput(uint8_t outputId, const String& effectId, const JsonObject& params, uint8_t brightness);
    void stopTest(uint8_t outputId);
    bool testAllOutputs(const String& effectId, const JsonObject& params, uint8_t brightness);
    void turnOffAll();
    
    // Getters
    PixelOutput* getOutput(uint8_t outputId);
    uint8_t getOutputCount() { return NUM_PIXEL_OUTPUTS; }
    uint16_t getMaxPixelsPerOutput() { return MAX_PIXELS_PER_OUTPUT; }
    const char* getBoardVariant() { return BOARD_NAME; }
    
    // Power calculation
    uint32_t calculateOutputPower(uint8_t outputId);
    uint32_t calculateTotalPower();
    
    // Status
    void getOutputsConfig(JsonDocument& doc);
    
private:
    PixelOutput outputs[NUM_PIXEL_OUTPUTS];
    
    // Helper functions
    uint8_t getGPIOForOutput(uint8_t outputId);
    void loadConfiguration();
    void saveConfiguration();
    uint32_t getPixelTypeCode(const String& type);
    uint32_t getColorOrderCode(const String& order);
};

#endif // PIXEL_MANAGER_H

#ifndef EFFECTS_MANAGER_H
#define EFFECTS_MANAGER_H

#include <Arduino.h>
#include <FastLED.h>
#include <Preferences.h>
#include <ArduinoJson.h>
#include <LittleFS.h>
#include <vector>
#include <map>

// Effect types enum
enum EffectType {
    EFFECT_SOLID = 0,
    EFFECT_RAINBOW = 1,
    EFFECT_CHASE = 2,
    EFFECT_BREATHE = 3,
    EFFECT_SPARKLE = 4,
    EFFECT_FIRE = 5,
    EFFECT_COLOR_FLOW = 6,
    EFFECT_STROBE = 7,
    EFFECT_BARS = 8,
    EFFECT_WAVE = 9,
    EFFECT_CONFETTI = 10,
    EFFECT_METEOR = 11,
    EFFECT_NOISE = 12,
    EFFECT_MATRIX = 13,
    EFFECT_POLICE = 14,
    EFFECT_AURORA = 15
};

// Effect parameter structure
struct EffectParameter {
    String name;
    String type;  // "number", "color", "select"
    float value;
    float min;
    float max;
    std::vector<String> options;  // For select type
};

// Effect preset structure
struct EffectPreset {
    String id;
    String name;
    EffectType type;
    std::map<String, float> parameters;
    int brightness;
};

// Effect state structure
struct EffectState {
    EffectType type;
    std::map<String, float> parameters;
    int brightness;
    bool power;
    unsigned long lastUpdate;
    float phase;  // Animation phase (0.0 - 1.0)
    uint16_t counter;  // General purpose counter
};

class EffectsManager {
public:
    EffectsManager();
    
    // Initialization
    void begin(CRGB* leds, uint16_t numLeds);
    
    // Effect control
    bool applyEffect(EffectType type, const std::map<String, float>& parameters);
    bool setPower(bool on);
    bool setBrightness(int brightness);
    void update();  // Call in loop() for animations
    
    // Effect info
    std::vector<String> getAvailableEffects();
    std::vector<EffectParameter> getEffectParameters(EffectType type);
    EffectState getCurrentState();
    
    // Presets
    bool savePreset(const String& id, const String& name);
    bool loadPreset(const String& id);
    bool deletePreset(const String& id);
    std::vector<EffectPreset> listPresets();
    
private:
    CRGB* _leds;
    uint16_t _numLeds;
    EffectState _state;
    Preferences _prefs;
    bool _prefsInitialized;
    
    // Effect implementations
    void effectSolid();
    void effectRainbow();
    void effectChase();
    void effectBreathe();
    void effectSparkle();
    void effectFire();
    void effectColorFlow();
    void effectStrobe();
    void effectBars();
    void effectWave();
    void effectConfetti();
    void effectMeteor();
    void effectNoise();
    void effectMatrix();
    void effectPolice();
    void effectAurora();
    
    // Utility functions
    CRGB getParameterColor(const String& paramName);
    float getParameter(const String& paramName, float defaultValue);
    void fillAll(CRGB color);
    void fadeToBlackBy(uint8_t amount);
    CRGB wheel(uint8_t wheelPos);
    
    // Preset storage (LittleFS)
    bool savePresetToFS(const EffectPreset& preset);
    bool loadPresetFromFS(const String& id, EffectPreset& preset);
    void ensurePresetsDir();
};

#endif // EFFECTS_MANAGER_H

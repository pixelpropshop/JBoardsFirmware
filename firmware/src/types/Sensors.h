#ifndef SENSORS_H
#define SENSORS_H

#include <Arduino.h>
#include <map>
#include <vector>

// Sensor types
enum SensorType {
    SENSOR_TEMPERATURE,
    SENSOR_HUMIDITY,
    SENSOR_PRESSURE,
    SENSOR_LIGHT,
    SENSOR_SOUND,
    SENSOR_MOTION,
    SENSOR_PROXIMITY,
    SENSOR_AIR_QUALITY,
    SENSOR_VOLTAGE,
    SENSOR_CURRENT,
    SENSOR_CUSTOM
};

// Sensor status
enum SensorStatus {
    SENSOR_ACTIVE,
    SENSOR_IDLE,
    SENSOR_ERROR,
    SENSOR_DISABLED,
    SENSOR_CALIBRATING
};

// Alert severity
enum class AlertSeverity {
    INFO,
    WARNING,
    CRITICAL
};

// Automation condition types
enum class AutomationCondition {
    ABOVE,
    BELOW,
    EQUALS,
    CHANGED
};

// Automation action types
enum class AutomationAction {
    TRIGGER_EFFECT,
    SEND_ALERT,
    WEBHOOK
};

// Threshold configuration
struct SensorThreshold {
    float min;
    float max;
    float warningMin;
    float warningMax;
};

// Sensor configuration
struct SensorConfig {
    bool enabled;
    uint16_t samplingRate;      // Milliseconds between readings
    uint8_t smoothing;           // Number of samples to average (1-10)
    SensorThreshold threshold;
    float calibrationOffset;
    String triggerEffect;        // Effect to trigger on threshold breach
};

// Sensor reading
struct SensorReading {
    float value;
    String unit;
    unsigned long timestamp;
    SensorStatus status;
};

// Sensor data
struct Sensor {
    String id;
    String name;
    SensorType type;
    SensorReading currentReading;
    SensorConfig config;
    uint8_t pin;
    unsigned long lastCalibrated;
    
    // History buffer (simplified)
    std::vector<float> historyValues;
    std::vector<unsigned long> historyTimestamps;
};

// Sensor alert
struct SensorAlert {
    String id;
    String sensorId;
    String sensorName;
    AlertSeverity severity;
    String message;
    unsigned long timestamp;
    bool acknowledged;
};

// Sensor statistics
struct SensorStats {
    float min;
    float max;
    float avg;
    float current;
};

// Calibration result
struct CalibrationResult {
    String sensorId;
    float referenceValue;
    float measuredValue;
    float offset;
    unsigned long timestamp;
};

// Automation rule
struct AutomationRule {
    String id;
    String name;
    bool enabled;
    String sensorId;
    AutomationCondition condition;
    float threshold;
    AutomationAction action;
    String actionParameter;
};

// Sensor group
struct SensorGroup {
    String id;
    String name;
    std::vector<String> sensorIds;
};

// Helper functions
inline String sensorTypeToString(SensorType type) {
    switch (type) {
        case SENSOR_TEMPERATURE: return "temperature";
        case SENSOR_HUMIDITY: return "humidity";
        case SENSOR_PRESSURE: return "pressure";
        case SENSOR_LIGHT: return "light";
        case SENSOR_SOUND: return "sound";
        case SENSOR_MOTION: return "motion";
        case SENSOR_PROXIMITY: return "proximity";
        case SENSOR_AIR_QUALITY: return "air_quality";
        case SENSOR_VOLTAGE: return "voltage";
        case SENSOR_CURRENT: return "current";
        default: return "custom";
    }
}

inline SensorType sensorTypeFromString(const String& type) {
    if (type == "temperature") return SENSOR_TEMPERATURE;
    if (type == "humidity") return SENSOR_HUMIDITY;
    if (type == "pressure") return SENSOR_PRESSURE;
    if (type == "light") return SENSOR_LIGHT;
    if (type == "sound") return SENSOR_SOUND;
    if (type == "motion") return SENSOR_MOTION;
    if (type == "proximity") return SENSOR_PROXIMITY;
    if (type == "air_quality") return SENSOR_AIR_QUALITY;
    if (type == "voltage") return SENSOR_VOLTAGE;
    if (type == "current") return SENSOR_CURRENT;
    return SENSOR_CUSTOM;
}

inline String sensorStatusToString(SensorStatus status) {
    switch (status) {
        case SENSOR_ACTIVE: return "active";
        case SENSOR_IDLE: return "idle";
        case SENSOR_ERROR: return "error";
        case SENSOR_DISABLED: return "disabled";
        case SENSOR_CALIBRATING: return "calibrating";
        default: return "idle";
    }
}

inline String alertSeverityToString(AlertSeverity severity) {
    switch (severity) {
        case AlertSeverity::INFO: return "info";
        case AlertSeverity::WARNING: return "warning";
        case AlertSeverity::CRITICAL: return "critical";
        default: return "info";
    }
}

inline String automationConditionToString(AutomationCondition condition) {
    switch (condition) {
        case AutomationCondition::ABOVE: return "above";
        case AutomationCondition::BELOW: return "below";
        case AutomationCondition::EQUALS: return "equals";
        case AutomationCondition::CHANGED: return "changed";
        default: return "above";
    }
}

inline String automationActionToString(AutomationAction action) {
    switch (action) {
        case AutomationAction::TRIGGER_EFFECT: return "trigger_effect";
        case AutomationAction::SEND_ALERT: return "send_alert";
        case AutomationAction::WEBHOOK: return "webhook";
        default: return "trigger_effect";
    }
}

inline String getUnitForType(SensorType type) {
    switch (type) {
        case SENSOR_TEMPERATURE: return "°C";
        case SENSOR_HUMIDITY: return "%";
        case SENSOR_PRESSURE: return "hPa";
        case SENSOR_LIGHT: return "lux";
        case SENSOR_SOUND: return "dB";
        case SENSOR_MOTION: return "%";
        case SENSOR_PROXIMITY: return "cm";
        case SENSOR_AIR_QUALITY: return "AQI";
        case SENSOR_VOLTAGE: return "V";
        case SENSOR_CURRENT: return "A";
        default: return "";
    }
}

#endif // SENSORS_H

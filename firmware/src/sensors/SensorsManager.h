#ifndef SENSORS_MANAGER_H
#define SENSORS_MANAGER_H

#include <Arduino.h>
#include <Preferences.h>
#include <vector>
#include <map>
#include "../types/Sensors.h"

class SensorsManager {
public:
    SensorsManager();
    
    // Initialization
    void begin();
    void update();
    
    // Sensor management
    bool addSensor(const Sensor& sensor);
    bool removeSensor(const String& id);
    Sensor* getSensor(const String& id);
    std::vector<Sensor*> listSensors();
    
    // Configuration
    bool updateSensorConfig(const String& id, const SensorConfig& config);
    
    // Calibration
    CalibrationResult calibrateSensor(const String& id, float referenceValue);
    
    // Reading & History
    bool readSensor(const String& id);
    std::vector<float> getSensorHistory(const String& id, unsigned long start, unsigned long end);
    SensorStats getSensorStats(const String& id, unsigned long duration);
    
    // Alerts
    std::vector<SensorAlert> getAlerts(bool acknowledgedOnly = false);
    bool acknowledgeAlert(const String& alertId);
    void clearAllAlerts();
    String createAlert(const String& sensorId, AlertSeverity severity, const String& message);
    bool deleteAlert(const String& alertId);
    
    // Automation
    std::vector<AutomationRule> getAutomationRules();
    String createAutomationRule(const AutomationRule& rule);
    bool updateAutomationRule(const String& ruleId, const AutomationRule& rule);
    bool deleteAutomationRule(const String& ruleId);
    
    // Data Export
    String exportDataCSV(const String& sensorId, unsigned long duration);
    String exportDataJSON(const String& sensorId, unsigned long duration);
    
    // Sensor Groups
    std::vector<SensorGroup> getSensorGroups();
    
private:
    std::map<String, Sensor> _sensors;
    std::vector<SensorAlert> _alerts;
    Preferences _prefs;
    
    // Internal helpers
    void checkThresholds(Sensor& sensor);
    void addAlert(const String& sensorId, const String& sensorName, 
                  AlertSeverity severity, const String& message);
    String generateSensorId();
    String generateAlertId();
    float readAnalogSensor(uint8_t pin);
    void addToHistory(Sensor& sensor, float value, unsigned long timestamp);
};

#endif // SENSORS_MANAGER_H

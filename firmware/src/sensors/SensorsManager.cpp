#include "SensorsManager.h"

#define MAX_HISTORY_SIZE 100  // Maximum history samples per sensor
#define MAX_ALERTS 50         // Maximum alert history

SensorsManager::SensorsManager() {
    // Constructor
}

void SensorsManager::begin() {
    _prefs.begin("sensors", false);
    
    // Initialize with some default sensors if enabled
    #if FEATURE_SENSORS
    Serial.println("[Sensors] Manager initialized");
    #else
    Serial.println("[Sensors] Feature disabled in config");
    #endif
}

void SensorsManager::update() {
    unsigned long now = millis();
    
    // Update all enabled sensors based on their sampling rate
    for (auto& pair : _sensors) {
        Sensor& sensor = pair.second;
        
        if (!sensor.config.enabled) {
            continue;
        }
        
        // Check if it's time to sample this sensor
        if (now - sensor.currentReading.timestamp >= sensor.config.samplingRate) {
            readSensor(sensor.id);
        }
    }
}

bool SensorsManager::addSensor(const Sensor& sensor) {
    Sensor newSensor = sensor;
    
    if (newSensor.id.length() == 0) {
        newSensor.id = generateSensorId();
    }
    
    // Initialize with defaults if not set
    if (newSensor.config.samplingRate == 0) {
        newSensor.config.samplingRate = 1000; // 1 second default
    }
    if (newSensor.config.smoothing == 0) {
        newSensor.config.smoothing = 3; // Average 3 samples
    }
    
    newSensor.currentReading.unit = getUnitForType(newSensor.type);
    newSensor.currentReading.timestamp = millis();
    newSensor.currentReading.status = SENSOR_IDLE;
    newSensor.lastCalibrated = 0;
    
    _sensors[newSensor.id] = newSensor;
    return true;
}

bool SensorsManager::removeSensor(const String& id) {
    auto it = _sensors.find(id);
    if (it == _sensors.end()) {
        return false;
    }
    
    _sensors.erase(it);
    return true;
}

Sensor* SensorsManager::getSensor(const String& id) {
    auto it = _sensors.find(id);
    if (it != _sensors.end()) {
        return &it->second;
    }
    return nullptr;
}

std::vector<Sensor*> SensorsManager::listSensors() {
    std::vector<Sensor*> sensors;
    for (auto& pair : _sensors) {
        sensors.push_back(&pair.second);
    }
    return sensors;
}

bool SensorsManager::updateSensorConfig(const String& id, const SensorConfig& config) {
    Sensor* sensor = getSensor(id);
    if (sensor == nullptr) {
        return false;
    }
    
    sensor->config = config;
    
    // Update status based on enabled state
    if (!config.enabled) {
        sensor->currentReading.status = SENSOR_DISABLED;
    } else if (sensor->currentReading.status == SENSOR_DISABLED) {
        sensor->currentReading.status = SENSOR_IDLE;
    }
    
    return true;
}

CalibrationResult SensorsManager::calibrateSensor(const String& id, float referenceValue) {
    CalibrationResult result;
    result.sensorId = id;
    result.referenceValue = referenceValue;
    result.timestamp = millis();
    
    Sensor* sensor = getSensor(id);
    if (sensor == nullptr) {
        result.measuredValue = 0;
        result.offset = 0;
        return result;
    }
    
    // Set calibrating status
    sensor->currentReading.status = SENSOR_CALIBRATING;
    
    // Take a reading
    readSensor(id);
    
    // Calculate offset
    result.measuredValue = sensor->currentReading.value;
    result.offset = referenceValue - result.measuredValue;
    
    // Apply calibration offset
    sensor->config.calibrationOffset = result.offset;
    sensor->lastCalibrated = result.timestamp;
    
    // Restore status
    sensor->currentReading.status = SENSOR_ACTIVE;
    
    return result;
}

bool SensorsManager::readSensor(const String& id) {
    Sensor* sensor = getSensor(id);
    if (sensor == nullptr || !sensor->config.enabled) {
        return false;
    }
    
    // Read raw value from sensor
    float rawValue = readAnalogSensor(sensor->pin);
    
    // Apply calibration offset
    float calibratedValue = rawValue + sensor->config.calibrationOffset;
    
    // Update reading
    sensor->currentReading.value = calibratedValue;
    sensor->currentReading.timestamp = millis();
    sensor->currentReading.status = SENSOR_ACTIVE;
    
    // Add to history
    addToHistory(*sensor, calibratedValue, sensor->currentReading.timestamp);
    
    // Check thresholds
    checkThresholds(*sensor);
    
    return true;
}

std::vector<float> SensorsManager::getSensorHistory(const String& id, unsigned long start, unsigned long end) {
    std::vector<float> history;
    
    Sensor* sensor = getSensor(id);
    if (sensor == nullptr) {
        return history;
    }
    
    // Filter history by time range
    for (size_t i = 0; i < sensor->historyTimestamps.size(); i++) {
        if (sensor->historyTimestamps[i] >= start && sensor->historyTimestamps[i] <= end) {
            history.push_back(sensor->historyValues[i]);
        }
    }
    
    return history;
}

SensorStats SensorsManager::getSensorStats(const String& id, unsigned long duration) {
    SensorStats stats;
    stats.min = 0;
    stats.max = 0;
    stats.avg = 0;
    stats.current = 0;
    
    Sensor* sensor = getSensor(id);
    if (sensor == nullptr || sensor->historyValues.empty()) {
        return stats;
    }
    
    unsigned long now = millis();
    unsigned long startTime = now - duration;
    
    float sum = 0;
    int count = 0;
    bool first = true;
    
    // Calculate stats from history within duration
    for (size_t i = 0; i < sensor->historyTimestamps.size(); i++) {
        if (sensor->historyTimestamps[i] >= startTime) {
            float value = sensor->historyValues[i];
            
            if (first) {
                stats.min = value;
                stats.max = value;
                first = false;
            } else {
                if (value < stats.min) stats.min = value;
                if (value > stats.max) stats.max = value;
            }
            
            sum += value;
            count++;
        }
    }
    
    if (count > 0) {
        stats.avg = sum / count;
    }
    
    stats.current = sensor->currentReading.value;
    
    return stats;
}

std::vector<SensorAlert> SensorsManager::getAlerts(bool acknowledgedOnly) {
    if (!acknowledgedOnly) {
        return _alerts;
    }
    
    std::vector<SensorAlert> filtered;
    for (const auto& alert : _alerts) {
        if (alert.acknowledged == acknowledgedOnly) {
            filtered.push_back(alert);
        }
    }
    return filtered;
}

bool SensorsManager::acknowledgeAlert(const String& alertId) {
    for (auto& alert : _alerts) {
        if (alert.id == alertId) {
            alert.acknowledged = true;
            return true;
        }
    }
    return false;
}

void SensorsManager::clearAllAlerts() {
    _alerts.clear();
}

String SensorsManager::createAlert(const String& sensorId, AlertSeverity severity, const String& message) {
    Sensor* sensor = getSensor(sensorId);
    String sensorName = sensor ? sensor->name : "Unknown";
    
    SensorAlert alert;
    alert.id = generateAlertId();
    alert.sensorId = sensorId;
    alert.sensorName = sensorName;
    alert.severity = severity;
    alert.message = message;
    alert.timestamp = millis();
    alert.acknowledged = false;
    
    _alerts.push_back(alert);
    
    // Limit alert history
    if (_alerts.size() > MAX_ALERTS) {
        _alerts.erase(_alerts.begin());
    }
    
    return alert.id;
}

bool SensorsManager::deleteAlert(const String& alertId) {
    for (auto it = _alerts.begin(); it != _alerts.end(); ++it) {
        if (it->id == alertId) {
            _alerts.erase(it);
            return true;
        }
    }
    return false;
}

std::vector<AutomationRule> SensorsManager::getAutomationRules() {
    // Stub implementation - return empty for now
    std::vector<AutomationRule> rules;
    return rules;
}

String SensorsManager::createAutomationRule(const AutomationRule& rule) {
    // Stub implementation - returns generated ID
    return "rule-" + String(millis());
}

bool SensorsManager::updateAutomationRule(const String& ruleId, const AutomationRule& rule) {
    // Stub implementation
    return true;
}

bool SensorsManager::deleteAutomationRule(const String& ruleId) {
    // Stub implementation
    return true;
}

String SensorsManager::exportDataCSV(const String& sensorId, unsigned long duration) {
    String csv = "timestamp,sensorId,sensorName,value,unit\n";
    
    if (sensorId.isEmpty()) {
        // Export all sensors
        for (auto& pair : _sensors) {
            Sensor* sensor = &pair.second;
            unsigned long now = millis();
            unsigned long startTime = now - duration;
            
            for (size_t i = 0; i < sensor->historyTimestamps.size(); i++) {
                if (sensor->historyTimestamps[i] >= startTime) {
                    csv += String(sensor->historyTimestamps[i]) + ",";
                    csv += sensor->id + ",";
                    csv += sensor->name + ",";
                    csv += String(sensor->historyValues[i], 2) + ",";
                    csv += sensor->currentReading.unit + "\n";
                }
            }
        }
    } else {
        // Export specific sensor
        Sensor* sensor = getSensor(sensorId);
        if (sensor) {
            unsigned long now = millis();
            unsigned long startTime = now - duration;
            
            for (size_t i = 0; i < sensor->historyTimestamps.size(); i++) {
                if (sensor->historyTimestamps[i] >= startTime) {
                    csv += String(sensor->historyTimestamps[i]) + ",";
                    csv += sensor->id + ",";
                    csv += sensor->name + ",";
                    csv += String(sensor->historyValues[i], 2) + ",";
                    csv += sensor->currentReading.unit + "\n";
                }
            }
        }
    }
    
    return csv;
}

String SensorsManager::exportDataJSON(const String& sensorId, unsigned long duration) {
    String json = "{\"export\":{\"timestamp\":" + String(millis()) + 
                  ",\"duration\":" + String(duration) + ",\"sensors\":[";
    
    bool firstSensor = true;
    
    if (sensorId.isEmpty()) {
        // Export all sensors
        for (auto& pair : _sensors) {
            Sensor* sensor = &pair.second;
            if (!firstSensor) json += ",";
            firstSensor = false;
            
            json += "{\"id\":\"" + sensor->id + "\",";
            json += "\"name\":\"" + sensor->name + "\",";
            json += "\"type\":\"" + sensorTypeToString(sensor->type) + "\",";
            json += "\"unit\":\"" + sensor->currentReading.unit + "\",";
            json += "\"data\":[";
            
            unsigned long now = millis();
            unsigned long startTime = now - duration;
            bool firstData = true;
            
            for (size_t i = 0; i < sensor->historyTimestamps.size(); i++) {
                if (sensor->historyTimestamps[i] >= startTime) {
                    if (!firstData) json += ",";
                    firstData = false;
                    json += "{\"t\":" + String(sensor->historyTimestamps[i]) + 
                           ",\"v\":" + String(sensor->historyValues[i], 2) + "}";
                }
            }
            json += "]}";
        }
    } else {
        // Export specific sensor
        Sensor* sensor = getSensor(sensorId);
        if (sensor) {
            json += "{\"id\":\"" + sensor->id + "\",";
            json += "\"name\":\"" + sensor->name + "\",";
            json += "\"type\":\"" + sensorTypeToString(sensor->type) + "\",";
            json += "\"unit\":\"" + sensor->currentReading.unit + "\",";
            json += "\"data\":[";
            
            unsigned long now = millis();
            unsigned long startTime = now - duration;
            bool firstData = true;
            
            for (size_t i = 0; i < sensor->historyTimestamps.size(); i++) {
                if (sensor->historyTimestamps[i] >= startTime) {
                    if (!firstData) json += ",";
                    firstData = false;
                    json += "{\"t\":" + String(sensor->historyTimestamps[i]) + 
                           ",\"v\":" + String(sensor->historyValues[i], 2) + "}";
                }
            }
            json += "]}";
        }
    }
    
    json += "]}}";
    return json;
}

std::vector<SensorGroup> SensorsManager::getSensorGroups() {
    // Stub implementation - return empty for now
    std::vector<SensorGroup> groups;
    return groups;
}

// Private helper functions

void SensorsManager::checkThresholds(Sensor& sensor) {
    float value = sensor.currentReading.value;
    const SensorThreshold& threshold = sensor.config.threshold;
    
    // Check critical thresholds
    if (value < threshold.min) {
        addAlert(sensor.id, sensor.name, AlertSeverity::CRITICAL,
                 sensor.name + " below minimum threshold (" + 
                 String(value, 1) + " < " + String(threshold.min, 1) + ")");
    } else if (value > threshold.max) {
        addAlert(sensor.id, sensor.name, AlertSeverity::CRITICAL,
                 sensor.name + " above maximum threshold (" + 
                 String(value, 1) + " > " + String(threshold.max, 1) + ")");
    }
    // Check warning thresholds
    else if (value < threshold.warningMin) {
        addAlert(sensor.id, sensor.name, AlertSeverity::WARNING,
                 sensor.name + " below warning threshold (" + 
                 String(value, 1) + " < " + String(threshold.warningMin, 1) + ")");
    } else if (value > threshold.warningMax) {
        addAlert(sensor.id, sensor.name, AlertSeverity::WARNING,
                 sensor.name + " above warning threshold (" + 
                 String(value, 1) + " > " + String(threshold.warningMax, 1) + ")");
    }
}

void SensorsManager::addAlert(const String& sensorId, const String& sensorName, 
                               AlertSeverity severity, const String& message) {
    // Don't add duplicate alerts (check last alert)
    if (!_alerts.empty()) {
        const SensorAlert& lastAlert = _alerts.back();
        if (lastAlert.sensorId == sensorId && 
            lastAlert.message == message && 
            !lastAlert.acknowledged) {
            return; // Don't add duplicate
        }
    }
    
    SensorAlert alert;
    alert.id = generateAlertId();
    alert.sensorId = sensorId;
    alert.sensorName = sensorName;
    alert.severity = severity;
    alert.message = message;
    alert.timestamp = millis();
    alert.acknowledged = false;
    
    _alerts.push_back(alert);
    
    // Limit alert history
    if (_alerts.size() > MAX_ALERTS) {
        _alerts.erase(_alerts.begin());
    }
}

String SensorsManager::generateSensorId() {
    return "sensor-" + String(millis());
}

String SensorsManager::generateAlertId() {
    return "alert-" + String(millis());
}

float SensorsManager::readAnalogSensor(uint8_t pin) {
    // Read analog value from pin
    int rawValue = analogRead(pin);
    
    // Convert to voltage (ESP32 ADC: 0-4095 = 0-3.3V)
    float voltage = (rawValue / 4095.0) * 3.3;
    
    // For now, return raw analog reading
    // In production, this would convert based on sensor type
    return rawValue;
}

void SensorsManager::addToHistory(Sensor& sensor, float value, unsigned long timestamp) {
    sensor.historyValues.push_back(value);
    sensor.historyTimestamps.push_back(timestamp);
    
    // Limit history size
    if (sensor.historyValues.size() > MAX_HISTORY_SIZE) {
        sensor.historyValues.erase(sensor.historyValues.begin());
        sensor.historyTimestamps.erase(sensor.historyTimestamps.begin());
    }
}

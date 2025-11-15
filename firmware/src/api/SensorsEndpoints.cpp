#include "SensorsEndpoints.h"
#include <ArduinoJson.h>

void setupSensorsEndpoints(AsyncWebServer& server, SensorsManager& sensorsManager) {
    
    // 1. GET /api/sensors - List all sensors
    server.on("/api/sensors", HTTP_GET, [&sensorsManager](AsyncWebServerRequest *request) {
        StaticJsonDocument<4096> doc;
        JsonArray sensorsArray = doc.to<JsonArray>();
        
        std::vector<Sensor*> sensors = sensorsManager.listSensors();
        
        for (Sensor* sensor : sensors) {
            JsonObject sensorObj = sensorsArray.createNestedObject();
            
            sensorObj["id"] = sensor->id;
            sensorObj["name"] = sensor->name;
            sensorObj["type"] = sensorTypeToString(sensor->type);
            
            // Current reading
            JsonObject reading = sensorObj.createNestedObject("currentReading");
            reading["value"] = sensor->currentReading.value;
            reading["unit"] = sensor->currentReading.unit;
            reading["timestamp"] = sensor->currentReading.timestamp;
            reading["status"] = sensorStatusToString(sensor->currentReading.status);
            
            // Configuration
            JsonObject config = sensorObj.createNestedObject("config");
            config["enabled"] = sensor->config.enabled;
            config["samplingRate"] = sensor->config.samplingRate;
            config["smoothing"] = sensor->config.smoothing;
            
            JsonObject threshold = config.createNestedObject("threshold");
            threshold["min"] = sensor->config.threshold.min;
            threshold["max"] = sensor->config.threshold.max;
            threshold["warningMin"] = sensor->config.threshold.warningMin;
            threshold["warningMax"] = sensor->config.threshold.warningMax;
            
            config["calibrationOffset"] = sensor->config.calibrationOffset;
            config["triggerEffect"] = sensor->config.triggerEffect;
            
            sensorObj["pin"] = sensor->pin;
            sensorObj["lastCalibrated"] = sensor->lastCalibrated;
        }
        
        String response;
        serializeJson(doc, response);
        request->send(200, "application/json", response);
    });
    
    // 2. GET /api/sensors/{id} - Get sensor by ID
    server.on("^\\/api\\/sensors\\/([a-zA-Z0-9\\-]+)$", HTTP_GET, [&sensorsManager](AsyncWebServerRequest *request) {
        String id = request->pathArg(0);
        
        Sensor* sensor = sensorsManager.getSensor(id);
        if (sensor == nullptr) {
            request->send(404, "application/json", "{\"error\":\"Sensor not found\"}");
            return;
        }
        
        StaticJsonDocument<2048> doc;
        
        doc["id"] = sensor->id;
        doc["name"] = sensor->name;
        doc["type"] = sensorTypeToString(sensor->type);
        
        // Current reading
        JsonObject reading = doc.createNestedObject("currentReading");
        reading["value"] = sensor->currentReading.value;
        reading["unit"] = sensor->currentReading.unit;
        reading["timestamp"] = sensor->currentReading.timestamp;
        reading["status"] = sensorStatusToString(sensor->currentReading.status);
        
        // Configuration
        JsonObject config = doc.createNestedObject("config");
        config["enabled"] = sensor->config.enabled;
        config["samplingRate"] = sensor->config.samplingRate;
        config["smoothing"] = sensor->config.smoothing;
        
        JsonObject threshold = config.createNestedObject("threshold");
        threshold["min"] = sensor->config.threshold.min;
        threshold["max"] = sensor->config.threshold.max;
        threshold["warningMin"] = sensor->config.threshold.warningMin;
        threshold["warningMax"] = sensor->config.threshold.warningMax;
        
        config["calibrationOffset"] = sensor->config.calibrationOffset;
        config["triggerEffect"] = sensor->config.triggerEffect;
        
        doc["pin"] = sensor->pin;
        doc["lastCalibrated"] = sensor->lastCalibrated;
        
        String response;
        serializeJson(doc, response);
        request->send(200, "application/json", response);
    });
    
    // 3. PUT /api/sensors/{id}/config - Update sensor configuration
    server.on("^\\/api\\/sensors\\/([a-zA-Z0-9\\-]+)\\/config$", HTTP_PUT, 
        [](AsyncWebServerRequest *request) {
            // Handle response in body handler
        },
        nullptr,
        [&sensorsManager](AsyncWebServerRequest *request, uint8_t *data, size_t len, size_t index, size_t total) {
            if (index + len == total) {
                String id = request->pathArg(0);
                
                Sensor* sensor = sensorsManager.getSensor(id);
                if (sensor == nullptr) {
                    request->send(404, "application/json", "{\"error\":\"Sensor not found\"}");
                    return;
                }
                
                StaticJsonDocument<1024> doc;
                DeserializationError error = deserializeJson(doc, data, len);
                
                if (error) {
                    request->send(400, "application/json", "{\"error\":\"Invalid JSON\"}");
                    return;
                }
                
                // Update configuration
                SensorConfig newConfig = sensor->config;
                
                if (doc.containsKey("enabled")) {
                    newConfig.enabled = doc["enabled"];
                }
                if (doc.containsKey("samplingRate")) {
                    newConfig.samplingRate = doc["samplingRate"];
                }
                if (doc.containsKey("smoothing")) {
                    newConfig.smoothing = doc["smoothing"];
                }
                if (doc.containsKey("calibrationOffset")) {
                    newConfig.calibrationOffset = doc["calibrationOffset"];
                }
                if (doc.containsKey("triggerEffect")) {
                    newConfig.triggerEffect = doc["triggerEffect"].as<String>();
                }
                
                if (doc.containsKey("threshold")) {
                    JsonObject threshold = doc["threshold"];
                    if (threshold.containsKey("min")) {
                        newConfig.threshold.min = threshold["min"];
                    }
                    if (threshold.containsKey("max")) {
                        newConfig.threshold.max = threshold["max"];
                    }
                    if (threshold.containsKey("warningMin")) {
                        newConfig.threshold.warningMin = threshold["warningMin"];
                    }
                    if (threshold.containsKey("warningMax")) {
                        newConfig.threshold.warningMax = threshold["warningMax"];
                    }
                }
                
                if (sensorsManager.updateSensorConfig(id, newConfig)) {
                    request->send(200, "application/json", "{\"success\":true,\"message\":\"Configuration updated\"}");
                } else {
                    request->send(500, "application/json", "{\"error\":\"Failed to update configuration\"}");
                }
            }
        }
    );
    
    // 4. POST /api/sensors/{id}/calibrate - Calibrate sensor
    server.on("^\\/api\\/sensors\\/([a-zA-Z0-9\\-]+)\\/calibrate$", HTTP_POST,
        [](AsyncWebServerRequest *request) {
            // Handle response in body handler
        },
        nullptr,
        [&sensorsManager](AsyncWebServerRequest *request, uint8_t *data, size_t len, size_t index, size_t total) {
            if (index + len == total) {
                String id = request->pathArg(0);
                
                StaticJsonDocument<256> doc;
                DeserializationError error = deserializeJson(doc, data, len);
                
                if (error || !doc.containsKey("referenceValue")) {
                    request->send(400, "application/json", "{\"error\":\"Invalid request - referenceValue required\"}");
                    return;
                }
                
                float referenceValue = doc["referenceValue"];
                
                CalibrationResult result = sensorsManager.calibrateSensor(id, referenceValue);
                
                StaticJsonDocument<512> responseDoc;
                responseDoc["success"] = true;
                responseDoc["message"] = "Sensor calibrated successfully";
                
                JsonObject calibration = responseDoc.createNestedObject("calibration");
                calibration["sensorId"] = result.sensorId;
                calibration["referenceValue"] = result.referenceValue;
                calibration["measuredValue"] = result.measuredValue;
                calibration["offset"] = result.offset;
                calibration["timestamp"] = result.timestamp;
                
                String response;
                serializeJson(responseDoc, response);
                request->send(200, "application/json", response);
            }
        }
    );
    
    // 5. GET /api/sensors/{id}/stats - Get sensor statistics
    server.on("^\\/api\\/sensors\\/([a-zA-Z0-9\\-]+)\\/stats$", HTTP_GET, [&sensorsManager](AsyncWebServerRequest *request) {
        String id = request->pathArg(0);
        
        // Default duration: 1 hour
        unsigned long duration = 3600000;
        if (request->hasParam("duration")) {
            duration = request->getParam("duration")->value().toInt();
        }
        
        SensorStats stats = sensorsManager.getSensorStats(id, duration);
        
        StaticJsonDocument<256> doc;
        doc["min"] = stats.min;
        doc["max"] = stats.max;
        doc["avg"] = stats.avg;
        doc["current"] = stats.current;
        
        String response;
        serializeJson(doc, response);
        request->send(200, "application/json", response);
    });
    
    // 6. GET /api/sensors/alerts - Get alerts
    server.on("/api/sensors/alerts", HTTP_GET, [&sensorsManager](AsyncWebServerRequest *request) {
        bool acknowledgedOnly = false;
        if (request->hasParam("acknowledged")) {
            acknowledgedOnly = request->getParam("acknowledged")->value() == "true";
        }
        
        std::vector<SensorAlert> alerts = sensorsManager.getAlerts(acknowledgedOnly);
        
        StaticJsonDocument<4096> doc;
        JsonArray alertsArray = doc.to<JsonArray>();
        
        for (const auto& alert : alerts) {
            JsonObject alertObj = alertsArray.createNestedObject();
            alertObj["id"] = alert.id;
            alertObj["sensorId"] = alert.sensorId;
            alertObj["sensorName"] = alert.sensorName;
            alertObj["severity"] = alertSeverityToString(alert.severity);
            alertObj["message"] = alert.message;
            alertObj["timestamp"] = alert.timestamp;
            alertObj["acknowledged"] = alert.acknowledged;
        }
        
        String response;
        serializeJson(doc, response);
        request->send(200, "application/json", response);
    });
    
    // 7. POST /api/sensors/alerts/{id}/acknowledge - Acknowledge alert
    server.on("^\\/api\\/sensors\\/alerts\\/([a-zA-Z0-9\\-]+)\\/acknowledge$", HTTP_POST, [&sensorsManager](AsyncWebServerRequest *request) {
        String alertId = request->pathArg(0);
        
        if (sensorsManager.acknowledgeAlert(alertId)) {
            request->send(200, "application/json", "{\"success\":true,\"message\":\"Alert acknowledged\"}");
        } else {
            request->send(404, "application/json", "{\"error\":\"Alert not found\"}");
        }
    });
    
    // 8. POST /api/sensors/alerts - Create custom alert
    server.on("/api/sensors/alerts", HTTP_POST,
        [](AsyncWebServerRequest *request) {
            // Handle response in body handler
        },
        nullptr,
        [&sensorsManager](AsyncWebServerRequest *request, uint8_t *data, size_t len, size_t index, size_t total) {
            if (index + len == total) {
                StaticJsonDocument<512> doc;
                DeserializationError error = deserializeJson(doc, data, len);
                
                if (error) {
                    request->send(400, "application/json", "{\"error\":\"Invalid JSON\"}");
                    return;
                }
                
                String sensorId = doc["sensorId"];
                String message = doc["message"];
                String severityStr = doc["severity"];
                
                AlertSeverity severity = AlertSeverity::INFO;
                if (severityStr == "critical") severity = AlertSeverity::CRITICAL;
                else if (severityStr == "warning") severity = AlertSeverity::WARNING;
                
                String alertId = sensorsManager.createAlert(sensorId, severity, message);
                
                StaticJsonDocument<256> responseDoc;
                responseDoc["success"] = true;
                responseDoc["alertId"] = alertId;
                responseDoc["message"] = "Alert created successfully";
                
                String response;
                serializeJson(responseDoc, response);
                request->send(200, "application/json", response);
            }
        }
    );
    
    // 9. DELETE /api/sensors/alerts/{id} - Delete alert
    server.on("^\\/api\\/sensors\\/alerts\\/([a-zA-Z0-9\\-]+)$", HTTP_DELETE, [&sensorsManager](AsyncWebServerRequest *request) {
        String alertId = request->pathArg(0);
        
        if (sensorsManager.deleteAlert(alertId)) {
            request->send(200, "application/json", "{\"success\":true,\"message\":\"Alert deleted\"}");
        } else {
            request->send(404, "application/json", "{\"error\":\"Alert not found\"}");
        }
    });
    
    // 10. GET /api/sensors/automation/rules - Get automation rules
    server.on("/api/sensors/automation/rules", HTTP_GET, [&sensorsManager](AsyncWebServerRequest *request) {
        std::vector<AutomationRule> rules = sensorsManager.getAutomationRules();
        
        DynamicJsonDocument doc(4096);
        JsonArray rulesArray = doc.to<JsonArray>();
        
        for (const auto& rule : rules) {
            JsonObject ruleObj = rulesArray.createNestedObject();
            ruleObj["id"] = rule.id;
            ruleObj["name"] = rule.name;
            ruleObj["enabled"] = rule.enabled;
            ruleObj["sensorId"] = rule.sensorId;
            ruleObj["condition"] = automationConditionToString(rule.condition);
            ruleObj["threshold"] = rule.threshold;
            ruleObj["action"] = automationActionToString(rule.action);
            ruleObj["actionParameter"] = rule.actionParameter;
        }
        
        String response;
        serializeJson(doc, response);
        request->send(200, "application/json", response);
    });
    
    // 11. POST /api/sensors/automation/rules - Create automation rule
    server.on("/api/sensors/automation/rules", HTTP_POST,
        [](AsyncWebServerRequest *request) {
            // Handle response in body handler
        },
        nullptr,
        [&sensorsManager](AsyncWebServerRequest *request, uint8_t *data, size_t len, size_t index, size_t total) {
            if (index + len == total) {
                StaticJsonDocument<1024> doc;
                DeserializationError error = deserializeJson(doc, data, len);
                
                if (error) {
                    request->send(400, "application/json", "{\"error\":\"Invalid JSON\"}");
                    return;
                }
                
                AutomationRule rule;
                rule.name = doc["name"].as<String>();
                rule.enabled = doc["enabled"] | true;
                rule.sensorId = doc["sensorId"].as<String>();
                rule.threshold = doc["threshold"];
                rule.actionParameter = doc["actionParameter"].as<String>();
                
                // Parse condition
                String conditionStr = doc["condition"];
                if (conditionStr == "above") rule.condition = AutomationCondition::ABOVE;
                else if (conditionStr == "below") rule.condition = AutomationCondition::BELOW;
                else if (conditionStr == "equals") rule.condition = AutomationCondition::EQUALS;
                else if (conditionStr == "changed") rule.condition = AutomationCondition::CHANGED;
                
                // Parse action
                String actionStr = doc["action"];
                if (actionStr == "trigger_effect") rule.action = AutomationAction::TRIGGER_EFFECT;
                else if (actionStr == "send_alert") rule.action = AutomationAction::SEND_ALERT;
                else if (actionStr == "webhook") rule.action = AutomationAction::WEBHOOK;
                
                String ruleId = sensorsManager.createAutomationRule(rule);
                
                StaticJsonDocument<256> responseDoc;
                responseDoc["success"] = true;
                responseDoc["ruleId"] = ruleId;
                responseDoc["message"] = "Automation rule created successfully";
                
                String response;
                serializeJson(responseDoc, response);
                request->send(200, "application/json", response);
            }
        }
    );
    
    // 12. PUT /api/sensors/automation/rules/{id} - Update automation rule
    server.on("^\\/api\\/sensors\\/automation\\/rules\\/([a-zA-Z0-9\\-]+)$", HTTP_PUT,
        [](AsyncWebServerRequest *request) {
            // Handle response in body handler
        },
        nullptr,
        [&sensorsManager](AsyncWebServerRequest *request, uint8_t *data, size_t len, size_t index, size_t total) {
            if (index + len == total) {
                String ruleId = request->pathArg(0);
                
                StaticJsonDocument<1024> doc;
                DeserializationError error = deserializeJson(doc, data, len);
                
                if (error) {
                    request->send(400, "application/json", "{\"error\":\"Invalid JSON\"}");
                    return;
                }
                
                AutomationRule rule;
                rule.id = ruleId;
                rule.name = doc["name"].as<String>();
                rule.enabled = doc["enabled"];
                rule.sensorId = doc["sensorId"].as<String>();
                rule.threshold = doc["threshold"];
                rule.actionParameter = doc["actionParameter"].as<String>();
                
                // Parse condition
                String conditionStr = doc["condition"];
                if (conditionStr == "above") rule.condition = AutomationCondition::ABOVE;
                else if (conditionStr == "below") rule.condition = AutomationCondition::BELOW;
                else if (conditionStr == "equals") rule.condition = AutomationCondition::EQUALS;
                else if (conditionStr == "changed") rule.condition = AutomationCondition::CHANGED;
                
                // Parse action
                String actionStr = doc["action"];
                if (actionStr == "trigger_effect") rule.action = AutomationAction::TRIGGER_EFFECT;
                else if (actionStr == "send_alert") rule.action = AutomationAction::SEND_ALERT;
                else if (actionStr == "webhook") rule.action = AutomationAction::WEBHOOK;
                
                if (sensorsManager.updateAutomationRule(ruleId, rule)) {
                    request->send(200, "application/json", "{\"success\":true,\"message\":\"Automation rule updated\"}");
                } else {
                    request->send(404, "application/json", "{\"error\":\"Rule not found\"}");
                }
            }
        }
    );
    
    // 13. DELETE /api/sensors/automation/rules/{id} - Delete automation rule
    server.on("^\\/api\\/sensors\\/automation\\/rules\\/([a-zA-Z0-9\\-]+)$", HTTP_DELETE, [&sensorsManager](AsyncWebServerRequest *request) {
        String ruleId = request->pathArg(0);
        
        if (sensorsManager.deleteAutomationRule(ruleId)) {
            request->send(200, "application/json", "{\"success\":true,\"message\":\"Automation rule deleted\"}");
        } else {
            request->send(404, "application/json", "{\"error\":\"Rule not found\"}");
        }
    });
    
    // 14. GET /api/sensors/export/csv - Export sensor data as CSV
    server.on("/api/sensors/export/csv", HTTP_GET, [&sensorsManager](AsyncWebServerRequest *request) {
        String sensorId = "";
        unsigned long duration = 3600000; // 1 hour default
        
        if (request->hasParam("sensorId")) {
            sensorId = request->getParam("sensorId")->value();
        }
        if (request->hasParam("duration")) {
            duration = request->getParam("duration")->value().toInt();
        }
        
        String csv = sensorsManager.exportDataCSV(sensorId, duration);
        
        AsyncWebServerResponse *response = request->beginResponse(200, "text/csv", csv);
        response->addHeader("Content-Disposition", "attachment; filename=\"sensor-data.csv\"");
        request->send(response);
    });
    
    // 15. GET /api/sensors/export/json - Export sensor data as JSON
    server.on("/api/sensors/export/json", HTTP_GET, [&sensorsManager](AsyncWebServerRequest *request) {
        String sensorId = "";
        unsigned long duration = 3600000; // 1 hour default
        
        if (request->hasParam("sensorId")) {
            sensorId = request->getParam("sensorId")->value();
        }
        if (request->hasParam("duration")) {
            duration = request->getParam("duration")->value().toInt();
        }
        
        String json = sensorsManager.exportDataJSON(sensorId, duration);
        
        AsyncWebServerResponse *response = request->beginResponse(200, "application/json", json);
        response->addHeader("Content-Disposition", "attachment; filename=\"sensor-data.json\"");
        request->send(response);
    });
    
    // 16. GET /api/sensors/groups - Get sensor groups
    server.on("/api/sensors/groups", HTTP_GET, [&sensorsManager](AsyncWebServerRequest *request) {
        std::vector<SensorGroup> groups = sensorsManager.getSensorGroups();
        
        DynamicJsonDocument doc(2048);
        JsonArray groupsArray = doc.to<JsonArray>();
        
        for (const auto& group : groups) {
            JsonObject groupObj = groupsArray.createNestedObject();
            groupObj["id"] = group.id;
            groupObj["name"] = group.name;
            
            JsonArray sensorsArray = groupObj.createNestedArray("sensors");
            for (const auto& sensorId : group.sensorIds) {
                sensorsArray.add(sensorId);
            }
        }
        
        String response;
        serializeJson(doc, response);
        request->send(200, "application/json", response);
    });
}

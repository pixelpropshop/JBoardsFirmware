# Sensors API

Environmental sensors, alerts, automation rules, and data logging.

## 83. Get All Sensors

**Endpoint:** `GET /api/sensors`

**Response:**
```json
[
  {
    "id": "temp-1",
    "name": "Temperature",
    "type": "temperature",
    "currentReading": {
      "value": 22.5,
      "unit": "°C",
      "timestamp": 1704902400000,
      "status": "active"
    },
    "config": {
      "enabled": true,
      "samplingRate": 1000,
      "smoothing": 3,
      "threshold": {
        "min": 15,
        "max": 30,
        "warningMin": 18,
        "warningMax": 28
      },
      "calibrationOffset": 0,
      "triggerEffect": "rainbow"
    },
    "pin": 34,
    "lastCalibrated": 1704816000000
  }
]
```

**Notes:**
- type: temperature, humidity, pressure, light, sound, motion, proximity, air_quality, voltage, current, custom
- status: active, idle, error, disabled, calibrating
- samplingRate: Milliseconds between readings (100-10000ms)
- smoothing: Samples to average (1-10)

## 84. Get Sensor by ID

**Endpoint:** `GET /api/sensors/{id}`

## 85. Update Sensor Configuration

**Endpoint:** `PUT /api/sensors/{id}/config`

**Request:**
```json
{
  "enabled": true,
  "samplingRate": 2000,
  "smoothing": 5,
  "threshold": {
    "min": 10,
    "max": 35,
    "warningMin": 15,
    "warningMax": 30
  },
  "calibrationOffset": -0.5,
  "triggerEffect": "rainbow"
}
```

## 86. Calibrate Sensor

**Endpoint:** `POST /api/sensors/{id}/calibrate`

**Request:**
```json
{
  "referenceValue": 25.0
}
```

**Response:**
```json
{
  "success": true,
  "message": "Sensor calibrated successfully",
  "calibration": {
    "sensorId": "temp-1",
    "referenceValue": 25.0,
    "measuredValue": 24.5,
    "offset": 0.5,
    "timestamp": 1704902400000
  }
}
```

## 87. Get Sensor History

**Endpoint:** `GET /api/sensors/{id}/history`

**Query Parameters:**
- start: Start timestamp (milliseconds)
- end: End timestamp (milliseconds)

**Notes:**
- Maximum range: 24 hours
- Used for historical charts

## 88. Get Sensor Statistics

**Endpoint:** `GET /api/sensors/{id}/stats`

**Query Parameters:**
- duration: Duration in milliseconds (default: 3600000 = 1 hour)

**Response:**
```json
{
  "min": 20.5,
  "max": 25.3,
  "avg": 22.8,
  "current": 22.5
}
```

## 89. Get Sensor Alerts

**Endpoint:** `GET /api/sensors/alerts`

**Query Parameters:**
- acknowledged: Filter by acknowledged status (default: false)

**Response:**
```json
[
  {
    "id": "alert-1",
    "sensorId": "temp-1",
    "sensorName": "Temperature",
    "severity": "warning",
    "message": "Temperature above warning threshold (29°C > 28°C)",
    "timestamp": 1704902400000,
    "acknowledged": false
  }
]
```

**Notes:**
- severity: info, warning, critical
- Sorted by timestamp (newest first)

## 90. Acknowledge Alert

**Endpoint:** `POST /api/sensors/alerts/{id}/acknowledge`

## 91. Clear All Alerts

**Endpoint:** `DELETE /api/sensors/alerts`

## 92. Get Automation Rules

**Endpoint:** `GET /api/sensors/automation/rules`

**Response:**
```json
[
  {
    "id": "rule-1",
    "name": "High Temperature Alert",
    "sensorId": "temp-1",
    "condition": "above",
    "value1": 28,
    "action": "send_alert",
    "actionData": "Temperature too high!",
    "enabled": true
  }
]
```

**Notes:**
- condition: above, below, between, outside
- action: trigger_effect, send_alert, trigger_scene
- value2: Required for 'between' and 'outside' conditions

## 93. Create Automation Rule

**Endpoint:** `POST /api/sensors/automation/rules`

**Request:**
```json
{
  "name": "Motion Trigger",
  "sensorId": "motion-1",
  "condition": "above",
  "value1": 50,
  "action": "trigger_effect",
  "actionData": "strobe",
  "enabled": true
}
```

## 94. Update Automation Rule

**Endpoint:** `PUT /api/sensors/automation/rules/{id}`

## 95. Delete Automation Rule

**Endpoint:** `DELETE /api/sensors/automation/rules/{id}`

## 96. Get Sensor Groups

**Endpoint:** `GET /api/sensors/groups`

**Response:**
```json
[
  {
    "id": "group-1",
    "name": "Environmental",
    "sensorIds": ["temp-1", "humid-1"],
    "icon": "🌡️"
  }
]
```

## 97. Create Sensor Group

**Endpoint:** `POST /api/sensors/groups`

## 98. Export Sensor Data

**Endpoint:** `GET /api/sensors/export`

**Query Parameters:**
- format: Export format ('csv' or 'json', default: 'csv')

**Response:** Binary file download (CSV or JSON)

**CSV Format:**
```csv
Sensor,Value,Unit,Timestamp
Temperature,22.5,°C,2025-01-10T15:30:00Z
```

**Notes:**
- CSV: Current readings only
- JSON: Complete data including history and config

## Sensor Types

| Type | Unit | Range | Description |
|------|------|-------|-------------|
| temperature | °C | -40 to 125 | Temperature sensor |
| humidity | % | 0 to 100 | Relative humidity |
| pressure | hPa | 300 to 1100 | Barometric pressure |
| light | lux | 0 to 10000 | Light intensity |
| sound | dB | 0 to 120 | Sound level |
| motion | % | 0 to 100 | Motion detection |
| proximity | cm | 0 to 400 | Distance sensor |
| air_quality | AQI | 0 to 500 | Air quality index |
| voltage | V | 0 to 50 | Voltage measurement |
| current | A | 0 to 50 | Current measurement |
| custom | varies | varies | User-defined |

# Sensor System Design

## Overview

The JSenseBoard sensor system provides flexible sensor integration with support for multiple GPIO configurations, communication protocols, and sensor types. The system follows a template-based approach with future support for custom sensor definitions.

## Architecture

### Phase 1: Template-Based Sensors (Current)
- Predefined sensor templates with built-in drivers
- Configure pins and parameters through UI
- Firmware includes drivers for common sensors

### Phase 2: Custom Sensors (Future)
- User-defined sensors with flexible GPIO configs
- Generic I2C/SPI protocol support
- Advanced parameter configuration

## Pin Configuration Types

### PinConfig Interface

```typescript
type PinConfig = 
  | SinglePinConfig
  | DualPinConfig
  | I2CConfig
  | SPIConfig
  | OneWireConfig

interface SinglePinConfig {
  type: 'analog' | 'digital'
  pin: number
}

interface DualPinConfig {
  type: 'dual'
  pinA: number
  pinB: number
  pinAMode: 'trigger' | 'data' | 'input'
  pinBMode: 'echo' | 'clock' | 'output'
}

interface I2CConfig {
  type: 'i2c'
  sda: number
  scl: number
  address: number  // 7-bit I2C address
  frequency?: number  // Default 100kHz
}

interface SPIConfig {
  type: 'spi'
  miso: number
  mosi: number
  sck: number
  cs: number
  frequency?: number  // Default 1MHz
  mode?: 0 | 1 | 2 | 3  // SPI mode
}

interface OneWireConfig {
  type: 'onewire'
  pin: number
  parasitePower?: boolean
}
```

## Sensor Template Structure

### SensorTemplate Interface

```typescript
interface SensorTemplate {
  id: string
  name: string
  manufacturer: string
  description: string
  category: SensorCategory
  
  // Hardware requirements
  protocol: 'analog' | 'digital' | 'i2c' | 'spi' | 'onewire'
  pinConfigType: PinConfig['type']
  defaultPinConfig: Partial<PinConfig>
  
  // Measurement info
  measurementType: SensorType
  unit: string
  range: { min: number; max: number }
  precision: number  // Decimal places
  
  // Default configuration
  defaultConfig: {
    samplingRate: number
    smoothing: number
    threshold: {
      min: number
      max: number
      warningMin?: number
      warningMax?: number
    }
  }
  
  // Calibration
  supportsCalibration: boolean
  calibrationType?: 'offset' | 'scale' | 'multipoint'
  
  // Driver reference
  driverName: string
  firmwareVersion: string  // Minimum firmware version required
  
  // Documentation
  datasheet?: string
  wiring?: string  // Wiring diagram URL
  notes?: string
}
```

## Predefined Sensor Templates

### Temperature Sensors

#### DHT22 (Temperature + Humidity)
```typescript
{
  id: 'dht22',
  name: 'DHT22',
  manufacturer: 'Aosong',
  description: 'Digital temperature and humidity sensor',
  category: 'environmental',
  protocol: 'digital',
  pinConfigType: 'digital',
  defaultPinConfig: { type: 'digital', pin: 4 },
  measurementType: SensorType.TEMPERATURE,  // Also creates humidity sensor
  unit: '°C',
  range: { min: -40, max: 80 },
  precision: 1,
  defaultConfig: {
    samplingRate: 2000,  // 2 second minimum
    smoothing: 3,
    threshold: { min: 15, max: 30, warningMin: 18, warningMax: 28 }
  },
  supportsCalibration: true,
  calibrationType: 'offset',
  driverName: 'DHT',
  firmwareVersion: '1.0.0'
}
```

#### DS18B20 (OneWire Temperature)
```typescript
{
  id: 'ds18b20',
  name: 'DS18B20',
  manufacturer: 'Dallas/Maxim',
  description: 'Digital temperature sensor (OneWire)',
  category: 'environmental',
  protocol: 'onewire',
  pinConfigType: 'onewire',
  defaultPinConfig: { type: 'onewire', pin: 4, parasitePower: false },
  measurementType: SensorType.TEMPERATURE,
  unit: '°C',
  range: { min: -55, max: 125 },
  precision: 2,
  defaultConfig: {
    samplingRate: 1000,
    smoothing: 2,
    threshold: { min: 15, max: 30 }
  },
  supportsCalibration: true,
  calibrationType: 'offset',
  driverName: 'OneWire_DS18B20',
  firmwareVersion: '1.0.0',
  notes: 'Supports multiple sensors on same bus. Use unique ROM addresses.'
}
```

#### BME280 (I2C Environmental Sensor)
```typescript
{
  id: 'bme280',
  name: 'BME280',
  manufacturer: 'Bosch',
  description: 'I2C temperature, humidity, and pressure sensor',
  category: 'environmental',
  protocol: 'i2c',
  pinConfigType: 'i2c',
  defaultPinConfig: { 
    type: 'i2c', 
    sda: 21, 
    scl: 22, 
    address: 0x76  // Can also be 0x77
  },
  measurementType: SensorType.TEMPERATURE,  // Also creates humidity + pressure
  unit: '°C',
  range: { min: -40, max: 85 },
  precision: 2,
  defaultConfig: {
    samplingRate: 1000,
    smoothing: 3,
    threshold: { min: 15, max: 30 }
  },
  supportsCalibration: true,
  calibrationType: 'offset',
  driverName: 'BME280',
  firmwareVersion: '1.0.0',
  notes: 'I2C address can be 0x76 or 0x77 depending on SDO pin'
}
```

### Distance Sensors

#### HC-SR04 (Ultrasonic)
```typescript
{
  id: 'hcsr04',
  name: 'HC-SR04',
  manufacturer: 'Generic',
  description: 'Ultrasonic distance sensor',
  category: 'proximity',
  protocol: 'digital',
  pinConfigType: 'dual',
  defaultPinConfig: { 
    type: 'dual', 
    pinA: 5, 
    pinB: 18,
    pinAMode: 'trigger',
    pinBMode: 'echo'
  },
  measurementType: SensorType.DISTANCE,
  unit: 'cm',
  range: { min: 2, max: 400 },
  precision: 0,
  defaultConfig: {
    samplingRate: 100,
    smoothing: 5,
    threshold: { min: 10, max: 200 }
  },
  supportsCalibration: false,
  driverName: 'HCSR04',
  firmwareVersion: '1.0.0',
  notes: 'Requires 5V power. Use voltage divider on echo pin if needed.'
}
```

#### VL53L0X (Laser TOF)
```typescript
{
  id: 'vl53l0x',
  name: 'VL53L0X',
  manufacturer: 'STMicroelectronics',
  description: 'Laser time-of-flight distance sensor',
  category: 'proximity',
  protocol: 'i2c',
  pinConfigType: 'i2c',
  defaultPinConfig: { 
    type: 'i2c', 
    sda: 21, 
    scl: 22, 
    address: 0x29
  },
  measurementType: SensorType.DISTANCE,
  unit: 'mm',
  range: { min: 30, max: 2000 },
  precision: 0,
  defaultConfig: {
    samplingRate: 50,
    smoothing: 3,
    threshold: { min: 50, max: 1000 }
  },
  supportsCalibration: true,
  calibrationType: 'offset',
  driverName: 'VL53L0X',
  firmwareVersion: '1.0.0'
}
```

### Motion/Presence Sensors

#### PIR Sensor
```typescript
{
  id: 'pir',
  name: 'PIR Motion Sensor',
  manufacturer: 'Generic',
  description: 'Passive infrared motion detector',
  category: 'motion',
  protocol: 'digital',
  pinConfigType: 'digital',
  defaultPinConfig: { type: 'digital', pin: 13 },
  measurementType: SensorType.MOTION,
  unit: 'detected',
  range: { min: 0, max: 1 },
  precision: 0,
  defaultConfig: {
    samplingRate: 100,
    smoothing: 1,
    threshold: {}
  },
  supportsCalibration: false,
  driverName: 'PIR',
  firmwareVersion: '1.0.0',
  notes: 'Binary output: 0 = no motion, 1 = motion detected'
}
```

### Light Sensors

#### BH1750 (I2C Light Sensor)
```typescript
{
  id: 'bh1750',
  name: 'BH1750',
  manufacturer: 'ROHM',
  description: 'Digital ambient light sensor',
  category: 'light',
  protocol: 'i2c',
  pinConfigType: 'i2c',
  defaultPinConfig: { 
    type: 'i2c', 
    sda: 21, 
    scl: 22, 
    address: 0x23  // Can be 0x5C with ADDR high
  },
  measurementType: SensorType.LIGHT,
  unit: 'lux',
  range: { min: 1, max: 65535 },
  precision: 0,
  defaultConfig: {
    samplingRate: 500,
    smoothing: 3,
    threshold: { min: 100, max: 1000 }
  },
  supportsCalibration: true,
  calibrationType: 'scale',
  driverName: 'BH1750',
  firmwareVersion: '1.0.0'
}
```

#### Photoresistor (Analog)
```typescript
{
  id: 'photoresistor',
  name: 'Photoresistor (LDR)',
  manufacturer: 'Generic',
  description: 'Analog light sensor',
  category: 'light',
  protocol: 'analog',
  pinConfigType: 'analog',
  defaultPinConfig: { type: 'analog', pin: 36 },
  measurementType: SensorType.LIGHT,
  unit: 'lux',
  range: { min: 0, max: 1023 },  // Raw ADC value
  precision: 0,
  defaultConfig: {
    samplingRate: 100,
    smoothing: 5,
    threshold: { min: 100, max: 800 }
  },
  supportsCalibration: true,
  calibrationType: 'multipoint',
  driverName: 'AnalogSensor',
  firmwareVersion: '1.0.0',
  notes: 'Requires voltage divider circuit. Calibrate for lux conversion.'
}
```

### Sound Sensors

#### MAX4466 (Analog Microphone)
```typescript
{
  id: 'max4466',
  name: 'MAX4466',
  manufacturer: 'Adafruit',
  description: 'Electret microphone amplifier',
  category: 'sound',
  protocol: 'analog',
  pinConfigType: 'analog',
  defaultPinConfig: { type: 'analog', pin: 39 },
  measurementType: SensorType.SOUND,
  unit: 'dB',
  range: { min: 0, max: 1023 },  // Raw ADC
  precision: 0,
  defaultConfig: {
    samplingRate: 50,
    smoothing: 10,
    threshold: { min: 40, max: 85 }
  },
  supportsCalibration: true,
  calibrationType: 'multipoint',
  driverName: 'AnalogSensor',
  firmwareVersion: '1.0.0',
  notes: 'Requires calibration to convert ADC to dB'
}
```

## Sensor Categories

```typescript
enum SensorCategory {
  ENVIRONMENTAL = 'environmental',
  PROXIMITY = 'proximity',
  MOTION = 'motion',
  LIGHT = 'light',
  SOUND = 'sound',
  AIR_QUALITY = 'air_quality',
  PRESSURE = 'pressure',
  CUSTOM = 'custom'
}
```

## Sensor Registration Flow

### 1. User Selects Template
```
User navigates to Sensors page → Click "Add Sensor" → 
Select from template library → Configure pins/settings →
Save → Backend initializes sensor
```

### 2. Pin Configuration UI
```typescript
interface PinConfigFormProps {
  template: SensorTemplate
  onChange: (config: PinConfig) => void
}

// Form adapts based on template.pinConfigType:
// - Single pin: Show single GPIO selector
// - Dual pin: Show two GPIO selectors with labels
// - I2C: Show SDA/SCL/Address fields
// - SPI: Show MISO/MOSI/SCK/CS fields
// - OneWire: Show pin + parasite power option
```

### 3. Validation
```typescript
interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

// Validations:
// - Pin not already in use
// - Pin supports required mode (analog/digital)
// - I2C/SPI pins match hardware configuration
// - Address not conflicting with other I2C devices
```

## Backend Implementation

### Sensor Driver Interface

```cpp
class SensorDriver {
public:
  virtual bool init(PinConfig config) = 0;
  virtual bool read(float& value) = 0;
  virtual String getUnit() = 0;
  virtual bool calibrate(float referenceValue) = 0;
  virtual ~SensorDriver() {}
};

// Example: DHT22 Driver
class DHT22Driver : public SensorDriver {
private:
  DHT* dht;
  int pin;
  
public:
  bool init(PinConfig config) override {
    pin = config.pin;
    dht = new DHT(pin, DHT22);
    dht->begin();
    return true;
  }
  
  bool read(float& value) override {
    value = dht->readTemperature();
    return !isnan(value);
  }
  
  String getUnit() override { return "°C"; }
  
  bool calibrate(float referenceValue) override {
    // Implement calibration
    return true;
  }
};
```

### Driver Registry

```cpp
class SensorDriverRegistry {
private:
  std::map<String, std::function<SensorDriver*()>> drivers;
  
public:
  void registerDriver(String name, std::function<SensorDriver*()> factory) {
    drivers[name] = factory;
  }
  
  SensorDriver* createDriver(String name) {
    if (drivers.find(name) != drivers.end()) {
      return drivers[name]();
    }
    return nullptr;
  }
};

// Registration in setup():
void setup() {
  registry.registerDriver("DHT", []() { return new DHT22Driver(); });
  registry.registerDriver("BME280", []() { return new BME280Driver(); });
  registry.registerDriver("HCSR04", []() { return new HCSR04Driver(); });
  // ... etc
}
```

## API Endpoints

### Get Available Templates
```
GET /api/sensors/templates
Response: SensorTemplate[]
```

### Get Template by ID
```
GET /api/sensors/templates/{id}
Response: SensorTemplate
```

### Add Sensor from Template
```
POST /api/sensors
Body: {
  templateId: string
  name: string
  pinConfig: PinConfig
  config?: Partial<SensorConfig>
}
Response: Sensor
```

### Validate Pin Configuration
```
POST /api/sensors/validate
Body: {
  templateId: string
  pinConfig: PinConfig
}
Response: ValidationResult
```

## Future: Custom Sensors

### Generic I2C Sensor Definition

```typescript
interface CustomI2CSensorDefinition {
  name: string
  category: SensorCategory
  i2cAddress: number
  
  // Register definitions
  initSequence: Array<{
    register: number
    value: number
  }>
  
  readSequence: {
    register: number
    bytesToRead: number
    conversion: string  // JavaScript expression
  }
  
  unit: string
  range: { min: number; max: number }
}

// Example: Custom I2C sensor
{
  name: 'Custom Temp Sensor',
  category: 'environmental',
  i2cAddress: 0x48,
  initSequence: [
    { register: 0x01, value: 0x60 }  // Config register
  ],
  readSequence: {
    register: 0x00,
    bytesToRead: 2,
    conversion: '(value * 0.0625)'  // Convert to °C
  },
  unit: '°C',
  range: { min: -40, max: 125 }
}
```

## Migration Path

### Phase 1 (Current): Template-Only
1. Implement SensorTemplate interface
2. Add predefined templates for common sensors
3. Build template selection UI
4. Implement pin configuration forms
5. Update backend to use driver registry

### Phase 2: Generic Protocols
1. Add CustomI2CSensorDefinition support
2. Implement generic I2C read/write driver
3. Add validation for register sequences
4. Build custom I2C sensor UI

### Phase 3: Advanced Features
1. OTA driver updates
2. Community driver library
3. Driver versioning/compatibility
4. Sensor firmware requirements check

## UI Components

### Sensor Template Card
```typescript
interface SensorTemplateCardProps {
  template: SensorTemplate
  onSelect: (template: SensorTemplate) => void
}
// Displays: name, manufacturer, icon, description, protocol badge
```

### Pin Configuration Form
```typescript
interface PinConfigFormProps {
  template: SensorTemplate
  value: Partial<PinConfig>
  onChange: (config: PinConfig) => void
  validation: ValidationResult
}
// Adapts UI based on pinConfigType
```

### Add Sensor Wizard
```
Step 1: Select Category
Step 2: Select Template
Step 3: Configure Pins
Step 4: Configure Settings
Step 5: Test & Save
```

## Implementation Checklist

- [ ] Update types/sensors.ts with new interfaces
- [ ] Create sensor template registry
- [ ] Build template selection UI
- [ ] Implement pin configuration forms
- [ ] Add validation logic
- [ ] Update backend driver system
- [ ] Add API endpoints
- [ ] Create add sensor wizard
- [ ] Add template documentation
- [ ] Implement auto-detection for I2C devices
- [ ] Add sensor testing/verification
- [ ] Update API_SPECIFICATION.md

## Notes

- All GPIO operations should validate pin availability
- I2C bus can be shared by multiple sensors
- SPI requires unique CS pin per device
- OneWire bus can support multiple sensors with unique addresses
- Analog pins on ESP32: 32-39 (ADC1), 0,2,4,12-15,25-27 (ADC2, not available when WiFi active)
- Some pins are strapping pins - avoid using for sensors (0, 2, 5, 12, 15)

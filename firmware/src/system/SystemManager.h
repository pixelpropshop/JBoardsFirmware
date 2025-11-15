#ifndef SYSTEM_MANAGER_H
#define SYSTEM_MANAGER_H

#include <Arduino.h>
#include <Preferences.h>
#include <Update.h>
#include <ArduinoJson.h>

// Forward declarations
class HardwareManager;

class SystemManager {
public:
    SystemManager();
    
    // Initialization
    void begin();
    
    // Set manager references for config export/import
    void setHardwareManager(HardwareManager* hwMgr);
    
    // System Information
    String getSystemInfo();
    String getMemoryInfo();
    unsigned long getUptime();
    String getFirmwareInfo();
    
    // Firmware Update
    bool beginOTAUpdate(size_t size);
    bool writeOTAChunk(uint8_t* data, size_t len);
    bool endOTAUpdate();
    bool isOTAInProgress();
    size_t getOTAProgress();
    
    // System Control
    void restart(uint32_t delayMs = 1000);
    bool factoryReset();
    
    // Configuration
    String exportConfiguration();
    bool importConfiguration(const String& config);
    
    // Get manager references
    HardwareManager* getHardwareManager() { return hardwareManager; }
    
    // Logs
    bool clearLogs();
    String getLastLog(int lines = 100);
    
    // Safe Boot Mode (crash detection & recovery)
    bool isSafeBootMode();
    void recordSuccessfulBoot();
    void clearSafeBootMode();
    String getSafeBootInfo();
    
private:
    Preferences preferences;
    bool otaInProgress;
    size_t otaSize;
    size_t otaWritten;
    
    // Manager references for config export/import
    HardwareManager* hardwareManager;
    
    // Safe Boot Mode tracking
    void initSafeBootMode();
    void incrementBootCount();
    bool detectRepeatedCrashes();
    
    void clearAllPreferences();
};

#endif // SYSTEM_MANAGER_H

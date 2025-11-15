#ifndef FILES_MANAGER_H
#define FILES_MANAGER_H

#include <Arduino.h>
#include <SD.h>
#include <vector>
#include "../types/Files.h"

class FilesManager {
public:
    FilesManager();
    
    // Initialize SD card
    bool begin();
    
    // Audio file management
    std::vector<AudioFile> getAudioFiles();
    bool deleteAudioFile(const String& filename);
    
    // General file management
    std::vector<FileInfo> listFiles(const String& type = "");
    StorageInfo getStorageInfo();
    bool deleteFile(const String& path);
    String getFilePreview(const String& path, size_t maxSize = 102400);  // 100KB max
    
    // Helper functions
    bool fileExists(const String& path);
    size_t getFileSize(const String& path);
    unsigned long getFileModTime(const String& path);
    
    // Directory operations
    bool createDirectory(const String& path);
    bool directoryExists(const String& path);
    
private:
    bool _initialized;
    
    // Recursive directory scanning
    void scanDirectory(const String& path, std::vector<FileInfo>& files, FileType filterType);
    
    // Calculate storage breakdown
    void calculateStorageBreakdown(StorageInfo& info);
    
    // Path validation
    bool isValidPath(const String& path);
    bool isTextFile(FileType type);
};

#endif // FILES_MANAGER_H

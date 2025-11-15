#include "FilesManager.h"
#include "../config.h"

FilesManager::FilesManager() : _initialized(false) {}

bool FilesManager::begin() {
    #if FEATURE_AUDIO || FEATURE_FSEQ
    // Validate SD card pins are configured
    if (SD_CARD_CS_PIN == -1 || SD_CARD_SCK_PIN == -1 || 
        SD_CARD_MISO_PIN == -1 || SD_CARD_MOSI_PIN == -1) {
        Serial.println("SD card pins not configured");
        _initialized = false;
        return false;
    }
    
    // Initialize SD card with SPI pins
    SPI.begin(SD_CARD_SCK_PIN, SD_CARD_MISO_PIN, SD_CARD_MOSI_PIN, SD_CARD_CS_PIN);
    
    if (!SD.begin(SD_CARD_CS_PIN)) {
        Serial.println("SD card initialization failed");
        _initialized = false;
        return false;
    }
    
    // Create default directories only if SD initialized successfully
    createDirectory("/audio");
    createDirectory("/sequences");
    createDirectory("/config");
    createDirectory("/logs");
    createDirectory("/backups");
    createDirectory("/files");
    
    _initialized = true;
    Serial.println("SD card initialized successfully");
    return true;
    #else
    Serial.println("SD card not enabled for this board variant");
    _initialized = false;
    return false;
    #endif
}

std::vector<AudioFile> FilesManager::getAudioFiles() {
    std::vector<AudioFile> audioFiles;
    
    if (!_initialized) {
        return audioFiles;
    }
    
    File root = SD.open("/audio");
    if (!root || !root.isDirectory()) {
        return audioFiles;
    }
    
    File file = root.openNextFile();
    while (file) {
        if (!file.isDirectory()) {
            FileType type = getFileTypeFromExtension(file.name());
            if (type == FileType::AUDIO) {
                AudioFile audioFile;
                audioFile.filename = String(file.name());
                audioFile.size = file.size();
                audioFile.duration = 0;  // Duration detection not implemented yet
                audioFile.uploadedAt = getFileModTime(file.path());
                audioFiles.push_back(audioFile);
            }
        }
        file = root.openNextFile();
    }
    
    return audioFiles;
}

bool FilesManager::deleteAudioFile(const String& filename) {
    if (!_initialized) {
        return false;
    }
    
    String path = "/audio/" + filename;
    return deleteFile(path);
}

std::vector<FileInfo> FilesManager::listFiles(const String& type) {
    std::vector<FileInfo> files;
    
    if (!_initialized) {
        return files;
    }
    
    // Determine filter type
    FileType filterType = FileType::OTHER;
    if (type == "audio") filterType = FileType::AUDIO;
    else if (type == "fseq") filterType = FileType::FSEQ;
    else if (type == "config") filterType = FileType::CONFIG;
    else if (type == "log") filterType = FileType::LOG;
    else if (type == "backup") filterType = FileType::BACKUP;
    else if (type == "text") filterType = FileType::TEXT;
    
    // Scan all directories recursively
    scanDirectory("/", files, type.isEmpty() ? FileType::OTHER : filterType);
    
    return files;
}

void FilesManager::scanDirectory(const String& path, std::vector<FileInfo>& files, FileType filterType) {
    File root = SD.open(path);
    if (!root || !root.isDirectory()) {
        return;
    }
    
    File file = root.openNextFile();
    while (file) {
        String filePath = String(file.path());
        
        if (file.isDirectory()) {
            // Recursively scan subdirectories
            scanDirectory(filePath, files, filterType);
        } else {
            FileType type = getFileTypeFromExtension(file.name());
            
            // Apply filter if specified
            if (filterType == FileType::OTHER || type == filterType) {
                FileInfo info;
                info.filename = String(file.name());
                info.path = filePath;
                info.size = file.size();
                info.type = type;
                info.mimeType = getMimeTypeFromExtension(file.name());
                info.lastModified = getFileModTime(filePath);
                files.push_back(info);
            }
        }
        
        file = root.openNextFile();
    }
}

StorageInfo FilesManager::getStorageInfo() {
    StorageInfo info;
    info.totalBytes = 0;
    info.usedBytes = 0;
    info.freeBytes = 0;
    info.breakdown.audio = 0;
    info.breakdown.fseq = 0;
    info.breakdown.config = 0;
    info.breakdown.log = 0;
    info.breakdown.backup = 0;
    info.breakdown.other = 0;
    
    if (!_initialized) {
        return info;
    }
    
    // Get total and used space
    info.totalBytes = SD.totalBytes();
    info.usedBytes = SD.usedBytes();
    info.freeBytes = info.totalBytes - info.usedBytes;
    
    // Calculate breakdown by file type
    calculateStorageBreakdown(info);
    
    return info;
}

void FilesManager::calculateStorageBreakdown(StorageInfo& info) {
    std::vector<FileInfo> allFiles = listFiles("");
    
    for (const auto& file : allFiles) {
        switch (file.type) {
            case FileType::AUDIO:
                info.breakdown.audio += file.size;
                break;
            case FileType::FSEQ:
                info.breakdown.fseq += file.size;
                break;
            case FileType::CONFIG:
                info.breakdown.config += file.size;
                break;
            case FileType::LOG:
                info.breakdown.log += file.size;
                break;
            case FileType::BACKUP:
                info.breakdown.backup += file.size;
                break;
            default:
                info.breakdown.other += file.size;
                break;
        }
    }
}

bool FilesManager::deleteFile(const String& path) {
    if (!_initialized || !isValidPath(path)) {
        return false;
    }
    
    if (!fileExists(path)) {
        return false;
    }
    
    return SD.remove(path);
}

String FilesManager::getFilePreview(const String& path, size_t maxSize) {
    if (!_initialized || !isValidPath(path) || !fileExists(path)) {
        return "";
    }
    
    FileType type = getFileTypeFromExtension(path);
    if (!isTextFile(type)) {
        return "";  // Only preview text files
    }
    
    File file = SD.open(path, FILE_READ);
    if (!file) {
        return "";
    }
    
    size_t fileSize = file.size();
    size_t readSize = min(fileSize, maxSize);
    
    String content;
    content.reserve(readSize);
    
    for (size_t i = 0; i < readSize; i++) {
        if (file.available()) {
            content += (char)file.read();
        } else {
            break;
        }
    }
    
    file.close();
    return content;
}

bool FilesManager::fileExists(const String& path) {
    if (!_initialized) {
        return false;
    }
    return SD.exists(path);
}

size_t FilesManager::getFileSize(const String& path) {
    if (!_initialized || !fileExists(path)) {
        return 0;
    }
    
    File file = SD.open(path, FILE_READ);
    if (!file) {
        return 0;
    }
    
    size_t size = file.size();
    file.close();
    return size;
}

unsigned long FilesManager::getFileModTime(const String& path) {
    if (!_initialized || !fileExists(path)) {
        return 0;
    }
    
    File file = SD.open(path, FILE_READ);
    if (!file) {
        return 0;
    }
    
    unsigned long modTime = file.getLastWrite();
    file.close();
    return modTime;
}

bool FilesManager::createDirectory(const String& path) {
    if (!_initialized) {
        return false;
    }
    
    if (directoryExists(path)) {
        return true;  // Already exists
    }
    
    return SD.mkdir(path);
}

bool FilesManager::directoryExists(const String& path) {
    if (!_initialized) {
        return false;
    }
    
    File dir = SD.open(path);
    if (!dir) {
        return false;
    }
    
    bool isDir = dir.isDirectory();
    dir.close();
    return isDir;
}

bool FilesManager::isValidPath(const String& path) {
    // Prevent path traversal attacks
    if (path.indexOf("..") >= 0) {
        return false;
    }
    
    // Must start with /
    if (!path.startsWith("/")) {
        return false;
    }
    
    return true;
}

bool FilesManager::isTextFile(FileType type) {
    return (type == FileType::CONFIG || 
            type == FileType::LOG || 
            type == FileType::TEXT);
}

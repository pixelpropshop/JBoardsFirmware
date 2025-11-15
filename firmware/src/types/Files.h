#ifndef FILES_H
#define FILES_H

#include <Arduino.h>
#include <vector>

// File type enumeration
enum class FileType {
    AUDIO,
    FSEQ,
    CONFIG,
    LOG,
    BACKUP,
    TEXT,
    OTHER
};

// File information structure
struct FileInfo {
    String filename;
    String path;
    size_t size;
    FileType type;
    String mimeType;
    unsigned long lastModified;
};

// Audio file information
struct AudioFile {
    String filename;
    size_t size;
    int duration;  // in seconds, 0 if unknown
    unsigned long uploadedAt;
};

// Storage information
struct StorageInfo {
    size_t totalBytes;
    size_t usedBytes;
    size_t freeBytes;
    struct {
        size_t audio;
        size_t fseq;
        size_t config;
        size_t log;
        size_t backup;
        size_t other;
    } breakdown;
};

// Helper function to determine file type from extension
inline FileType getFileTypeFromExtension(const String& filename) {
    String lower = filename;
    lower.toLowerCase();
    
    if (lower.endsWith(".mp3") || lower.endsWith(".wav") || 
        lower.endsWith(".ogg") || lower.endsWith(".m4a") || 
        lower.endsWith(".flac")) {
        return FileType::AUDIO;
    } else if (lower.endsWith(".fseq")) {
        return FileType::FSEQ;
    } else if (lower.endsWith(".json") || lower.endsWith(".cfg") || 
               lower.endsWith(".conf") || lower.endsWith(".ini")) {
        return FileType::CONFIG;
    } else if (lower.endsWith(".log")) {
        return FileType::LOG;
    } else if (lower.endsWith(".zip") || lower.endsWith(".tar") || 
               lower.endsWith(".gz") || lower.endsWith(".bak")) {
        return FileType::BACKUP;
    } else if (lower.endsWith(".txt")) {
        return FileType::TEXT;
    }
    
    return FileType::OTHER;
}

// Helper function to get MIME type from file extension
inline String getMimeTypeFromExtension(const String& filename) {
    String lower = filename;
    lower.toLowerCase();
    
    if (lower.endsWith(".mp3")) return "audio/mpeg";
    if (lower.endsWith(".wav")) return "audio/wav";
    if (lower.endsWith(".ogg")) return "audio/ogg";
    if (lower.endsWith(".m4a")) return "audio/mp4";
    if (lower.endsWith(".flac")) return "audio/flac";
    if (lower.endsWith(".fseq")) return "application/octet-stream";
    if (lower.endsWith(".json")) return "application/json";
    if (lower.endsWith(".txt")) return "text/plain";
    if (lower.endsWith(".log")) return "text/plain";
    if (lower.endsWith(".zip")) return "application/zip";
    if (lower.endsWith(".tar")) return "application/x-tar";
    if (lower.endsWith(".gz")) return "application/gzip";
    
    return "application/octet-stream";
}

// Helper function to get file type name
inline String getFileTypeName(FileType type) {
    switch (type) {
        case FileType::AUDIO: return "audio";
        case FileType::FSEQ: return "fseq";
        case FileType::CONFIG: return "config";
        case FileType::LOG: return "log";
        case FileType::BACKUP: return "backup";
        case FileType::TEXT: return "text";
        case FileType::OTHER: return "other";
        default: return "unknown";
    }
}

#endif // FILES_H

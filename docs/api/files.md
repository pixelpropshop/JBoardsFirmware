# File Management API

Audio files, general file management, and SD card operations.

## 50. Get Audio Files

**Endpoint:** `GET /api/files/audio`

**Response:**
```json
{
  "files": [
    {
      "filename": "jingle_bells.mp3",
      "size": 2457600,
      "duration": 153,
      "uploadedAt": "2024-12-01T10:30:00Z"
    }
  ]
}
```

## 51. Upload Audio File

**Endpoint:** `POST /api/files/audio`

**Request:** `multipart/form-data`
- file: Audio file (.mp3/.wav/.ogg)

**Notes:**
- Max size: 50MB
- Supported: MP3, WAV, OGG

## 52. Delete Audio File

**Endpoint:** `DELETE /api/files/audio/{filename}`

**Notes:**
- Filename must be URL-encoded
- Cannot delete if referenced by FSEQ sequence

## 53. Stream Audio File

**Endpoint:** `GET /api/files/audio/stream/{filename}`

**Response:** Audio binary stream

**Headers:**
```
Content-Type: audio/mpeg | audio/wav | audio/ogg
Accept-Ranges: bytes
```

**Notes:**
- Supports range requests for seeking (HTTP 206)
- Used by Audio page for browser playback

## 54. Get File List

**Endpoint:** `GET /api/files/list`

**Query Parameters:**
- type: Optional filter (audio, fseq, config, log, backup, text, other)

**Response:**
```json
[
  {
    "filename": "christmas_carol.mp3",
    "path": "/sd/audio/christmas_carol.mp3",
    "size": 3584000,
    "type": "audio",
    "mimeType": "audio/mpeg",
    "lastModified": "2025-01-08T10:30:00Z"
  }
]
```

## 55. Get Storage Information

**Endpoint:** `GET /api/files/storage`

**Response:**
```json
{
  "totalBytes": 8589934592,
  "usedBytes": 1288490188,
  "freeBytes": 7301444404,
  "breakdown": {
    "audio": 11776000,
    "fseq": 6144000,
    "config": 3072,
    "log": 20480,
    "backup": 524288,
    "other": 512
  }
}
```

## 56. Upload General File

**Endpoint:** `POST /api/files/upload`

**Request:** `multipart/form-data`
- file: File to upload
- path: Optional destination path (default: /sd/files/)

**Notes:**
- Max size: 100MB
- Any file type supported

## 57. Delete File

**Endpoint:** `DELETE /api/files/delete`

**Request:**
```json
{
  "path": "/sd/config/old_config.json"
}
```

## 58. Download File

**Endpoint:** `GET /api/files/download/{path}`

**Response:** File binary with download headers

**Notes:**
- path: URL-encoded file path
- Triggers browser download

## 59. Preview File

**Endpoint:** `POST /api/files/preview`

**Request:**
```json
{
  "path": "/sd/config/board_config.json"
}
```

**Response:**
```json
{
  "success": true,
  "content": "{\n  \"version\": \"1.0\",\n  \"ledCount\": 300\n}"
}
```

**Notes:**
- Only for text-based files (config, log, text)
- Max preview: 100KB
- Not available for binary files

## File Type Detection

| Type | Extensions | Icon | Color |
|------|-----------|------|-------|
| audio | mp3, wav, ogg, m4a, flac | 🎵 | Purple |
| fseq | fseq | 🎄 | Blue |
| config | json, cfg, conf, ini | ⚙️ | Green |
| log | log | 📋 | Yellow |
| backup | zip, tar, gz, bak | 💾 | Orange |
| text | txt | 📄 | Gray |
| other | all others | 📁 | Gray |

## SD Card Structure

```
/sd/
├── audio/           # Audio files (MP3, WAV, OGG)
├── sequences/       # FSEQ sequence files
├── config/          # Configuration files (JSON, INI)
├── logs/            # System log files
├── backups/         # Backup archives
└── files/           # General user files

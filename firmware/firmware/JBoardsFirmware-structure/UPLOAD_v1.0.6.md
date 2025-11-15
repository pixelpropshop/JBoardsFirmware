# Upload Instructions for v1.0.6

## Overview
Version 1.0.6 includes backup version tracking, allowing the OTA status endpoint to display the actual backup firmware version instead of "unknown".

## Files to Upload to GitHub

### 1. Firmware Binary
**Source:** `firmware/JBoardsFirmware-structure/JBOARD-16/versions/1.0.6/firmware.bin`
**Destination:** `JBOARD-16/versions/1.0.6/firmware.bin`

### 2. Manifest File
**Source:** `firmware/JBoardsFirmware-structure/JBOARD-16/manifest.json`
**Destination:** `JBOARD-16/manifest.json`

### 3. Versions File
**Source:** `firmware/JBoardsFirmware-structure/JBOARD-16/versions.json`
**Destination:** `JBOARD-16/versions.json`

## Version Details

- **Version:** 1.0.6
- **Build Date:** 2025-11-14
- **Checksum (SHA256):** `E54B0EC18CB467A215A2C7AF4F2DCB2A1004052AFA7A55280EC47335F39D9C5F`
- **File Size:** 1,108,477 bytes (1.06 MB)

## Changelog

**Version 1.0.6 - Backup Version Tracking**
- Added NVS storage for backup firmware version
- OTA status endpoint now shows actual backup version instead of 'unknown'
- System stores current version before OTA update begins
- Enhanced firmware recovery information display
- Route registration order fix from v1.0.5 included
- All features from v1.0.4 included

## Upload Steps

### Using GitHub Web Interface

1. Navigate to the JBoardsFirmware repository
2. Create the directory structure:
   - Navigate to `JBOARD-16/versions/`
   - Create folder `1.0.6`
3. Upload the firmware binary:
   - Go to `JBOARD-16/versions/1.0.6/`
   - Upload `firmware.bin`
4. Update manifest.json:
   - Navigate to `JBOARD-16/`
   - Edit `manifest.json` and replace content
5. Update versions.json:
   - Navigate to `JBOARD-16/`
   - Edit `versions.json` and replace content

### Using Git Command Line

```bash
# Navigate to your JBoardsFirmware repository
cd path/to/JBoardsFirmware

# Create version directory
mkdir -p JBOARD-16/versions/1.0.6

# Copy firmware binary
cp path/to/firmware/JBoardsFirmware-structure/JBOARD-16/versions/1.0.6/firmware.bin JBOARD-16/versions/1.0.6/

# Copy updated manifest and versions
cp path/to/firmware/JBoardsFirmware-structure/JBOARD-16/manifest.json JBOARD-16/
cp path/to/firmware/JBoardsFirmware-structure/JBOARD-16/versions.json JBOARD-16/

# Commit and push
git add JBOARD-16/versions/1.0.6/firmware.bin
git add JBOARD-16/manifest.json
git add JBOARD-16/versions.json
git commit -m "Release v1.0.6 - Backup Version Tracking"
git push origin main
```

## Verification

After uploading, verify the files are accessible:

1. **Manifest URL:**
   https://raw.githubusercontent.com/pixelpropshop/JBoardsFirmware/main/JBOARD-16/manifest.json

2. **Versions URL:**
   https://raw.githubusercontent.com/pixelpropshop/JBoardsFirmware/main/JBOARD-16/versions.json

3. **Firmware Binary URL:**
   https://raw.githubusercontent.com/pixelpropshop/JBoardsFirmware/main/JBOARD-16/versions/1.0.6/firmware.bin

## Testing

1. Open your JSense Board web interface
2. Navigate to Settings → Firmware Updates
3. Click "Check for Updates"
4. Should detect v1.0.6 as available
5. Click "Update Firmware"
6. Wait for download, verification, and installation
7. Device will reboot automatically
8. After reboot, verify version shows as 1.0.6
9. Check "Firmware Backup & Recovery" card - should now show backup version

## Technical Details

### Backup Version Tracking
- Before starting OTA update, current firmware version is stored in NVS (Non-Volatile Storage)
- After update completes, this stored version becomes the "backup version"
- OTA status endpoint (`/api/system/firmware/ota-status`) reads from NVS
- First boot will still show "unknown" until first OTA update is performed
- Each subsequent update stores the current version as backup

### Modified Files in v1.0.6
- `src/system/SystemManager.cpp` - Added NVS storage before OTA begins
- `src/api/SystemEndpoints.cpp` - Updated to read backup version from NVS
- `src/config.h` - Version bumped to 1.0.6

## Notes

- This version includes the route registration order fix from v1.0.5
- The backup version will only be populated after performing at least one OTA update
- If upgrading from v1.0.4 directly to v1.0.6, backup version will show "1.0.4" after update
- The backup version persists across reboots and only changes when a new OTA update is performed

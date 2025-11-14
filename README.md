# JBoards Firmware Repository Structure

This directory contains the structure for the JBoardsFirmware GitHub repository that hosts firmware updates for all JBoard variants.

## Repository Structure

The firmware repository should be organized as follows:

```
JBoardsFirmware/
├── README.md
├── JBOARD-2/
│   ├── manifest.json
│   ├── versions.json
│   └── versions/
│       ├── 1.0.0/
│       │   └── firmware.bin
│       └── 1.0.1/
│           └── firmware.bin
├── JBOARD-4/
│   ├── manifest.json
│   ├── versions.json
│   └── versions/
│       └── ...
├── JBOARD-8/
│   ├── manifest.json
│   ├── versions.json
│   └── versions/
│       └── ...
└── JBOARD-16/
    ├── manifest.json
    ├── versions.json
    └── versions/
        └── 1.0.0/
            └── firmware.bin
```

## File Descriptions

### manifest.json

Contains information about the latest stable firmware version. This is the primary file checked by devices for updates.

**Format:**
```json
{
  "latestVersion": "1.0.0",
  "latestUrl": "https://raw.githubusercontent.com/pixelpropshop/JBoardsFirmware/main/JBOARD-16/versions/1.0.0/firmware.bin",
  "checksum": "sha256_checksum_of_firmware_binary"
}
```

### versions.json

Contains a complete list of all available firmware versions with detailed metadata.

**Format:**
```json
{
  "versions": [
    {
      "version": "1.0.0",
      "buildDate": "2024-11-14",
      "stable": true,
      "changelog": "Release notes here",
      "checksum": "sha256_checksum_of_firmware_binary",
      "fileSize": 1234567,
      "minHardwareVersion": "1.0"
    }
  ]
}
```

## Adding a New Firmware Version

### Step 1: Build the Firmware

Build the firmware using PlatformIO:

```bash
# For JBOARD-16
pio run -e jboard16

# For JBOARD-8
pio run -e jboard8

# For JBOARD-4
pio run -e jboard4

# For JBOARD-2
pio run -e jboard2
```

The compiled firmware will be at: `.pio/build/{environment}/firmware.bin`

### Step 2: Calculate SHA256 Checksum

Calculate the SHA256 checksum of the firmware binary:

**Windows (PowerShell):**
```powershell
Get-FileHash firmware.bin -Algorithm SHA256
```

**Linux/macOS:**
```bash
sha256sum firmware.bin
```

**Online Alternative:**
Upload to https://emn178.github.io/online-tools/sha256_checksum.html

### Step 3: Create Version Directory

Create a new version directory in the appropriate board folder:

```bash
mkdir -p JBOARD-16/versions/1.0.1
```

### Step 4: Copy Firmware Binary

Copy the firmware binary to the version directory:

```bash
cp .pio/build/jboard16/firmware.bin JBOARD-16/versions/1.0.1/
```

### Step 5: Update versions.json

Add the new version to the `versions` array in `versions.json`:

```json
{
  "versions": [
    {
      "version": "1.0.1",
      "buildDate": "2024-11-15",
      "stable": true,
      "changelog": "Bug fixes:\n- Fixed WiFi reconnection issue\n- Improved LED synchronization",
      "checksum": "your_calculated_sha256_checksum_here",
      "fileSize": 1234567,
      "minHardwareVersion": "1.0"
    },
    {
      "version": "1.0.0",
      "buildDate": "2024-11-14",
      "stable": true,
      "changelog": "Initial release",
      "checksum": "previous_checksum",
      "fileSize": 1234000,
      "minHardwareVersion": "1.0"
    }
  ]
}
```

**Note:** List versions in reverse chronological order (newest first).

### Step 6: Update manifest.json

If the new version is the latest stable release, update `manifest.json`:

```json
{
  "latestVersion": "1.0.1",
  "latestUrl": "https://raw.githubusercontent.com/pixelpropshop/JBoardsFirmware/main/JBOARD-16/versions/1.0.1/firmware.bin",
  "checksum": "your_calculated_sha256_checksum_here"
}
```

### Step 7: Commit and Push

Commit all changes to the GitHub repository:

```bash
git add .
git commit -m "Release firmware v1.0.1 for JBOARD-16"
git push origin main
```

## Version Numbering

Follow semantic versioning (MAJOR.MINOR.PATCH):

- **MAJOR**: Incompatible API changes or hardware requirements
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

## Changelog Guidelines

Write clear, concise changelogs:

```
Version 1.0.1 - Bug Fixes
- Fixed WiFi reconnection after network drop
- Improved LED output synchronization
- Resolved memory leak in effects manager
- Updated RTC timezone handling

Version 1.0.0 - Initial Release
- Full 16-channel LED control
- WiFi network management
- Web-based configuration
- RTC and OLED support
```

## Testing Firmware Updates

Before releasing:

1. **Local Testing**: Test the firmware on actual hardware
2. **Checksum Verification**: Verify the checksum matches
3. **OTA Update Test**: Test the OTA update process end-to-end
4. **Rollback Test**: Ensure rollback to previous version works

## Board Variants

### JBOARD-16
- 16 LED outputs
- RTC, OLED, Sensors, Audio support
- Max 2048 pixels per output

### JBOARD-8
- 8 LED outputs
- Sensors and Audio support
- Max 2048 pixels per output

### JBOARD-4
- 4 LED outputs
- Basic features only
- Max 1024 pixels per output

### JBOARD-2
- 2 LED outputs
- Minimal features
- Max 1024 pixels per output

## Update Process Flow

1. User clicks "Check for Updates" in Settings page
2. Frontend fetches `manifest.json` and `versions.json` from GitHub
3. Compares current version with latest version
4. Shows available updates with changelog
5. User selects version to install
6. Frontend downloads `firmware.bin` from GitHub
7. Frontend uploads firmware to device via `/api/system/firmware/upload`
8. Device verifies checksum (if provided)
9. Device installs firmware to OTA partition
10. Device reboots with new firmware
11. Previous firmware remains in backup partition for rollback

## Security Considerations

- Always verify SHA256 checksums
- Use HTTPS for all downloads
- Keep backup firmware partition for rollback
- Test thoroughly before marking as stable
- Document minimum hardware version requirements

## Support

For issues or questions, please open an issue in the JBoards repository:
https://github.com/pixelpropshop/JBoards

## License

Firmware binaries are proprietary to Pixel Prop Shop.

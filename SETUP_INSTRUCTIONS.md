# JBoardsFirmware GitHub Repository Setup Instructions

## Overview

I've created the complete structure needed for the JBoardsFirmware GitHub repository. This repository will enable OTA (Over-The-Air) firmware updates for all JBoard devices.

## What's Been Created

The following files have been created in `firmware/JBoardsFirmware-structure/`:

```
JBoardsFirmware-structure/
├── README.md                           # Complete documentation
├── SETUP_INSTRUCTIONS.md              # This file
└── JBOARD-16/
    ├── manifest.json                  # Latest version manifest
    ├── versions.json                  # All versions metadata
    └── versions/
        └── 1.0.0/
            └── .gitkeep              # Placeholder for firmware.bin
```

## Next Steps

### Step 1: Upload Structure to GitHub

1. **Navigate to your JBoardsFirmware repository:**
   - Go to https://github.com/pixelpropshop/JBoardsFirmware

2. **Upload the files:**
   
   **Option A - Using GitHub Web Interface:**
   - Click "Add file" → "Upload files"
   - Drag and drop the entire `JBOARD-16` folder
   - Also upload the `README.md` file
   - Commit with message: "Add JBOARD-16 firmware structure"

   **Option B - Using Git CLI:**
   ```bash
   # Clone the repository
   git clone https://github.com/pixelpropshop/JBoardsFirmware.git
   cd JBoardsFirmware
   
   # Copy the structure
   cp -r /path/to/firmware/JBoardsFirmware-structure/* .
   
   # Commit and push
   git add .
   git commit -m "Add JBOARD-16 firmware structure and documentation"
   git push origin main
   ```

### Step 2: Build and Add Firmware Binary

1. **Build the firmware:**
   ```bash
   cd /path/to/JSenseBoard/firmware
   pio run -e jboard16
   ```

2. **Calculate the checksum:**
   
   **Windows (PowerShell):**
   ```powershell
   Get-FileHash .pio\build\jboard16\firmware.bin -Algorithm SHA256
   ```
   
   **Linux/macOS:**
   ```bash
   sha256sum .pio/build/jboard16/firmware.bin
   ```

3. **Copy the firmware binary:**
   ```bash
   # In JBoardsFirmware repository
   cp /path/to/JSenseBoard/firmware/.pio/build/jboard16/firmware.bin JBOARD-16/versions/1.0.0/
   ```

4. **Update the checksums:**
   
   Edit both `JBOARD-16/manifest.json` and `JBOARD-16/versions.json`:
   - Replace `"placeholder_sha256_checksum_here"` with your calculated checksum
   - Update `fileSize` in versions.json with the actual file size in bytes

5. **Update buildDate:**
   
   In `JBOARD-16/versions.json`, update the buildDate to today's date (YYYY-MM-DD format)

6. **Commit and push:**
   ```bash
   git add JBOARD-16/
   git commit -m "Add firmware v1.0.0 binary for JBOARD-16"
   git push origin main
   ```

### Step 3: Test the Update System

1. **Wait a few minutes** for GitHub to process the files

2. **Test the URLs manually:**
   ```bash
   # Should return 200 OK
   curl -I https://raw.githubusercontent.com/pixelpropshop/JBoardsFirmware/main/JBOARD-16/manifest.json
   curl -I https://raw.githubusercontent.com/pixelpropshop/JBoardsFirmware/main/JBOARD-16/versions.json
   curl -I https://raw.githubusercontent.com/pixelpropshop/JBoardsFirmware/main/JBOARD-16/versions/1.0.0/firmware.bin
   ```

3. **Test in the web interface:**
   - Open your JSenseBoard web interface
   - Go to Settings
   - Click "Check for Updates"
   - Should show "You have the latest firmware version" (since you're on 1.0.0)

### Step 4: Create Structures for Other Board Variants

For JBOARD-2, JBOARD-4, and JBOARD-8, copy the JBOARD-16 structure:

```bash
cd JBoardsFirmware
cp -r JBOARD-16 JBOARD-8
cp -r JBOARD-16 JBOARD-4
cp -r JBOARD-16 JBOARD-2
```

Update the URLs in each board's manifest.json to match the board name.

## Future Firmware Releases

### When releasing a new version (e.g., 1.0.1):

1. **Create version directory:**
   ```bash
   mkdir -p JBOARD-16/versions/1.0.1
   ```

2. **Build and copy firmware:**
   ```bash
   pio run -e jboard16
   cp .pio/build/jboard16/firmware.bin JBOARD-16/versions/1.0.1/
   ```

3. **Calculate checksum:**
   ```bash
   sha256sum JBOARD-16/versions/1.0.1/firmware.bin
   ```

4. **Update versions.json** - Add new version at the TOP of the versions array

5. **Update manifest.json** - Point to the new version

6. **Commit and push:**
   ```bash
   git add JBOARD-16/
   git commit -m "Release firmware v1.0.1 for JBOARD-16"
   git push origin main
   ```

## Current Firmware Version

The current firmware version in your codebase is **1.0.0** (defined in `src/config.h`).

## Product Name

The product name used for update checks is based on `BOARD_NAME` in config.h:
- JBOARD-16 → "JBOARD-16"
- JBOARD-8 → "JBOARD-8"
- JBOARD-4 → "JBOARD-4"
- JBOARD-2 → "JBOARD-2"

This name is sent to the frontend and used in the update check URL construction.

## Troubleshooting

### Issue: 404 errors when checking for updates

**Cause:** Files not yet uploaded to GitHub or wrong repository structure

**Solution:** 
1. Verify files exist in repository
2. Check that URLs match exactly
3. Wait a few minutes for GitHub CDN to update

### Issue: Checksum mismatch

**Cause:** Checksum in JSON doesn't match actual firmware binary

**Solution:**
1. Recalculate checksum
2. Update both manifest.json and versions.json
3. Commit changes

### Issue: Download works but install fails

**Cause:** Corrupted firmware or incompatible version

**Solution:**
1. Verify firmware.bin is valid
2. Test firmware locally first
3. Check device logs for errors

## Security Notes

- **Always calculate and verify checksums**
- **Test firmware thoroughly before marking as stable**
- **Keep backup firmware in OTA partition**
- **Document breaking changes in changelog**
- **Set `stable: false` for beta releases**

## Support

For issues with the firmware update system:
1. Check Settings page console for errors
2. Verify GitHub repository structure
3. Test URLs manually with curl
4. Review firmware binary size and checksum

## Summary

Once you upload the structure to GitHub and add the firmware binary with correct checksum:

✅ The "Check for Updates" button will work  
✅ Devices can download firmware from GitHub  
✅ Automatic update installation will function  
✅ Version history will be displayed  
✅ Rollback to previous versions will be possible  

The firmware update system is fully implemented in both frontend and backend - it just needed the GitHub repository structure!

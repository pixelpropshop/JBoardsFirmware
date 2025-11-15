# Upload Instructions for Firmware v1.0.1

## Summary

Firmware v1.0.1 has been built and is ready for upload to GitHub. This release will allow testing of the OTA update system.

## Files to Upload

Upload the following files from `firmware/JBoardsFirmware-structure/` to your JBoardsFirmware GitHub repository:

### 1. Updated Manifest Files
- `JBOARD-16/manifest.json` - Points to v1.0.1
- `JBOARD-16/versions.json` - Includes v1.0.1 metadata

### 2. Firmware Binary
- `JBOARD-16/versions/1.0.1/firmware.bin` - The actual firmware (1,108,317 bytes)

## Firmware Details

**Version:** 1.0.1  
**Build Date:** 2024-11-14  
**File Size:** 1,108,317 bytes (1.06 MB)  
**SHA256 Checksum:** `884E44D9D6C89747B1FC754AFCC20C73E8A4534497E34883ED0EB92F8EBF2B50`

## Changes in v1.0.1

- Updated firmware version for testing
- Verified OTA update system functionality
- Confirmed GitHub repository integration
- All features from v1.0.0 included

## Upload Methods

### Option 1: Using Git CLI

```bash
# Navigate to JBoardsFirmware repository
cd /path/to/JBoardsFirmware

# Copy updated files
cp /path/to/firmware/JBoardsFirmware-structure/JBOARD-16/manifest.json JBOARD-16/
cp /path/to/firmware/JBoardsFirmware-structure/JBOARD-16/versions.json JBOARD-16/
cp -r /path/to/firmware/JBoardsFirmware-structure/JBOARD-16/versions/1.0.1 JBOARD-16/versions/

# Commit and push
git add JBOARD-16/
git commit -m "Release firmware v1.0.1 for JBOARD-16"
git push origin main
```

### Option 2: Using GitHub Web Interface

1. Go to https://github.com/pixelpropshop/JBoardsFirmware
2. Navigate to `JBOARD-16` folder
3. Click "Add file" → "Upload files"
4. Upload the updated `manifest.json` and `versions.json` files
5. Navigate to `JBOARD-16/versions/` folder
6. Upload the entire `1.0.1` folder with firmware.bin inside
7. Commit with message: "Release firmware v1.0.1 for JBOARD-16"

## Testing the Update

### After Upload:

1. **Wait 2-3 minutes** for GitHub CDN to update

2. **Verify URLs are accessible:**
   ```bash
   curl -I https://raw.githubusercontent.com/pixelpropshop/JBoardsFirmware/main/JBOARD-16/manifest.json
   curl -I https://raw.githubusercontent.com/pixelpropshop/JBoardsFirmware/main/JBOARD-16/versions.json
   curl -I https://raw.githubusercontent.com/pixelpropshop/JBoardsFirmware/main/JBOARD-16/versions/1.0.1/firmware.bin
   ```
   All should return 200 OK

3. **Test in web interface:**
   - Open JSenseBoard web interface
   - Go to Settings
   - Click "Check for Updates"
   - Should show: "Update available! Latest version: 1.0.1"
   - Should display changelog
   - Click "Download and Install v1.0.1"

4. **Monitor the update:**
   - Firmware will download from GitHub
   - Progress bar will show download progress
   - Device will install and restart
   - After restart, Settings should show "Firmware Version: 1.0.1"

## Expected Behavior

When a device running v1.0.0 checks for updates:
- ✅ Detects v1.0.1 is available
- ✅ Shows "Update Available" badge
- ✅ Displays changelog
- ✅ Allows download and install
- ✅ Verifies checksum during installation
- ✅ Creates backup of v1.0.0 in alternate OTA partition
- ✅ Boots into v1.0.1
- ✅ Allows rollback to v1.0.0 if needed

## Current Device Status

**Note:** Your current device is running the code with v1.0.1 in config.h, but until you flash it or do an OTA update, the device still reports v1.0.0 (or whatever was last flashed).

To test the full update cycle:
1. Make sure your device is running v1.0.0 firmware
2. Upload files to GitHub
3. Use "Check for Updates" in Settings
4. Install v1.0.1 via OTA
5. Verify new version after reboot

## Rollback Testing

After successfully updating to v1.0.1:
1. Go to Settings → Firmware Backup & Recovery
2. Should show backup v1.0.0 available
3. Click "Rollback to v1.0.0"
4. Device should reboot with v1.0.0
5. Can then update back to v1.0.1

## Troubleshooting

### Issue: Still getting 404 errors
- **Solution:** Wait a few minutes for GitHub CDN to propagate
- **Check:** Verify files exist in GitHub repository

### Issue: Checksum mismatch error
- **Solution:** The checksum is correct and matches the built firmware
- **Verify:** The firmware.bin file wasn't corrupted during upload

### Issue: Download fails
- **Solution:** Check device has internet access and can reach GitHub
- **Check:** Device serial monitor for error messages

## Next Steps

After successful testing:
1. Document any issues found
2. Consider creating v1.0.0 firmware with correct checksum (if needed)
3. Plan for future releases (v1.0.2, v1.1.0, etc.)
4. Set up CI/CD for automated builds and releases

## Support

For issues with the update system, check:
- Device serial monitor output
- Browser console in Settings page
- GitHub repository file structure
- Network connectivity

# Upload v1.0.4 to GitHub

## Steps to Make v1.0.4 Available for OTA Updates

1. **Navigate to the firmware structure directory:**
   ```bash
   cd firmware/JBoardsFirmware-structure
   ```

2. **Commit the changes:**
   ```bash
   git add .
   git commit -m "Release v1.0.4 - Reboot UX improvements and board name fix"
   ```

3. **Push to GitHub:**
   ```bash
   git push origin main
   ```

4. **Verify on GitHub:**
   - Go to: https://github.com/pixelpropshop/JBoardsFirmware
   - Check that these files exist:
     - `JBOARD-16/manifest.json` (should show v1.0.4)
     - `JBOARD-16/versions.json` (should include v1.0.4)
     - `JBOARD-16/versions/1.0.4/firmware.bin` (1,108,317 bytes)

5. **Test from Device:**
   - Go to Settings page on your device
   - Click "Check for Updates"
   - Should now show v1.0.4 as available
   - Click "Download and Install v1.0.4"

## What's New in v1.0.4

- **Reboot UX Improvements:**
  - 15-second countdown during device reboot
  - Automatic device availability polling
  - Auto-refresh when device comes back online
  - Visual overlay with reboot status

- **Bug Fix:**
  - Fixed board name normalization for GitHub URLs
  - "Check for Updates" now works correctly with JBOARD-16

## Files Modified

- `JBOARD-16/manifest.json` - Updated to v1.0.4
- `JBOARD-16/versions.json` - Added v1.0.4 entry with changelog
- `JBOARD-16/versions/1.0.4/firmware.bin` - New firmware binary

## Checksum

SHA256: `0F15795ED4E9CFA3EEBE16223AB159118C0D9326461D8BA027E5C71FA4D47E62`

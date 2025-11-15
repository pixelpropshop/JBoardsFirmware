# Network Page Issues and Fixes

## Issues Found During Review (2025-11-13)

### 1. Auto-Reconnect API Endpoint Mismatch ⚠️ CRITICAL
**Status**: ✅ FIXED

**Problem**:
- Frontend calls: `POST /api/network/autoreconnect` (no hyphen)
- Backend had: `POST /api/network/auto-reconnect` (WITH hyphen)
- Backend GET: `GET /api/network/autoreconnect` (no hyphen) ✓ matches

**Impact**: Saving auto-reconnect settings would fail

**Fix Applied**: 
- Changed backend POST endpoint from `/api/network/auto-reconnect` to `/api/network/autoreconnect`
- File: `src/api/NetworkEndpoints.cpp` line ~515

---

### 2. Auto-Reconnect Field Name Inconsistency ⚠️ CRITICAL
**Status**: ✅ FIXED

**Problem**:
- Backend GET returns: `attemptInterval`
- Backend POST expected: `interval`
- Frontend uses: `attemptInterval`

**Impact**: When saving, the interval value wouldn't be saved correctly

**Fix Applied**:
- Changed backend POST to expect `attemptInterval` instead of `interval`
- Added proper NVS storage for all auto-reconnect fields
- File: `src/api/NetworkEndpoints.cpp` line ~528

---

### 3. Hostname/mDNS Configuration Incomplete ⚠️ CRITICAL
**Status**: ✅ FIXED

**Problem**:
- Frontend sends: `{ hostname: string, mdnsEnabled: boolean }`
- Backend POST only handled: `{ hostname: string }`
- Backend GET didn't return `mdnsEnabled` field

**Impact**: 
- The "Enable mDNS" toggle in the UI did nothing
- Backend ignored the mdnsEnabled field completely
- On page load, mDNS toggle state was not restored

**Fix Applied**:
- Backend POST: Now saves `mdnsEnabled` to NVS and conditionally starts/stops mDNS
- Backend GET: Now returns `mdnsEnabled` field from NVS
- Added `MDNS.end()` call when mDNS is disabled
- Files: `src/api/NetworkEndpoints.cpp` lines ~329 (POST) and ~369 (GET)

---

### 4. Captive Portal API Endpoints and Code Removal
**Status**: ✅ COMPLETED

**Problem**:
- Captive portal UI was removed but backend endpoints and frontend service methods remained

**Impact**: Dead code in both frontend and backend

**Fix Applied**:
- Removed all 3 captive portal endpoints from backend (`NetworkEndpoints.cpp`)
- Removed `getCaptivePortalStatus()`, `completeCaptivePortal()`, and `resetCaptivePortal()` methods from frontend service
- Removed `CaptivePortalStatus` interface from frontend types
- Removed `mockCaptivePortalStatus` from frontend service
- Files: `src/api/NetworkEndpoints.cpp`, `../react-app/src/services/networkService.ts`, `../react-app/src/types/network.ts`

---

## Fix Summary

1. ✅ **COMPLETED**: Auto-reconnect endpoint name (Issue #1)
2. ✅ **COMPLETED**: Auto-reconnect field name (Issue #2)
3. ✅ **COMPLETED**: Hostname mDNS support (Issue #3)
4. ✅ **COMPLETED**: Captive portal cleanup (Issue #4)

---

## Files Modified

### Backend (C++):
- ✅ `src/api/NetworkEndpoints.cpp` - Fixed all 3 critical issues + removed captive portal endpoints

### Frontend (TypeScript):
- ✅ `../react-app/src/services/networkService.ts` - Removed captive portal methods and mock data
- ✅ `../react-app/src/types/network.ts` - Removed CaptivePortalStatus interface

---

## Testing Plan

### Backend Testing:
1. ✅ Compiled successfully with no errors
2. Test auto-reconnect settings save/load
3. Test mDNS enable/disable toggle
4. Verify hostname changes work correctly
5. Check that mDNS state persists across reboots

### Frontend Testing:
1. ✅ TypeScript compilation successful (hot reload confirmed)
2. Verify Network page loads without errors
3. Test all Network page functionality still works
4. Confirm no console errors related to captive portal

## Verification Status

- ✅ Backend compiled successfully (Flash: 33.5%, RAM: 15.6%)
- ✅ Frontend compiled successfully (Vite hot reload confirmed)
- ⏳ Runtime testing pending deployment to device

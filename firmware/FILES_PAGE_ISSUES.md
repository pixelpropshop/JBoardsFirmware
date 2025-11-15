# Files Page Issues

## Identified Issues (11/13/2025)

### Critical API Mismatches

#### 1. DELETE Endpoint - Incorrect Parameter Parsing
**Location:** `src/api/FilesEndpoints.cpp` - Line 157
**Issue:** Uses `request->hasParam("path", true)` and `request->getParam("path", true)` to parse JSON body
**Problem:** Frontend sends DELETE request with JSON body `{path: "/some/path"}`, but backend expects form data parameter
**Fix Required:** Add body handler to parse JSON request body

#### 2. PREVIEW Endpoint - Incorrect Parameter Parsing  
**Location:** `src/api/FilesEndpoints.cpp` - Line 194
**Issue:** Uses `request->hasParam("path", true)` and `request->getParam("path", true)` to parse JSON body
**Problem:** Frontend sends POST request with JSON body `{path: "/some/path"}`, but backend expects form data parameter
**Fix Required:** Add body handler to parse JSON request body

#### 3. UPLOAD Endpoint - Missing File Metadata in Response
**Location:** `src/api/FilesEndpoints.cpp` - Line 149
**Current Response:** `{success: true, message: "File uploaded successfully"}`
**Expected Response:** `{success: true, file: {filename, path, size, type, mimeType, lastModified}}`
**Problem:** Frontend expects full file metadata to add to file list without refetching
**Fix Required:** Return complete file metadata object in response

#### 4. Missing Helper Functions
**Location:** `src/api/FilesEndpoints.cpp` - Lines 80, 114, 197
**Issue:** References undefined functions:
- `getMimeTypeFromExtension()` - Called 3 times
- `getFileTypeName()` - Called once
**Problem:** Code will not compile
**Fix Required:** Implement both helper functions

---

## Resolution Plan

1. ✅ Create this documentation file
2. ⬜ Implement helper functions `getMimeTypeFromExtension()` and `getFileTypeName()`
3. ⬜ Fix DELETE endpoint to use JSON body handler
4. ⬜ Fix PREVIEW endpoint to use JSON body handler  
5. ⬜ Fix UPLOAD endpoint to return file metadata
6. ⬜ Build and upload firmware
7. ⬜ Test Files page functionality

---

## Notes

- DELETE and PREVIEW endpoints need AsyncCallbackJsonWebHandler to parse JSON bodies
- UPLOAD handler needs to collect file info and return it in final response
- Helper functions should support common file types (audio, fseq, json, txt, log, etc.)

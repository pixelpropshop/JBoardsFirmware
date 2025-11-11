# Effect Sequences API

Effect playlists with timed playback, FSEQ support, and playback control.

## 36. Get All Sequences

**Endpoint:** `GET /api/sequences`

**Response:**
```json
{
  "sequences": [
    {
      "id": "seq-1",
      "name": "Party Mode",
      "description": "High energy party sequence",
      "steps": [...],
      "loop": true,
      "createdAt": "2025-01-08T10:30:00Z",
      "updatedAt": "2025-01-09T14:20:00Z"
    }
  ]
}
```

**Notes:**
- duration: Seconds (0 = manual/infinite)
- transition: 'instant', 'fade', or 'crossfade'

## 37. Get Sequence by ID

**Endpoint:** `GET /api/sequences/{id}`

## 38. Create Sequence

**Endpoint:** `POST /api/sequences`

**Request:**
```json
{
  "name": "Sunset to Night",
  "description": "Peaceful evening transition",
  "steps": [
    {
      "effectId": "gradient",
      "parameters": {...},
      "duration": 120,
      "transition": "crossfade"
    }
  ],
  "loop": false
}
```

## 39. Update Sequence

**Endpoint:** `PUT /api/sequences/{id}`

**Notes:**
- Cannot change sequence ID
- Updates updatedAt timestamp

## 40. Delete Sequence

**Endpoint:** `DELETE /api/sequences/{id}`

**Notes:**
- Stops playback if currently playing

## 41. Play Sequence

**Endpoint:** `POST /api/sequences/{id}/play`

**Request:**
```json
{
  "fromStep": 0
}
```

**Response:**
```json
{
  "success": true,
  "message": "Sequence playback started",
  "state": {
    "sequenceId": "seq-1",
    "currentStepIndex": 0,
    "isPlaying": true,
    "isPaused": false,
    "remainingTime": 30,
    "totalElapsed": 0
  }
}
```

## 42. Pause Sequence

**Endpoint:** `POST /api/sequences/pause`

## 43. Resume Sequence

**Endpoint:** `POST /api/sequences/resume`

## 44. Stop Sequence

**Endpoint:** `POST /api/sequences/stop`

## 45. Next Step

**Endpoint:** `POST /api/sequences/next`

## 46. Previous Step

**Endpoint:** `POST /api/sequences/previous`

## 47. Get Playback State

**Endpoint:** `GET /api/sequences/playback/state`

**Response:**
```json
{
  "sequenceId": "seq-1",
  "currentStepIndex": 2,
  "isPlaying": true,
  "isPaused": false,
  "remainingTime": 20,
  "totalElapsed": 95
}
```

**Notes:**
- Returns null if no sequence playing
- Poll every 1-2 seconds for UI updates

## 48. Upload FSEQ Sequence

**Endpoint:** `POST /api/sequences/upload-fseq`

**Request:** `multipart/form-data`
- file: FSEQ file (.fseq extension)
- name: Sequence name (1-64 characters)
- description: Optional description

**Response:**
```json
{
  "success": true,
  "message": "FSEQ sequence uploaded successfully",
  "sequence": {
    "id": "fseq-1",
    "type": "fseq",
    "name": "Christmas Show",
    "fileName": "christmas_show.fseq",
    "fileSize": 2457600,
    "duration": 120,
    "frameRate": 40,
    "channelCount": 512,
    "loop": false,
    "uploadedAt": "2025-01-10T15:30:00Z"
  }
}
```

**Notes:**
- File size limit: 10MB
- FSEQ V2.0 (xLights format)
- Parser extracts duration, frameRate, channelCount

## 49. Update FSEQ Metadata

**Endpoint:** `PUT /api/sequences/fseq/{id}`

**Request:**
```json
{
  "name": "Christmas Show (Updated)",
  "audioUrl": "https://example.com/audio/christmas.mp3",
  "loop": true
}
```

**Notes:**
- Can only update name, audioUrl, and loop
- Cannot update FSEQ file itself (must re-upload)

## Transition Types

| Type | Behavior | Duration |
|------|----------|----------|
| instant | Immediate effect switch | 0ms |
| fade | Fade to black → switch → fade in | 1000ms |
| crossfade | Blend between effects | 1000ms |

/**
 * FSEQ File Parser for xLights V2.0 format
 * 
 * FSEQ V2.0 Header Structure:
 * - 0-3: Magic bytes "PSEQ" (4 bytes)
 * - 4-5: Header offset (2 bytes, little-endian)
 * - 6: Minor version (1 byte)
 * - 7: Major version (1 byte)
 * - 8-11: Channel data offset (4 bytes, little-endian)
 * - 12-15: Channel count (4 bytes, little-endian)
 * - 16-19: Frame count (4 bytes, little-endian)
 * - 20: Step time in milliseconds (1 byte)
 */

export interface FseqMetadata {
  duration: number;      // Duration in seconds
  frameRate: number;     // Frames per second
  channelCount: number;  // Number of channels
  frameCount: number;    // Total number of frames
  stepTime: number;      // Step time in milliseconds
  version: string;       // Format version (e.g., "2.0")
  fileSize: number;      // File size in bytes
}

export class FseqParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FseqParseError';
  }
}

/**
 * Parse FSEQ file and extract metadata
 */
export async function parseFseqFile(file: File): Promise<FseqMetadata> {
  // Read file as ArrayBuffer
  const buffer = await file.arrayBuffer();
  const dataView = new DataView(buffer);

  // Validate minimum file size (at least header)
  if (buffer.byteLength < 24) {
    throw new FseqParseError('File too small to be a valid FSEQ file');
  }

  // Read and validate magic bytes (offset 0-3)
  const magic = String.fromCharCode(
    dataView.getUint8(0),
    dataView.getUint8(1),
    dataView.getUint8(2),
    dataView.getUint8(3)
  );

  if (magic !== 'PSEQ') {
    throw new FseqParseError(`Invalid magic bytes: expected "PSEQ", got "${magic}"`);
  }

  // Read header offset (offset 4-5, little-endian)
  const headerOffset = dataView.getUint16(4, true);

  // Read version (offset 6-7)
  const minorVersion = dataView.getUint8(6);
  const majorVersion = dataView.getUint8(7);
  const version = `${majorVersion}.${minorVersion}`;

  // Validate version
  if (majorVersion !== 2) {
    throw new FseqParseError(`Unsupported FSEQ version: ${version} (only V2.x supported)`);
  }

  // Read channel data offset (offset 8-11, little-endian)
  const channelDataOffset = dataView.getUint32(8, true);

  // Read channel count (offset 12-15, little-endian)
  const channelCount = dataView.getUint32(12, true);

  // Read frame count (offset 16-19, little-endian)
  const frameCount = dataView.getUint32(16, true);

  // Read step time in milliseconds (offset 20)
  const stepTime = dataView.getUint8(20);

  // Validate data
  if (channelCount === 0) {
    throw new FseqParseError('Invalid channel count: 0');
  }

  if (frameCount === 0) {
    throw new FseqParseError('Invalid frame count: 0');
  }

  if (stepTime === 0) {
    throw new FseqParseError('Invalid step time: 0');
  }

  // Calculate derived values
  const frameRate = Math.round(1000 / stepTime); // Convert ms to fps
  const duration = Math.round((frameCount * stepTime) / 1000); // Convert to seconds

  return {
    duration,
    frameRate,
    channelCount,
    frameCount,
    stepTime,
    version,
    fileSize: buffer.byteLength,
  };
}

/**
 * Validate FSEQ file without parsing full metadata
 */
export async function validateFseqFile(file: File): Promise<boolean> {
  try {
    await parseFseqFile(file);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get human-readable file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Format duration in MM:SS format
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

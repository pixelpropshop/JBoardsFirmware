/**
 * Check if Web Crypto API is available
 * Note: crypto.subtle requires HTTPS (except on localhost)
 */
export function isCryptoAvailable(): boolean {
  return typeof crypto !== 'undefined' && 
         typeof crypto.subtle !== 'undefined' && 
         typeof crypto.subtle.digest === 'function';
}

/**
 * Calculate SHA256 hash of a file
 * @param file File to hash
 * @returns Promise<string> Hex-encoded SHA256 hash
 * @throws Error if Web Crypto API is not available
 */
export async function calculateSHA256(file: File): Promise<string> {
  // Check if Web Crypto API is available
  if (!isCryptoAvailable()) {
    throw new Error('Web Crypto API not available. HTTPS required for checksum verification.');
  }
  
  // Read file as ArrayBuffer
  const buffer = await file.arrayBuffer();
  
  // Calculate SHA256 hash using Web Crypto API
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  
  // Convert to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
}

/**
 * Verify file checksum against expected value
 * @param file File to verify
 * @param expectedChecksum Expected SHA256 hash (hex)
 * @returns Promise<boolean> True if checksum matches
 */
export async function verifyFileChecksum(file: File, expectedChecksum: string): Promise<boolean> {
  const actualChecksum = await calculateSHA256(file);
  return actualChecksum.toLowerCase() === expectedChecksum.toLowerCase();
}

/**
 * Format hash for display (truncated with ellipsis)
 * @param hash Full hash string
 * @param length Number of characters to show on each end
 * @returns Formatted hash like "abc123...def456"
 */
export function formatHash(hash: string, length: number = 8): string {
  if (hash.length <= length * 2) return hash;
  return `${hash.substring(0, length)}...${hash.substring(hash.length - length)}`;
}

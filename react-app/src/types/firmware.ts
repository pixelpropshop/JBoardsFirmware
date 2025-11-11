/**
 * Firmware version metadata from GitHub repository
 */
export interface FirmwareVersion {
  version: string;
  buildDate: string;
  stable: boolean;
  changelog: string;
  checksum?: string;
  fileSize?: number;
  minHardwareVersion?: string;
}

/**
 * Manifest for latest firmware version
 */
export interface FirmwareManifest {
  latestVersion: string;
  latestUrl: string;
  checksum?: string;
}

/**
 * Complete versions manifest with all available versions
 */
export interface VersionsManifest {
  versions: FirmwareVersion[];
}

/**
 * Update check result
 */
export interface UpdateCheckResult {
  updateAvailable: boolean;
  currentVersion: string;
  latestVersion: string;
  latestStable?: FirmwareVersion;
  allVersions?: FirmwareVersion[];
}

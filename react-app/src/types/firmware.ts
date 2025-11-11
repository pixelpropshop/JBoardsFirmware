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

/**
 * Firmware backup information
 */
export interface FirmwareBackup {
  hasBackup: boolean;
  backupVersion?: string;
  backupDate?: string;
  backupPartition?: string;
  backupSize?: number;
}

/**
 * OTA partition information
 */
export interface OTAPartition {
  partition: string;
  version: string;
  bootable: boolean;
  validated: boolean;
}

/**
 * OTA status information
 */
export interface OTAStatus {
  currentPartition: string;
  currentVersion: string;
  backupPartition?: string;
  backupVersion?: string;
  bootCount: number;
  lastBootSuccess: boolean;
  safeBoot: boolean;
  rollbackAvailable: boolean;
}

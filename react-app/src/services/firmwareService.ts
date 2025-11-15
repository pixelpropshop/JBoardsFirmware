import type {
  FirmwareVersion,
  FirmwareManifest,
  VersionsManifest,
  UpdateCheckResult,
  FirmwareBackup,
  OTAStatus,
} from '../types/firmware';
import { api } from './api';

// GitHub repository configuration
const GITHUB_REPO = 'pixelpropshop/JBoardsFirmware';
const GITHUB_RAW_BASE = `https://raw.githubusercontent.com/${GITHUB_REPO}/main`;

/**
 * Service for checking and downloading firmware updates from GitHub
 */
export const firmwareService = {
  /**
   * Normalize board name for GitHub paths (convert to uppercase for consistency)
   */
  normalizeBoardName(boardName: string): string {
    // Convert board name to uppercase and remove spaces
    // e.g., "JSense Board" or "jboard-16" -> "JBOARD-16"
    return boardName.toUpperCase().replace(/\s+BOARD$/, '').replace(/^JSENSE/, 'JBOARD-16');
  },

  /**
   * Get the GitHub URL for a board's manifest
   */
  getManifestUrl(boardName: string): string {
    const normalizedName = this.normalizeBoardName(boardName);
    return `${GITHUB_RAW_BASE}/${normalizedName}/manifest.json`;
  },

  /**
   * Get the GitHub URL for a board's versions manifest
   */
  getVersionsUrl(boardName: string): string {
    const normalizedName = this.normalizeBoardName(boardName);
    return `${GITHUB_RAW_BASE}/${normalizedName}/versions.json`;
  },

  /**
   * Get the GitHub URL for a specific firmware file
   */
  getFirmwareUrl(boardName: string, version: string): string {
    const normalizedName = this.normalizeBoardName(boardName);
    return `${GITHUB_RAW_BASE}/${normalizedName}/versions/${version}/firmware.bin`;
  },

  /**
   * Fetch latest firmware manifest from GitHub
   */
  async fetchManifest(boardName: string): Promise<FirmwareManifest> {
    const url = this.getManifestUrl(boardName);
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch manifest: ${response.statusText}`);
    }

    return await response.json();
  },

  /**
   * Fetch all available versions from GitHub
   */
  async fetchVersions(boardName: string): Promise<VersionsManifest> {
    const url = this.getVersionsUrl(boardName);
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch versions: ${response.statusText}`);
    }

    return await response.json();
  },

  /**
   * Check for firmware updates
   * @param boardName Board product name (e.g., "JSense")
   * @param currentVersion Current firmware version installed
   */
  async checkForUpdates(
    boardName: string,
    currentVersion: string
  ): Promise<UpdateCheckResult> {
    try {
      // Fetch both manifest and versions
      const [manifest, versionsData] = await Promise.all([
        this.fetchManifest(boardName),
        this.fetchVersions(boardName),
      ]);

      const latestVersion = manifest.latestVersion;
      const updateAvailable = this.compareVersions(currentVersion, latestVersion) < 0;

      // Find the latest stable version info
      const latestStable = versionsData.versions.find(
        (v) => v.version === latestVersion
      );

      return {
        updateAvailable,
        currentVersion,
        latestVersion,
        latestStable,
        allVersions: versionsData.versions,
      };
    } catch (error) {
      console.error('Failed to check for updates:', error);
      throw error;
    }
  },

  /**
   * Download firmware file as Blob
   * @param boardName Board product name
   * @param version Version to download
   */
  async downloadFirmware(
    boardName: string,
    version: string,
    progressCallback?: (progress: { loaded: number; total: number }) => void
  ): Promise<Blob> {
    const url = this.getFirmwareUrl(boardName, version);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.open('GET', url);
      xhr.responseType = 'blob';

      xhr.addEventListener('progress', (event) => {
        if (event.lengthComputable && progressCallback) {
          progressCallback({
            loaded: event.loaded,
            total: event.total,
          });
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(xhr.response);
        } else {
          reject(new Error(`Download failed with status ${xhr.status}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Download failed'));
      });

      xhr.addEventListener('abort', () => {
        reject(new Error('Download cancelled'));
      });

      xhr.send();
    });
  },

  /**
   * Compare two semantic version strings
   * @returns -1 if v1 < v2, 0 if equal, 1 if v1 > v2
   */
  compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const part1 = parts1[i] || 0;
      const part2 = parts2[i] || 0;

      if (part1 < part2) return -1;
      if (part1 > part2) return 1;
    }

    return 0;
  },

  /**
   * Format version for display with badge
   */
  formatVersionBadge(version: FirmwareVersion, currentVersion: string): {
    text: string;
    color: string;
  } {
    const isNewer = this.compareVersions(currentVersion, version.version) < 0;
    const isCurrent = currentVersion === version.version;
    const isOlder = this.compareVersions(currentVersion, version.version) > 0;

    if (isCurrent) {
      return { text: 'Current', color: 'blue' };
    } else if (isNewer) {
      return { text: 'New', color: 'green' };
    } else if (isOlder) {
      return { text: 'Older', color: 'gray' };
    }

    return { text: '', color: 'gray' };
  },

  /**
   * Get OTA partition status and backup information
   */
  async getOTAStatus(): Promise<OTAStatus> {
    try {
      const response = await api.fetch<OTAStatus>('/api/system/firmware/ota-status');
      return response;
    } catch (error) {
      console.error('Failed to get OTA status:', error);
      // Return mock data for development
      return {
        currentPartition: 'ota_0',
        currentVersion: '1.0.0',
        backupPartition: 'ota_1',
        backupVersion: '0.9.5',
        bootCount: 1,
        lastBootSuccess: true,
        safeBoot: false,
        rollbackAvailable: true,
      };
    }
  },

  /**
   * Get firmware backup information
   */
  async getBackupInfo(): Promise<FirmwareBackup> {
    try {
      const status = await this.getOTAStatus();
      
      return {
        hasBackup: status.rollbackAvailable,
        backupVersion: status.backupVersion,
        backupPartition: status.backupPartition,
      };
    } catch (error) {
      console.error('Failed to get backup info:', error);
      return {
        hasBackup: false,
      };
    }
  },

  /**
   * Rollback to previous firmware version
   */
  async rollbackFirmware(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.fetch<{ success: boolean; message: string }>(
        '/api/system/firmware/rollback',
        { method: 'POST' }
      );
      return response;
    } catch (error) {
      console.error('Failed to rollback firmware:', error);
      throw new Error('Failed to rollback to previous firmware version');
    }
  },

  /**
   * Mark current firmware boot as valid (prevents auto-rollback)
   */
  async markBootValid(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.fetch<{ success: boolean; message: string }>(
        '/api/system/firmware/mark-valid',
        { method: 'POST' }
      );
      return response;
    } catch (error) {
      console.error('Failed to mark boot as valid:', error);
      throw new Error('Failed to validate firmware boot');
    }
  },

  /**
   * Enable safe boot mode (boots to previous firmware on next restart)
   */
  async enableSafeBoot(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.fetch<{ success: boolean; message: string }>(
        '/api/system/firmware/safe-boot',
        { method: 'POST' }
      );
      return response;
    } catch (error) {
      console.error('Failed to enable safe boot:', error);
      throw new Error('Failed to enable safe boot mode');
    }
  },
};

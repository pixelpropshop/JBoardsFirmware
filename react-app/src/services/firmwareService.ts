import type {
  FirmwareVersion,
  FirmwareManifest,
  VersionsManifest,
  UpdateCheckResult,
} from '../types/firmware';

// GitHub repository configuration
const GITHUB_REPO = 'pixelpropshop/JBoardsFirmware';
const GITHUB_RAW_BASE = `https://raw.githubusercontent.com/${GITHUB_REPO}/main`;

/**
 * Service for checking and downloading firmware updates from GitHub
 */
export const firmwareService = {
  /**
   * Get the GitHub URL for a board's manifest
   */
  getManifestUrl(boardName: string): string {
    return `${GITHUB_RAW_BASE}/${boardName}/manifest.json`;
  },

  /**
   * Get the GitHub URL for a board's versions manifest
   */
  getVersionsUrl(boardName: string): string {
    return `${GITHUB_RAW_BASE}/${boardName}/versions.json`;
  },

  /**
   * Get the GitHub URL for a specific firmware file
   */
  getFirmwareUrl(boardName: string, version: string): string {
    return `${GITHUB_RAW_BASE}/${boardName}/versions/${version}/firmware.bin`;
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
};

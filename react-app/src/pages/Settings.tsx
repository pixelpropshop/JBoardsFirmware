import { useState, useEffect } from 'react';
import { systemService } from '../services/systemService';
import { firmwareService } from '../services/firmwareService';
import type { SystemInfo, FirmwareUpdateProgress } from '../types/system';
import type { UpdateCheckResult, OTAStatus } from '../types/firmware';
import { calculateSHA256 } from '../utils/crypto';

export default function Settings() {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingFirmware, setUploadingFirmware] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<FirmwareUpdateProgress | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [expectedChecksum, setExpectedChecksum] = useState('');
  const [calculatingChecksum, setCalculatingChecksum] = useState(false);
  const [fileChecksum, setFileChecksum] = useState('');
  const [checkingForUpdates, setCheckingForUpdates] = useState(false);
  const [updateCheckResult, setUpdateCheckResult] = useState<UpdateCheckResult | null>(null);
  const [showAllVersions, setShowAllVersions] = useState(false);
  const [downloadingFirmware, setDownloadingFirmware] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [otaStatus, setOtaStatus] = useState<OTAStatus | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
    dangerous?: boolean;
    secondConfirm?: string;
  } | null>(null);

  useEffect(() => {
    loadSystemInfo();
    loadOtaStatus();
  }, []);

  const loadSystemInfo = async () => {
    try {
      setLoading(true);
      const info = await systemService.getSystemInfo();
      setSystemInfo(info);
    } catch (error) {
      console.error('Failed to load system info:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOtaStatus = async () => {
    try {
      const status = await firmwareService.getOTAStatus();
      setOtaStatus(status);
    } catch (error) {
      console.error('Failed to load OTA status:', error);
    }
  };

  const handleCheckForUpdates = async () => {
    if (!systemInfo) return;

    try {
      setCheckingForUpdates(true);
      setActionMessage(null);
      
      const result = await firmwareService.checkForUpdates(
        systemInfo.productName,
        systemInfo.firmwareVersion
      );
      
      setUpdateCheckResult(result);
      
      if (result.updateAvailable) {
        setActionMessage({
          type: 'success',
          text: `Update available! Latest version: ${result.latestVersion}`,
        });
      } else {
        setActionMessage({
          type: 'success',
          text: 'You have the latest firmware version.',
        });
      }
    } catch (error) {
      console.error('Failed to check for updates:', error);
      setActionMessage({
        type: 'error',
        text: 'Failed to check for updates. Please check your internet connection.',
      });
    } finally {
      setCheckingForUpdates(false);
    }
  };

  const handleDownloadAndInstall = async (version: string) => {
    if (!systemInfo) return;

    setConfirmDialog({
      title: 'Download and Install Firmware',
      message: `Download and install firmware version ${version}? Device will restart after update.`,
      onConfirm: () => performDownloadAndInstall(version),
    });
  };

  const performDownloadAndInstall = async (version: string) => {
    if (!systemInfo) return;

    try {
      setDownloadingFirmware(true);
      setDownloadProgress(0);
      setActionMessage({ type: 'success', text: 'Downloading firmware from GitHub...' });

      // Download firmware from GitHub
      const blob = await firmwareService.downloadFirmware(
        systemInfo.productName,
        version,
        (progress) => {
          const percent = Math.round((progress.loaded / progress.total) * 100);
          setDownloadProgress(percent);
        }
      );

      setActionMessage({ type: 'success', text: 'Download complete. Installing firmware...' });

      // Convert blob to File
      const file = new File([blob], `firmware-${version}.bin`, { type: 'application/octet-stream' });

      // Get checksum if available
      const versionInfo = updateCheckResult?.allVersions?.find((v) => v.version === version);
      const checksum = versionInfo?.checksum;

      // Upload firmware using existing flow
      setUploadingFirmware(true);
      setUploadProgress(null);

      const result = await systemService.uploadFirmware(
        file,
        (progress) => {
          setUploadProgress(progress);
        },
        checksum
      );

      if (result.success) {
        setActionMessage({ type: 'success', text: result.message });
        
        // Device will restart
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      } else {
        setActionMessage({ type: 'error', text: result.message || result.error || 'Firmware update failed' });
      }
    } catch (error) {
      setActionMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to download firmware' });
      console.error(error);
    } finally {
      setDownloadingFirmware(false);
      setDownloadProgress(0);
      setUploadingFirmware(false);
      setUploadProgress(null);
    }
  };

  const handleFirmwareUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file extension
    if (!file.name.endsWith('.bin')) {
      setActionMessage({ type: 'error', text: 'Please select a valid .bin firmware file' });
      event.target.value = '';
      return;
    }

    // Calculate checksum for verification
    if (showAdvancedOptions) {
      setCalculatingChecksum(true);
      try {
        const checksum = await calculateSHA256(file);
        setFileChecksum(checksum);
      } catch (error) {
        console.error('Failed to calculate checksum:', error);
      }
      setCalculatingChecksum(false);
    }

    // Show confirmation dialog
    setConfirmDialog({
      title: 'Upload Firmware',
      message: `Upload firmware "${file.name}" (${systemService.formatBytes(file.size)})? Device will restart after update.`,
      onConfirm: () => performFirmwareUpload(file, event.target),
    });
  };

  const performFirmwareUpload = async (file: File, input: HTMLInputElement) => {
    try {
      setUploadingFirmware(true);
      setUploadProgress(null);
      setActionMessage(null);

      // Use checksum verification if provided
      const checksum = showAdvancedOptions && expectedChecksum ? expectedChecksum : undefined;

      const result = await systemService.uploadFirmware(
        file,
        (progress) => {
          setUploadProgress(progress);
        },
        checksum
      );

      if (result.success) {
        setActionMessage({ type: 'success', text: result.message });
        
        // Clear file input and checksum state
        setFileChecksum('');
        setExpectedChecksum('');
        
        // Device will restart, so show message for a few seconds
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      } else {
        setActionMessage({ type: 'error', text: result.message || result.error || 'Firmware update failed' });
      }

      input.value = '';
    } catch (error) {
      setActionMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to upload firmware' });
      console.error(error);
    } finally {
      setUploadingFirmware(false);
      setUploadProgress(null);
    }
  };

  const handleRestart = () => {
    setConfirmDialog({
      title: 'Restart Device',
      message: 'Restart the device? You will lose connection temporarily.',
      onConfirm: performRestart,
    });
  };

  const performRestart = async () => {
    try {
      setActionMessage(null);
      const result = await systemService.restartDevice();
      
      if (result.success) {
        setActionMessage({ type: 'success', text: 'Device restarting... Please wait 10-15 seconds.' });
        // Reload page after delay
        setTimeout(() => {
          window.location.reload();
        }, 15000);
      } else {
        setActionMessage({ type: 'error', text: result.message || 'Failed to restart device' });
      }
    } catch (error) {
      setActionMessage({ type: 'error', text: 'Failed to restart device' });
      console.error(error);
    }
  };

  const handleFactoryReset = () => {
    setConfirmDialog({
      title: '⚠️ Factory Reset',
      message: 'This will erase ALL settings and configurations. Are you sure?',
      dangerous: true,
      secondConfirm: '⚠️ FINAL WARNING - This action cannot be undone. Proceed with factory reset?',
      onConfirm: performFactoryReset,
    });
  };

  const performFactoryReset = async () => {
    try {
      setActionMessage(null);
      const result = await systemService.factoryReset();
      
      if (result.success) {
        setActionMessage({ type: 'success', text: 'Factory reset initiated. Device will restart with default settings.' });
        // Reload page after delay
        setTimeout(() => {
          window.location.reload();
        }, 15000);
      } else {
        setActionMessage({ type: 'error', text: result.message || 'Failed to perform factory reset' });
      }
    } catch (error) {
      setActionMessage({ type: 'error', text: 'Failed to perform factory reset' });
      console.error(error);
    }
  };

  const handleExportConfig = async () => {
    try {
      setActionMessage(null);
      const blob = await systemService.exportConfig();
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `jsense-config-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setActionMessage({ type: 'success', text: 'Configuration exported successfully' });
    } catch (error) {
      setActionMessage({ type: 'error', text: 'Failed to export configuration' });
      console.error(error);
    }
  };

  const handleClearLogs = () => {
    setConfirmDialog({
      title: 'Clear System Logs',
      message: 'Clear all system logs?',
      onConfirm: performClearLogs,
    });
  };

  const performClearLogs = async () => {
    try {
      setActionMessage(null);
      const result = await systemService.clearLogs();
      
      if (result.success) {
        setActionMessage({ type: 'success', text: 'System logs cleared successfully' });
      } else {
        setActionMessage({ type: 'error', text: result.message || 'Failed to clear logs' });
      }
    } catch (error) {
      setActionMessage({ type: 'error', text: 'Failed to clear logs' });
      console.error(error);
    }
  };

  const handleRollback = () => {
    setConfirmDialog({
      title: 'Rollback Firmware',
      message: `Roll back to previous firmware version ${otaStatus?.backupVersion || ''}? Device will restart.`,
      dangerous: true,
      onConfirm: performRollback,
    });
  };

  const performRollback = async () => {
    try {
      setActionMessage(null);
      const result = await firmwareService.rollbackFirmware();
      
      if (result.success) {
        setActionMessage({ type: 'success', text: result.message });
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      } else {
        setActionMessage({ type: 'error', text: result.message || 'Failed to rollback firmware' });
      }
    } catch (error) {
      setActionMessage({ type: 'error', text: 'Failed to rollback to previous firmware' });
      console.error(error);
    }
  };

  const handleMarkBootValid = async () => {
    try {
      setActionMessage(null);
      const result = await firmwareService.markBootValid();
      
      if (result.success) {
        setActionMessage({ type: 'success', text: 'Firmware validated successfully' });
        await loadOtaStatus();
      } else {
        setActionMessage({ type: 'error', text: result.message || 'Failed to validate firmware' });
      }
    } catch (error) {
      setActionMessage({ type: 'error', text: 'Failed to validate firmware boot' });
      console.error(error);
    }
  };

  const handleEnableSafeBoot = async () => {
    try {
      setActionMessage(null);
      const result = await firmwareService.enableSafeBoot();
      
      if (result.success) {
        setActionMessage({ type: 'success', text: result.message });
      } else {
        setActionMessage({ type: 'error', text: result.message || 'Failed to enable safe boot' });
      }
    } catch (error) {
      setActionMessage({ type: 'error', text: 'Failed to enable safe boot mode' });
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading system information...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-semibold mb-2">Settings</h1>
        <p className="text-gray-500">Device configuration and system administration</p>
      </div>

      {actionMessage && (
        <div
          className={`mb-4 p-3 rounded-lg ${
            actionMessage.type === 'success'
              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
              : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
          }`}
        >
          {actionMessage.text}
          <button onClick={() => setActionMessage(null)} className="ml-4 underline hover:no-underline">
            Dismiss
          </button>
        </div>
      )}

      <div className="max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Product Info */}
        {systemInfo && (
          <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-4 bg-white/60 dark:bg-gray-950/60">
            <h2 className="text-lg font-medium mb-4">Product Information</h2>
            
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <dt className="text-gray-500">Product Name</dt>
              <dd>{systemInfo.productName}</dd>
              
              <dt className="text-gray-500">Hostname</dt>
              <dd>{systemInfo.hostname}</dd>
              
              <dt className="text-gray-500">Firmware Version</dt>
              <dd>{systemInfo.firmwareVersion}</dd>
              
              <dt className="text-gray-500">Build Date</dt>
              <dd>
                {systemInfo.buildDate}
                {systemInfo.buildTime && ` ${systemInfo.buildTime}`}
              </dd>
            </dl>
          </div>
        )}

        {/* Hardware Info */}
        {systemInfo && (
          <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-4 bg-white/60 dark:bg-gray-950/60">
            <h2 className="text-lg font-medium mb-4">Hardware Information</h2>
            
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <dt className="text-gray-500">Chip Model</dt>
              <dd>
                {systemInfo.chipModel}
                {systemInfo.chipRevision && ` (Rev ${systemInfo.chipRevision})`}
              </dd>
              
              <dt className="text-gray-500">Flash Size</dt>
              <dd>{systemService.formatBytes(systemInfo.flashSize)}</dd>
              
              <dt className="text-gray-500">CPU Frequency</dt>
              <dd>{systemInfo.cpuFrequency} MHz</dd>
              
              <dt className="text-gray-500">MAC Address (WiFi)</dt>
              <dd className="font-mono text-xs">{systemInfo.macAddressWiFi}</dd>

              {systemInfo.macAddressAP && (
                <>
                  <dt className="text-gray-500">MAC Address (AP)</dt>
                  <dd className="font-mono text-xs">{systemInfo.macAddressAP}</dd>
                </>
              )}
            </dl>
          </div>
        )}

        {/* Firmware Update & Manual Upload */}
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-4 bg-white/60 dark:bg-gray-950/60">
          <h2 className="text-lg font-medium mb-4">Firmware Update</h2>
          
          <div className="space-y-4">
            {/* Check for Updates */}
            <div className="space-y-3">
              <button
                onClick={handleCheckForUpdates}
                disabled={checkingForUpdates || !systemInfo}
                className={`w-full px-4 py-2 rounded-lg text-white transition-colors ${
                  checkingForUpdates
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {checkingForUpdates ? 'Checking for Updates...' : '🔍 Check for Updates'}
              </button>

              {updateCheckResult && (
                <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Current Version: {updateCheckResult.currentVersion}
                      </p>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Latest Version: {updateCheckResult.latestVersion}
                      </p>
                    </div>
                    {updateCheckResult.updateAvailable && (
                      <span className="px-2 py-1 bg-green-600 text-white text-xs rounded-full">
                        Update Available
                      </span>
                    )}
                  </div>

                  {updateCheckResult.latestStable && updateCheckResult.updateAvailable && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Latest Release Notes:
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-line">
                        {updateCheckResult.latestStable.changelog}
                      </p>
                      <button
                        onClick={() => handleDownloadAndInstall(updateCheckResult.latestVersion)}
                        disabled={downloadingFirmware || uploadingFirmware}
                        className="mt-2 w-full px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white transition-colors"
                      >
                        📥 Download and Install v{updateCheckResult.latestVersion}
                      </button>
                    </div>
                  )}

                  {updateCheckResult.allVersions && updateCheckResult.allVersions.length > 1 && (
                    <div>
                      <button
                        onClick={() => setShowAllVersions(!showAllVersions)}
                        className="text-sm text-brand-600 hover:underline"
                      >
                        {showAllVersions ? '▼' : '▶'} View All Versions ({updateCheckResult.allVersions.length})
                      </button>

                      {showAllVersions && (
                        <div className="mt-2 space-y-2 max-h-64 overflow-y-auto">
                          {updateCheckResult.allVersions.map((version) => {
                            const badge = firmwareService.formatVersionBadge(
                              version,
                              updateCheckResult.currentVersion
                            );
                            return (
                              <div
                                key={version.version}
                                className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-sm">v{version.version}</span>
                                    {badge.text && (
                                      <span
                                        className={`px-2 py-0.5 text-xs rounded-full ${
                                          badge.color === 'blue'
                                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200'
                                            : badge.color === 'green'
                                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                                        }`}
                                      >
                                        {badge.text}
                                      </span>
                                    )}
                                    {version.stable && (
                                      <span className="px-2 py-0.5 text-xs rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200">
                                        Stable
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-xs text-gray-500">{version.buildDate}</span>
                                </div>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 whitespace-pre-line">
                                  {version.changelog}
                                </p>
                                {badge.text !== 'Current' && (
                                  <button
                                    onClick={() => handleDownloadAndInstall(version.version)}
                                    disabled={downloadingFirmware || uploadingFirmware}
                                    className="w-full px-3 py-1.5 rounded-lg text-sm bg-brand-600 hover:bg-brand-700 text-white transition-colors disabled:bg-gray-400"
                                  >
                                    Install v{version.version}
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {downloadingFirmware && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Downloading firmware from GitHub... {downloadProgress}%
                  </p>
                  <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-600 transition-all duration-300"
                      style={{ width: `${downloadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200 dark:border-gray-800"></div>

            {/* Manual Upload */}
            <div className="space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Or upload a firmware file (.bin) manually. The device will automatically restart after the update.
              </p>

              <label className="block">
                <input
                  type="file"
                  accept=".bin"
                  onChange={handleFirmwareUpload}
                  disabled={uploadingFirmware}
                  className="hidden"
                />
                <div
                  className={`px-4 py-2 rounded-lg text-center cursor-pointer transition-colors ${
                    uploadingFirmware
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-brand-600 hover:bg-brand-700 text-white'
                  }`}
                >
                  {uploadingFirmware ? 'Uploading Firmware...' : '📤 Upload Firmware File (.bin)'}
                </div>
              </label>

              {uploadingFirmware && uploadProgress && (
                <div className="space-y-2">
                  {/* Stage indicator */}
                  <div className="flex items-center gap-2 text-sm">
                    <div className={`w-2 h-2 rounded-full animate-pulse ${
                      uploadProgress.stage === 'verifying' ? 'bg-yellow-500' :
                      uploadProgress.stage === 'uploading' ? 'bg-blue-500' :
                      uploadProgress.stage === 'installing' ? 'bg-purple-500' :
                      'bg-green-500'
                    }`} />
                    <span className="text-gray-700 dark:text-gray-300 font-medium">
                      {uploadProgress.stage === 'verifying' ? '🔍 Verifying' :
                       uploadProgress.stage === 'uploading' ? '📤 Uploading' :
                       uploadProgress.stage === 'installing' ? '⚙️ Installing' :
                       '✅ Complete'}
                    </span>
                  </div>

                  {/* Progress message */}
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {uploadProgress.message}
                  </p>

                  {/* Progress bar */}
                  <div>
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                      <span>Progress</span>
                      <span>{uploadProgress.progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-600 transition-all duration-300"
                        style={{ width: `${uploadProgress.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Upload details (bytes and time remaining) */}
                  {uploadProgress.bytesUploaded !== undefined && uploadProgress.totalBytes !== undefined && (
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>
                        {systemService.formatBytes(uploadProgress.bytesUploaded)} / {systemService.formatBytes(uploadProgress.totalBytes)}
                      </span>
                      {uploadProgress.timeRemaining !== undefined && uploadProgress.timeRemaining > 0 && (
                        <span>~{uploadProgress.timeRemaining}s remaining</span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Advanced options */}
              <button
                onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                className="text-sm text-brand-600 hover:underline"
              >
                {showAdvancedOptions ? '▼' : '▶'} Advanced Options
              </button>

              {showAdvancedOptions && (
                <div className="space-y-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Expected SHA256 Checksum (Optional)
                    </label>
                    <input
                      type="text"
                      value={expectedChecksum}
                      onChange={(e) => setExpectedChecksum(e.target.value)}
                      placeholder="Enter expected checksum to verify file integrity"
                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      disabled={uploadingFirmware}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      If provided, the file will be verified before upload
                    </p>
                  </div>

                  {fileChecksum && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        File Checksum
                      </label>
                      <div className="p-2 bg-white dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-700">
                        <p className="text-xs font-mono break-all text-gray-700 dark:text-gray-300">
                          {fileChecksum}
                        </p>
                      </div>
                      {expectedChecksum && (
                        <p className={`mt-1 text-xs ${
                          fileChecksum.toLowerCase() === expectedChecksum.toLowerCase()
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}>
                          {fileChecksum.toLowerCase() === expectedChecksum.toLowerCase()
                            ? '✓ Checksum matches'
                            : '✗ Checksum does not match'}
                        </p>
                      )}
                    </div>
                  )}

                  {calculatingChecksum && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Calculating checksum...
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Firmware Backup & Rollback */}
        {otaStatus && (
          <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-4 bg-white/60 dark:bg-gray-950/60">
            <h2 className="text-lg font-medium mb-4">Firmware Backup & Recovery</h2>
            
            <div className="space-y-3">
              <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <dt className="text-gray-500">Current Version</dt>
                  <dd className="font-medium">{otaStatus.currentVersion}</dd>
                  
                  <dt className="text-gray-500">Current Partition</dt>
                  <dd className="font-mono text-xs">{otaStatus.currentPartition}</dd>
                  
                  {otaStatus.rollbackAvailable && (
                    <>
                      <dt className="text-gray-500">Backup Version</dt>
                      <dd className="font-medium text-blue-600 dark:text-blue-400">{otaStatus.backupVersion}</dd>
                      
                      <dt className="text-gray-500">Backup Partition</dt>
                      <dd className="font-mono text-xs">{otaStatus.backupPartition}</dd>
                    </>
                  )}
                  
                  <dt className="text-gray-500">Boot Count</dt>
                  <dd>{otaStatus.bootCount}</dd>
                  
                  <dt className="text-gray-500">Last Boot</dt>
                  <dd className={otaStatus.lastBootSuccess ? 'text-green-600' : 'text-red-600'}>
                    {otaStatus.lastBootSuccess ? '✓ Success' : '✗ Failed'}
                  </dd>
                </dl>
              </div>

              {otaStatus.rollbackAvailable ? (
                <div className="space-y-2">
                  <button
                    onClick={handleRollback}
                    className="w-full px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white transition-colors"
                  >
                    ⏮️ Rollback to v{otaStatus.backupVersion}
                  </button>
                  
                  {!otaStatus.safeBoot && (
                    <button
                      onClick={handleEnableSafeBoot}
                      className="w-full px-4 py-2 rounded-lg bg-yellow-600 hover:bg-yellow-700 text-white transition-colors"
                    >
                      🛡️ Enable Safe Boot (Test Backup)
                    </button>
                  )}
                  
                  {otaStatus.bootCount <= 3 && (
                    <button
                      onClick={handleMarkBootValid}
                      className="w-full px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors"
                    >
                      ✓ Confirm Firmware Working
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">
                  No backup firmware available. A backup will be created after your next firmware update.
                </p>
              )}

              {otaStatus.safeBoot && (
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    ⚠️ Safe boot enabled. Device will boot from backup firmware on next restart.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}


        {/* System Actions */}
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-4 bg-white/60 dark:bg-gray-950/60">
          <h2 className="text-lg font-medium mb-4">System Actions</h2>
          
          <div className="space-y-2">
            <button
              onClick={handleExportConfig}
              className="w-full px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
            >
              Export Configuration
            </button>

            <button
              onClick={handleClearLogs}
              className="w-full px-4 py-2 rounded-lg bg-yellow-600 hover:bg-yellow-700 text-white transition-colors"
            >
              Clear System Logs
            </button>

            <button
              onClick={handleRestart}
              className="w-full px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white transition-colors"
            >
              Restart Device
            </button>

            <button
              onClick={handleFactoryReset}
              className="w-full px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors"
            >
              ⚠️ Factory Reset
            </button>
          </div>

          <p className="mt-3 text-xs text-gray-500">
            <strong>Warning:</strong> Factory reset will erase all settings, WiFi credentials, and configurations. This action cannot be undone.
          </p>
        </div>

      </div>

      {/* Confirmation Dialog */}
      {confirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-800">
            <h3 className={`text-lg font-semibold mb-3 ${confirmDialog.dangerous ? 'text-red-600' : ''}`}>
              {confirmDialog.title}
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              {confirmDialog.message}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setConfirmDialog(null);
                }}
                className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (confirmDialog.secondConfirm) {
                    // Show second confirmation
                    setConfirmDialog({
                      title: confirmDialog.title,
                      message: confirmDialog.secondConfirm,
                      dangerous: true,
                      onConfirm: confirmDialog.onConfirm,
                    });
                  } else {
                    confirmDialog.onConfirm();
                    setConfirmDialog(null);
                  }
                }}
                className={`px-4 py-2 rounded-lg text-white transition-colors ${
                  confirmDialog.dangerous
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-brand-600 hover:bg-brand-700'
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

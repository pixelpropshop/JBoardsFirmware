import { useState, useEffect } from 'react';
import { systemService } from '../services/systemService';
import type { SystemInfo } from '../types/system';

export default function About() {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingFirmware, setUploadingFirmware] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadSystemInfo();
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

  const handleFirmwareUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file extension
    if (!file.name.endsWith('.bin')) {
      setActionMessage({ type: 'error', text: 'Please select a valid .bin firmware file' });
      event.target.value = '';
      return;
    }

    if (!confirm(`Upload firmware "${file.name}"? Device will restart after update.`)) {
      event.target.value = '';
      return;
    }

    try {
      setUploadingFirmware(true);
      setUploadProgress(0);
      setActionMessage(null);

      // Simulate progress for mock data
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const result = await systemService.uploadFirmware(file);

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (result.success) {
        setActionMessage({ type: 'success', text: result.message });
        // Device will restart, so show message for a few seconds
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      } else {
        setActionMessage({ type: 'error', text: result.message || 'Firmware update failed' });
      }

      event.target.value = '';
    } catch (error) {
      setActionMessage({ type: 'error', text: 'Failed to upload firmware' });
      console.error(error);
    } finally {
      setUploadingFirmware(false);
    }
  };

  const handleRestart = async () => {
    if (!confirm('Restart the device? You will lose connection temporarily.')) return;

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

  const handleFactoryReset = async () => {
    if (!confirm('⚠️ FACTORY RESET - This will erase ALL settings and configurations. Are you sure?')) return;
    if (!confirm('⚠️ FINAL WARNING - This action cannot be undone. Proceed with factory reset?')) return;

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

  const handleClearLogs = async () => {
    if (!confirm('Clear all system logs?')) return;

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
        <h1 className="text-2xl font-semibold mb-2">About</h1>
        <p className="text-gray-500">System information and administration</p>
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

      <div className="max-w-2xl space-y-4">
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

        {/* Firmware Update */}
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-4 bg-white/60 dark:bg-gray-950/60">
          <h2 className="text-lg font-medium mb-4">Firmware Update</h2>
          
          <div className="space-y-3">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Upload a new firmware file (.bin) to update the device. The device will automatically restart after the update.
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
                {uploadingFirmware ? 'Uploading Firmware...' : 'Select Firmware File (.bin)'}
              </div>
            </label>

            {uploadingFirmware && (
              <div>
                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                  <span>Upload Progress</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-600 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

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

        {/* Resources */}
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-4 bg-white/60 dark:bg-gray-950/60">
          <h2 className="text-lg font-medium mb-4">Resources</h2>
          
          <div className="space-y-2">
            <a
              href="https://github.com/pixelpropshop/JSenseFirmware"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-brand-600 hover:underline"
            >
              📦 GitHub Repository
            </a>
            <a
              href="https://github.com/pixelpropshop/JSenseFirmware/wiki"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-brand-600 hover:underline"
            >
              📚 Documentation
            </a>
            <a
              href="https://github.com/pixelpropshop/JSenseFirmware/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-brand-600 hover:underline"
            >
              🐛 Report Issues
            </a>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800 text-xs text-gray-500">
            <p className="mb-2">
              <strong>Open Source:</strong> This project is open source and uses various third-party libraries.
            </p>
            <p>
              © 2025 Pixel Prop Shop. Licensed under MIT License.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

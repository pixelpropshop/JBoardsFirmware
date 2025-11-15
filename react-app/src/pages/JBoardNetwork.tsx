import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jboardService } from '../services/jboardService';
import type { JBoardDevice, ThisDevice } from '../types/jboard';
import { DeviceType, DeviceCapability } from '../types/jboard';
import ConfirmDialog from '../components/ConfirmDialog';

export default function JBoardNetwork() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [thisDevice, setThisDevice] = useState<ThisDevice | null>(null);
  const [peers, setPeers] = useState<JBoardDevice[]>([]);
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showScanModal, setShowScanModal] = useState(false);
  const [discoveredDevices, setDiscoveredDevices] = useState<JBoardDevice[]>([]);
  const [pairing, setPairing] = useState<string | null>(null);
  const [showPairingWizard, setShowPairingWizard] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<JBoardDevice | null>(null);
  const [customName, setCustomName] = useState('');
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [broadcastType, setBroadcastType] = useState('');
  const [broadcastData, setBroadcastData] = useState('{}');
  const [broadcasting, setBroadcasting] = useState(false);
  const [confirmUnpair, setConfirmUnpair] = useState<string | null>(null);
  const [confirmBroadcast, setConfirmBroadcast] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  // Fix #12: Auto-dismiss success messages after 5 seconds
  useEffect(() => {
    if (message?.type === 'success') {
      const timer = setTimeout(() => {
        setMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const loadData = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setLoadError(null);
    
    try {
      const [device, peerList] = await Promise.all([
        jboardService.getThisDevice(),
        jboardService.getPeers(),
      ]);
      setThisDevice(device);
      setPeers(peerList);
    } catch (error: any) {
      const errorMessage = error?.message || error?.toString() || 'Unknown error occurred';
      const fullError = `Failed to load JBoard network data: ${errorMessage}`;
      
      if (isRefresh) {
        setMessage({ type: 'error', text: fullError });
      } else {
        setLoadError(fullError);
      }
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  const handleScan = async () => {
    setScanning(true);
    setMessage(null);
    setDiscoveredDevices([]);
    setShowScanModal(true);
    
    // Add scan timeout (Fix #6)
    const scanTimeout = setTimeout(() => {
      setScanning(false);
      setMessage({ type: 'error', text: 'Scan timeout - no response from network' });
    }, 30000); // 30 second timeout
    
    try {
      const result = await jboardService.startScan();
      clearTimeout(scanTimeout);
      
      if (result.success && result.devices) {
        setDiscoveredDevices(result.devices);
        if (result.devices.length === 0) {
          setMessage({ type: 'success', text: 'Scan complete - no new devices found' });
        }
      } else {
        setMessage({ type: 'error', text: result.message || 'Scan failed' });
        setShowScanModal(false);
      }
    } catch (error: any) {
      clearTimeout(scanTimeout);
      const errorMessage = error?.message || error?.toString() || 'Unknown error';
      setMessage({ type: 'error', text: `Failed to start scan: ${errorMessage}` });
      setShowScanModal(false);
    } finally {
      setScanning(false);
    }
  };

  const openPairingWizard = (device: JBoardDevice) => {
    setSelectedDevice(device);
    setCustomName(device.name);
    setShowPairingWizard(true);
  };

  const closePairingWizard = () => {
    setShowPairingWizard(false);
    setSelectedDevice(null);
    setCustomName('');
  };

  const handlePair = async () => {
    if (!selectedDevice) return;
    
    setPairing(selectedDevice.mac);
    try {
      const finalName = customName.trim() || selectedDevice.name;
      const result = await jboardService.pairDevice(selectedDevice.mac, finalName);
      if (result.success) {
        setMessage({ type: 'success', text: `Paired with ${finalName}` });
        const remainingDevices = discoveredDevices.filter(d => d.mac !== selectedDevice.mac);
        setDiscoveredDevices(remainingDevices);
        closePairingWizard();
        
        // Auto-close scan modal if no more devices to pair
        if (remainingDevices.length === 0) {
          setShowScanModal(false);
        }
        
        // Fix #4: Keep pairing state during loadData to prevent race condition
        await loadData(true);
        setPairing(null);
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to pair' });
        setPairing(null);
      }
    } catch (error: any) {
      const errorMessage = error?.message || error?.toString() || 'Unknown error';
      setMessage({ type: 'error', text: `Failed to pair device: ${errorMessage}` });
      setPairing(null);
    }
  };

  const closeScanModal = () => {
    setShowScanModal(false);
    setDiscoveredDevices([]);
  };

  const handleUnpair = (mac: string) => {
    setConfirmUnpair(mac);
  };

  const performUnpair = async (mac: string) => {
    try {
      const result = await jboardService.unpairDevice(mac);
      if (result.success) {
        setMessage({ type: 'success', text: 'Device unpaired' });
        await loadData(true);
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to unpair' });
      }
    } catch (error: any) {
      const errorMessage = error?.message || error?.toString() || 'Unknown error';
      setMessage({ type: 'error', text: `Failed to unpair device: ${errorMessage}` });
    }
  };

  const confirmBroadcastAction = () => {
    if (!broadcastType.trim()) return;

    // Validate broadcast command (Fix #3)
    const commandPattern = /^[a-zA-Z0-9_]+$/;
    if (!commandPattern.test(broadcastType)) {
      setMessage({ type: 'error', text: 'Command type must contain only letters, numbers, and underscores' });
      return;
    }
    if (broadcastType.length > 50) {
      setMessage({ type: 'error', text: 'Command type must be 50 characters or less' });
      return;
    }

    // Show confirmation dialog
    setConfirmBroadcast(true);
  };

  const handleBroadcast = async () => {
    setBroadcasting(true);
    setMessage(null);
    try {
      let data = {};
      if (broadcastData.trim()) {
        try {
          data = JSON.parse(broadcastData);
        } catch (parseError) {
          setMessage({ type: 'error', text: 'Invalid JSON in data field' });
          setBroadcasting(false);
          return;
        }
      }

      const result = await jboardService.broadcast(broadcastType, data);
      if (result.success) {
        setMessage({ type: 'success', text: `Broadcast sent to ${peers.length} device${peers.length !== 1 ? 's' : ''}` });
        setBroadcastType('');
        setBroadcastData('{}');
        setShowBroadcast(false);
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to send broadcast' });
      }
    } catch (error: any) {
      const errorMessage = error?.message || error?.toString() || 'Unknown error';
      setMessage({ type: 'error', text: `Network error while broadcasting: ${errorMessage}` });
    } finally {
      setBroadcasting(false);
    }
  };

  const getDeviceTypeName = (type: DeviceType): string => {
    switch (type) {
      case DeviceType.JSENSE_BOARD: return 'JSense Board';
      case DeviceType.LED_CONTROLLER: return 'LED Controller';
      case DeviceType.SENSOR_HUB: return 'Sensor Hub';
      case DeviceType.AUDIO_REACTIVE: return 'Audio Reactive';
      case DeviceType.EFFECTS_CONTROLLER: return 'Effects Controller';
      default: return 'Unknown Device';
    }
  };

  const hasCapability = (capabilities: number, capability: DeviceCapability): boolean => {
    return (capabilities & capability) !== 0;
  };

  const getTimeSince = (timestamp: string): string => {
    const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
    if (seconds < 5) return 'Just now';
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const isPeerStale = (timestamp: string): boolean => {
    const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
    return seconds > 300; // 5 minutes
  };

  const isPeerOffline = (timestamp: string): boolean => {
    const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
    return seconds > 3600; // 1 hour
  };

  const getSignalStrength = (rssi: number): { label: string; color: string; badgeClass: string } => {
    if (rssi > -50) {
      return {
        label: 'Excellent',
        color: 'green',
        badgeClass: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
      };
    }
    if (rssi > -70) {
      return {
        label: 'Good',
        color: 'yellow',
        badgeClass: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200'
      };
    }
    return {
      label: 'Weak',
      color: 'red',
      badgeClass: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading JBoard network...</div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="text-red-600 dark:text-red-400 text-center px-4">
          <p className="font-semibold mb-2">Failed to Load Network Data</p>
          <p className="text-sm">{loadError}</p>
        </div>
        <button
          onClick={() => loadData()}
          className="px-4 py-2 rounded-lg bg-brand-600 text-white hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-semibold mb-2">JBoard Network</h1>
        <p className="text-gray-500">Manage peer-to-peer device connections</p>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-lg ${
          message.type === 'success'
            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
            : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* This Device */}
      {thisDevice && (
        <div className="mb-4 rounded-lg border border-gray-200 dark:border-gray-800 p-4 bg-white/60 dark:bg-gray-950/60">
          <h2 className="text-lg font-medium mb-3">This Device</h2>
          <div className="grid gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Name:</span>
              <span className="font-medium">{thisDevice.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Type:</span>
              <span className="font-medium">{getDeviceTypeName(thisDevice.type)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">MAC Address:</span>
              <span className="font-mono text-xs">{thisDevice.mac}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">IP Address:</span>
              <span className="font-mono text-xs">{thisDevice.ipAddress}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Firmware:</span>
              <span className="font-mono text-xs">{thisDevice.firmwareVersion}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Status:</span>
              <span className={thisDevice.isListening ? 'text-green-600 dark:text-green-400 flex items-center gap-1' : 'text-gray-600'}>
                {thisDevice.isListening ? (
                  <>
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                    Listening
                  </>
                ) : '○ Offline'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Broadcast Message */}
      {peers.length > 0 && (
        <div className="mb-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-white/60 dark:bg-gray-950/60 overflow-hidden">
          <button
            onClick={() => setShowBroadcast(!showBroadcast)}
            aria-label="Toggle broadcast section"
            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2a10 10 0 1 0 10 10H12V2z"/>
                <path d="M12 2v10l8.66 5"/>
              </svg>
              <h2 className="text-lg font-medium">Broadcast to All Devices</h2>
              <span className="text-xs px-2 py-1 rounded bg-brand-100 dark:bg-brand-900/30 text-brand-800 dark:text-brand-200">
                {peers.length} device{peers.length !== 1 ? 's' : ''}
              </span>
            </div>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={`transform transition-transform ${showBroadcast ? 'rotate-180' : ''}`}
            >
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </button>

          {showBroadcast && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-800 space-y-4">
              <p className="text-sm text-gray-500">
                Send a command or message to all paired devices simultaneously
              </p>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Command/Message Type
                </label>
                <input
                  type="text"
                  value={broadcastType}
                  onChange={(e) => setBroadcastType(e.target.value)}
                  placeholder="e.g., CHAT_MESSAGE, set_brightness, reboot"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Data (JSON)
                </label>
                <textarea
                  value={broadcastData}
                  onChange={(e) => setBroadcastData(e.target.value)}
                  placeholder='{"text": "Hello all devices"}'
                  rows={4}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-brand-600"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter command parameters or message data as JSON
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={confirmBroadcastAction}
                  disabled={broadcasting || !broadcastType.trim()}
                  className="flex-1 px-4 py-2 rounded-lg bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2 flex items-center justify-center gap-2"
                >
                  {broadcasting ? (
                    'Broadcasting...'
                  ) : (
                    <>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2a10 10 0 1 0 10 10H12V2z"/>
                        <path d="M12 2v10l8.66 5"/>
                      </svg>
                      Broadcast to All
                    </>
                  )}
                </button>
              </div>

              {/* Quick Broadcast Commands */}
              <div>
                <h3 className="text-sm font-medium mb-2">Quick Broadcasts</h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setBroadcastType('CHAT_MESSAGE');
                      setBroadcastData('{"text": "Hello from ' + (thisDevice?.name || 'JSense Board') + '!"}');
                    }}
                    className="text-xs px-3 py-1 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2"
                  >
                    Send Hello
                  </button>
                  <button
                    onClick={() => {
                      setBroadcastType('sync_time');
                      setBroadcastData('{"timestamp": ' + Date.now() + '}');
                    }}
                    className="text-xs px-3 py-1 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2"
                  >
                    Sync Time
                  </button>
                  <button
                    onClick={() => {
                      setBroadcastType('status_request');
                      setBroadcastData('{}');
                    }}
                    className="text-xs px-3 py-1 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2"
                  >
                    Request Status
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Scan Results Modal */}
      {showScanModal && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onKeyDown={(e) => {
            if (e.key === 'Escape') closeScanModal();
          }}
        >
          <div className="bg-white dark:bg-gray-900 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Scan Results</h2>
              <button
                onClick={closeScanModal}
                aria-label="Close scan results"
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1">
              {scanning ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mb-4"></div>
                  <p className="text-gray-500">Scanning for devices...</p>
                </div>
              ) : discoveredDevices.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <svg className="mx-auto h-12 w-12 mb-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"/>
                    <path d="m21 21-4.35-4.35"/>
                  </svg>
                  <p>No unpaired devices found</p>
                  <p className="text-sm mt-2">Make sure devices are in pairing mode</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-gray-500 mb-4">Found {discoveredDevices.length} device{discoveredDevices.length !== 1 ? 's' : ''}</p>
                  {discoveredDevices.map((device) => (
                    <div
                      key={device.mac}
                      className="p-4 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-medium">{device.name}</h3>
                            <span className="text-xs px-2 py-1 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200">
                              {getDeviceTypeName(device.type)}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400">
                            <div>MAC: <span className="font-mono">{device.mac}</span></div>
                            <div>IP: <span className="font-mono">{device.ipAddress || 'N/A'}</span></div>
                            <div>Firmware: <span className="font-mono">{device.firmwareVersion}</span></div>
                            <div>Signal: {device.rssi} dBm</div>
                            <div style={{ gridColumn: 'span 2' }}>
                              <span className={`text-xs px-2 py-0.5 rounded ${getSignalStrength(device.rssi).badgeClass}`}>
                                {getSignalStrength(device.rssi).label}
                              </span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => openPairingWizard(device)}
                          disabled={pairing !== null}
                          className="ml-4 px-4 py-2 text-sm rounded-lg bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2"
                        >
                          {pairing === device.mac ? 'Pairing...' : 'Pair'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-2">
              <button
                onClick={handleScan}
                disabled={scanning}
                className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2"
              >
                {scanning ? 'Scanning...' : 'Scan Again'}
              </button>
              <button
                onClick={closeScanModal}
                className="px-4 py-2 text-sm rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pairing Wizard Modal */}
      {showPairingWizard && selectedDevice && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onKeyDown={(e) => {
            if (e.key === 'Escape' && pairing === null) closePairingWizard();
            if (e.key === 'Enter' && pairing === null) handlePair();
          }}
        >
          <div className="bg-white dark:bg-gray-900 rounded-lg max-w-md w-full overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-xl font-semibold">Pair Device</h2>
              <p className="text-sm text-gray-500 mt-1">Customize the device name before pairing</p>
            </div>

            <div className="p-4 space-y-4">
              {/* Device Info */}
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-1 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200">
                    {getDeviceTypeName(selectedDevice.type)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400">
                  <div>MAC: <span className="font-mono">{selectedDevice.mac}</span></div>
                  <div>IP: <span className="font-mono">{selectedDevice.ipAddress || 'N/A'}</span></div>
                  <div>Firmware: <span className="font-mono">{selectedDevice.firmwareVersion}</span></div>
                  <div>Signal: {selectedDevice.rssi} dBm</div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <span className={`text-xs px-2 py-0.5 rounded ${getSignalStrength(selectedDevice.rssi).badgeClass}`}>
                      {getSignalStrength(selectedDevice.rssi).label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Name Input */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Device Name
                </label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Enter custom name"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-600"
                  maxLength={32}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && pairing === null) {
                      e.preventDefault();
                      handlePair();
                    }
                  }}
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-1">
                  {customName.length}/32 characters
                </p>
              </div>

              {/* Capabilities */}
              {selectedDevice.capabilities > 0 && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Capabilities
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {hasCapability(selectedDevice.capabilities, DeviceCapability.LED_CONTROL) && (
                      <span className="text-xs px-2 py-1 rounded bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200">
                        LED Control
                      </span>
                    )}
                    {hasCapability(selectedDevice.capabilities, DeviceCapability.SENSOR_DATA) && (
                      <span className="text-xs px-2 py-1 rounded bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">
                        Sensors
                      </span>
                    )}
                    {hasCapability(selectedDevice.capabilities, DeviceCapability.AUDIO_PLAYBACK) && (
                      <span className="text-xs px-2 py-1 rounded bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200">
                        Audio
                      </span>
                    )}
                    {hasCapability(selectedDevice.capabilities, DeviceCapability.WEB_INTERFACE) && (
                      <span className="text-xs px-2 py-1 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200">
                        Web Interface
                      </span>
                    )}
                    {hasCapability(selectedDevice.capabilities, DeviceCapability.BATTERY_POWERED) && (
                      <span className="text-xs px-2 py-1 rounded bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200">
                        Battery
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-2">
              <button
                onClick={closePairingWizard}
                disabled={pairing !== null}
                className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Cancel
              </button>
              <button
                onClick={handlePair}
                disabled={pairing !== null}
                className="px-4 py-2 text-sm rounded-lg bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2"
              >
                {pairing ? 'Pairing...' : 'Pair Device'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Peer Devices */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-4 bg-white/60 dark:bg-gray-950/60">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-medium">Connected Devices</h2>
            {refreshing && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand-600"></div>
                <span>Refreshing...</span>
              </div>
            )}
          </div>
          <button
            onClick={handleScan}
            disabled={scanning || refreshing}
            className="text-sm px-4 py-2 rounded-lg bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2"
          >
            {scanning ? 'Scanning...' : 'Scan for Devices'}
          </button>
        </div>

        {peers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No paired devices found. Click "Scan for Devices" to discover nearby JBoards.
          </div>
        ) : (
          <div className="space-y-3">
            {peers.map((peer) => {
              const isStale = isPeerStale(peer.lastSeen);
              const isOffline = isPeerOffline(peer.lastSeen);
              
              return (
                <div
                  key={peer.mac}
                  onClick={() => !isOffline && navigate(`/jboard-network/${peer.mac}`)}
                  className={`p-4 rounded-lg border transition-colors ${
                    isOffline ? 'cursor-not-allowed' : 'cursor-pointer'
                  } ${
                    isOffline
                      ? 'border-gray-400 dark:border-gray-600 bg-gray-100 dark:bg-gray-900/50 opacity-60'
                      : isStale
                      ? 'border-yellow-400 dark:border-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100 dark:hover:bg-yellow-900/30'
                      : 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium truncate max-w-[200px]" title={peer.name}>{peer.name}</h3>
                        <span className="text-xs text-gray-500">{getDeviceTypeName(peer.type)}</span>
                        {/* Fix #11: Visual status indicators */}
                        {isOffline && (
                          <span className="text-xs px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                            Offline
                          </span>
                        )}
                        {isStale && !isOffline && (
                          <span className="text-xs px-2 py-1 rounded bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200">
                            Stale
                          </span>
                        )}
                      </div>
                      <div className="grid gap-1 text-xs text-gray-600 dark:text-gray-400">
                        <div>MAC: <span className="font-mono">{peer.mac}</span></div>
                        <div>IP: <span className="font-mono">{peer.ipAddress || 'N/A'}</span></div>
                        <div>Firmware: <span className="font-mono">{peer.firmwareVersion}</span></div>
                        <div>Signal: {peer.rssi} dBm</div>
                        <div className={isOffline ? 'text-red-600 dark:text-red-400' : isStale ? 'text-yellow-600 dark:text-yellow-400' : ''}>
                          Last Seen: {getTimeSince(peer.lastSeen)}
                        </div>
                        {hasCapability(peer.capabilities, DeviceCapability.BATTERY_POWERED) && (
                          <div>Power: Battery</div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUnpair(peer.mac);
                        }}
                        aria-label={`Unpair ${peer.name}`}
                        className="px-3 py-1 text-xs rounded-lg bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2"
                      >
                        Unpair
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Unpair Confirmation Dialog */}
      {confirmUnpair && (
        <ConfirmDialog
          title="Unpair Device"
          message="Unpair this device?"
          onConfirm={() => {
            performUnpair(confirmUnpair);
            setConfirmUnpair(null);
          }}
          onCancel={() => setConfirmUnpair(null)}
          dangerous={true}
        />
      )}

      {/* Broadcast Confirmation Dialog */}
      {confirmBroadcast && (
        <ConfirmDialog
          title="Confirm Broadcast"
          message={`Send "${broadcastType}" to all ${peers.length} connected device${peers.length !== 1 ? 's' : ''}? This action cannot be undone.`}
          onConfirm={() => {
            setConfirmBroadcast(false);
            handleBroadcast();
          }}
          onCancel={() => setConfirmBroadcast(false)}
          dangerous={true}
        />
      )}
    </div>
  );
}

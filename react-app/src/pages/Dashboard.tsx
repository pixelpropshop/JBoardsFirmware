import { useState, useEffect } from 'react';
import { networkService } from '../services/networkService';
import type { NetworkStatus } from '../types/network';
import ConnectionStatus from '../components/ConnectionStatus';
import SignalStrength from '../components/SignalStrength';

export default function Dashboard() {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Stub data for system information (to be replaced with real API)
  const systemInfo = {
    hostname: 'jsense-board',
    version: 'v1.0.0',
    uptime: '3600 s',
    heapFree: '128 KiB',
  };

  // Stub data for LED channels (to be replaced with real API)
  const ledChannels = [
    { id: 1, name: 'CH1', pixels: 300, fps: 60, status: 'Active' },
    { id: 2, name: 'CH2', pixels: 150, fps: 60, status: 'Idle' },
    { id: 3, name: 'CH3', pixels: 200, fps: 30, status: 'Idle' },
  ];

  // Load network status
  const loadNetworkStatus = async () => {
    try {
      const status = await networkService.getNetworkStatus();
      setNetworkStatus(status);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to load network status:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadNetworkStatus();
  }, []);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadNetworkStatus();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {/* Network Status Card */}
      <div className="col-span-1 rounded-lg border border-gray-200 dark:border-gray-800 p-4 bg-white/60 dark:bg-gray-950/60">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium">Network Status</h2>
          <button 
            onClick={loadNetworkStatus}
            disabled={loading}
            className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-900 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
        
        {networkStatus ? (
          <div className="space-y-3">
            {/* WiFi Station Status */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-500">WiFi Station</span>
                <ConnectionStatus connected={networkStatus.wifiConnected} size="sm" />
              </div>
              {networkStatus.wifiConnected && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">IP Address</span>
                    <span className="font-mono">{networkStatus.wifiIP}</span>
                  </div>
                  <div>
                    <SignalStrength rssi={networkStatus.wifiRSSI} size="sm" />
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 dark:border-gray-800 pt-3">
              {/* Access Point Status */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-500">Access Point</span>
                  <ConnectionStatus connected={networkStatus.apActive} size="sm" />
                </div>
                {networkStatus.apActive && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Connected Clients</span>
                    <span className="font-semibold">{networkStatus.apClients}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="text-xs text-gray-500 text-right">
              Updated: {lastUpdate.toLocaleTimeString()}
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-500">Loading network status...</div>
        )}
      </div>

      {/* System Info Card */}
      <div className="col-span-1 rounded-lg border border-gray-200 dark:border-gray-800 p-4 bg-white/60 dark:bg-gray-950/60">
        <h2 className="text-sm font-medium mb-3">System Information</h2>
        <dl className="grid grid-cols-2 gap-2 text-sm">
          <dt className="text-gray-500">Hostname</dt>
          <dd>{systemInfo.hostname}</dd>
          
          <dt className="text-gray-500">Version</dt>
          <dd>{systemInfo.version}</dd>
          
          <dt className="text-gray-500">Uptime</dt>
          <dd>{systemInfo.uptime}</dd>
          
          <dt className="text-gray-500">Heap Free</dt>
          <dd>{systemInfo.heapFree}</dd>
        </dl>
      </div>

      {/* LED Channels Card */}
      <div className="col-span-1 rounded-lg border border-gray-200 dark:border-gray-800 p-4 bg-white/60 dark:bg-gray-950/60">
        <h2 className="text-sm font-medium mb-2">LED Channels</h2>
        <div className="space-y-2 text-sm">
          {ledChannels.map((channel) => (
            <div key={channel.id} className="flex items-center justify-between">
              <div>
                {channel.name} • {channel.pixels} px @ {channel.fps} FPS
              </div>
              <div className="text-gray-500">{channel.status}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Now Playing Card */}
      <div className="col-span-1 rounded-lg border border-gray-200 dark:border-gray-800 p-4 bg-white/60 dark:bg-gray-950/60">
        <h2 className="text-sm font-medium mb-2">Now Playing</h2>
        <div className="text-sm text-gray-500">
          Effects/Sequences status will appear here.
        </div>
      </div>
    </div>
  )
}

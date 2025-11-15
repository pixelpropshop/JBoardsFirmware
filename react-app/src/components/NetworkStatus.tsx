import { useState, useEffect } from 'react';
import { networkService } from '../services/networkService';
import type { NetworkStatus } from '../types/network';

export default function NetworkStatus() {
  const [status, setStatus] = useState<NetworkStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatus();
    
    // Refresh status every 10 seconds
    const interval = setInterval(loadStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadStatus = async () => {
    try {
      const data = await networkService.getNetworkStatus();
      setStatus(data);
    } catch (error) {
      console.error('Failed to load network status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !status) {
    return null;
  }

  const getSignalIcon = (rssi: number) => {
    if (rssi > -50) return '📶'; // Excellent
    if (rssi > -70) return '📶'; // Good
    if (rssi > -80) return '📶'; // Fair
    return '📶'; // Weak
  };

  const getSignalColor = (rssi: number) => {
    if (rssi > -50) return 'text-green-600 dark:text-green-400';
    if (rssi > -70) return 'text-blue-600 dark:text-blue-400';
    if (rssi > -80) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded border border-gray-200 dark:border-gray-800 text-sm">
      {status.wifiConnected ? (
        <>
          <span className={getSignalColor(status.wifiRSSI)} title={`Signal: ${status.wifiRSSI} dBm`}>
            {getSignalIcon(status.wifiRSSI)}
          </span>
          <span className="text-gray-600 dark:text-gray-400">WiFi</span>
          <span className="font-mono text-xs">{status.wifiIP}</span>
        </>
      ) : status.apActive ? (
        <>
          <span className="text-orange-600 dark:text-orange-400">📡</span>
          <span className="text-gray-600 dark:text-gray-400">AP Mode</span>
          <span className="font-mono text-xs">192.168.4.1</span>
          {status.apClients > 0 && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200">
              {status.apClients} {status.apClients === 1 ? 'client' : 'clients'}
            </span>
          )}
        </>
      ) : (
        <>
          <span className="text-red-600 dark:text-red-400">⚠️</span>
          <span className="text-gray-600 dark:text-gray-400">Disconnected</span>
        </>
      )}
    </div>
  );
}

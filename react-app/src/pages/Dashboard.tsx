import { useState, useEffect } from 'react';
import { networkService } from '../services/networkService';
import { systemService } from '../services/systemService';
import type { NetworkStatus } from '../types/network';
import type { SystemStats } from '../types/system';
import ConnectionStatus from '../components/ConnectionStatus';
import SignalStrength from '../components/SignalStrength';

export default function Dashboard() {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus | null>(null);
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Load all dashboard data
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [network, system] = await Promise.all([
        networkService.getNetworkStatus(),
        systemService.getSystemStats(),
      ]);
      setNetworkStatus(network);
      setSystemStats(system);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadDashboardData();
  }, []);

  // Auto-refresh every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadDashboardData();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Helper to get status badge
  const getStatusBadge = (status: 'active' | 'idle' | 'error'): JSX.Element => {
    const colors = {
      active: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200',
      idle: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
      error: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200',
    };

    return (
      <span className={`px-2 py-0.5 text-xs rounded ${colors[status]}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {/* Network Status Card */}
      <div className="col-span-1 rounded-lg border border-gray-200 dark:border-gray-800 p-4 bg-white/60 dark:bg-gray-950/60">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium">Network Status</h2>
          <button 
            onClick={loadDashboardData}
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

      {/* System Health Card */}
      <div className="col-span-1 rounded-lg border border-gray-200 dark:border-gray-800 p-4 bg-white/60 dark:bg-gray-950/60">
        <h2 className="text-sm font-medium mb-3">System Health</h2>
        {systemStats ? (
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1 text-sm">
                <span className="text-gray-500">Uptime</span>
                <span className="font-medium">
                  {systemService.formatUptime(systemStats.health.uptimeSeconds)}
                </span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1 text-sm">
                <span className="text-gray-500">Heap Memory (SRAM)</span>
                <span className="font-medium">
                  {systemService.formatBytes(systemStats.health.heapUsed)} / {systemService.formatBytes(systemStats.health.heapTotal)}
                </span>
              </div>
              <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    (systemStats.health.heapUsed / systemStats.health.heapTotal) > 0.8
                      ? 'bg-red-600'
                      : (systemStats.health.heapUsed / systemStats.health.heapTotal) > 0.6
                      ? 'bg-yellow-600'
                      : 'bg-green-600'
                  }`}
                  style={{
                    width: `${(systemStats.health.heapUsed / systemStats.health.heapTotal) * 100}%`,
                  }}
                />
              </div>
            </div>

            {systemStats.health.psramTotal && systemStats.health.psramTotal > 0 && (
              <div>
                <div className="flex items-center justify-between mb-1 text-sm">
                  <span className="text-gray-500">PSRAM</span>
                  <span className="font-medium">
                    {systemService.formatBytes(systemStats.health.psramUsed || 0)} / {systemService.formatBytes(systemStats.health.psramTotal)}
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      ((systemStats.health.psramUsed || 0) / systemStats.health.psramTotal) > 0.8
                        ? 'bg-red-600'
                        : ((systemStats.health.psramUsed || 0) / systemStats.health.psramTotal) > 0.6
                        ? 'bg-yellow-600'
                        : 'bg-green-600'
                    }`}
                    style={{
                      width: `${((systemStats.health.psramUsed || 0) / systemStats.health.psramTotal) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {systemStats.health.cpuTemperature && (
              <div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">CPU Temperature</span>
                  <span className="font-medium">{systemStats.health.cpuTemperature.toFixed(1)}°C</span>
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Firmware</span>
                <span>{systemStats.info.firmwareVersion}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-500">Loading system health...</div>
        )}
      </div>

      {/* LED Channels Card */}
      <div className="col-span-1 rounded-lg border border-gray-200 dark:border-gray-800 p-4 bg-white/60 dark:bg-gray-950/60 flex flex-col">
        <h2 className="text-sm font-medium mb-3">LED Channels</h2>
        {systemStats ? (
          <div className="space-y-2.5 overflow-y-auto max-h-[400px] pr-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-100 dark:[&::-webkit-scrollbar-track]:bg-gray-800 [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-gray-600 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-gray-400 dark:[&::-webkit-scrollbar-thumb]:hover:bg-gray-500">
            {systemStats.ledChannels.map((channel) => (
              <div key={channel.id}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{channel.name}</span>
                    {getStatusBadge(channel.status)}
                  </div>
                  {!channel.enabled && (
                    <span className="text-xs text-gray-500">Disabled</span>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  {channel.pixelCount} px • {channel.pixelType} • {channel.fps} FPS
                </div>
                {channel.currentEffect && (
                  <div className="text-xs text-brand-600 dark:text-brand-400 mt-0.5">
                    {channel.currentEffect}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-gray-500">Loading channels...</div>
        )}
      </div>

      {/* Now Playing Card */}
      <div className="col-span-1 rounded-lg border border-gray-200 dark:border-gray-800 p-4 bg-white/60 dark:bg-gray-950/60">
        <h2 className="text-sm font-medium mb-3">Now Playing</h2>
        {systemStats ? (
          systemStats.nowPlaying.type === 'idle' ? (
            <div className="text-sm text-gray-500">Nothing playing</div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">
                  {systemStats.nowPlaying.type === 'effect' ? '✨' : '🎄'}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{systemStats.nowPlaying.name}</div>
                  <div className="text-xs text-gray-500 capitalize">{systemStats.nowPlaying.type}</div>
                </div>
              </div>

              {systemStats.nowPlaying.duration && systemStats.nowPlaying.elapsed !== undefined && (
                <div>
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>{Math.floor(systemStats.nowPlaying.elapsed / 60)}:{(systemStats.nowPlaying.elapsed % 60).toString().padStart(2, '0')}</span>
                    <span>{Math.floor(systemStats.nowPlaying.duration / 60)}:{(systemStats.nowPlaying.duration % 60).toString().padStart(2, '0')}</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-600 transition-all duration-300"
                      style={{
                        width: `${(systemStats.nowPlaying.elapsed / systemStats.nowPlaying.duration) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {systemStats.nowPlaying.loop && (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Loop enabled</span>
                </div>
              )}

              {systemStats.nowPlaying.channels && systemStats.nowPlaying.channels.length > 0 && (
                <div className="text-xs text-gray-500">
                  Channels: {systemStats.nowPlaying.channels.join(', ')}
                </div>
              )}
            </div>
          )
        ) : (
          <div className="text-sm text-gray-500">Loading...</div>
        )}
      </div>
    </div>
  )
}

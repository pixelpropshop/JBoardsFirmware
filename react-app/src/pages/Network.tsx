import { useState, useEffect } from 'react';
import { networkService } from '../services/networkService';
import type { WiFiConfig, APConfig, NetworkStatus, HostnameConfig, WiFiProfile, AutoReconnectConfig, ScanResult } from '../types/network';
import { validateWiFiConfig, validateAPConfig, validateHostnameConfig, validateWiFiProfile, validateAutoReconnectConfig } from '../utils/validation';
import Toggle from '../components/Toggle';
import ConnectionStatus from '../components/ConnectionStatus';
import SignalStrength from '../components/SignalStrength';

export default function Network() {
  // Loading states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<'wifi' | 'ap' | null>(null);
  const [scanning, setScanning] = useState(false);
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus | null>(null);

  // Configuration state
  const [wifiConfig, setWifiConfig] = useState<WiFiConfig>({
    ssid: '',
    password: '',
    ip: '',
    gateway: '',
    subnet: '',
    dns: '',
    dhcp: true,
  });

  const [apConfig, setAPConfig] = useState<APConfig>({
    ssid: '',
    password: '',
    ip: '',
    channel: 0, // 0 = auto
    hidden: false,
    maxClients: 0, // 0 = hardware default
    keepActive: false, // Smart mode: auto-disable when WiFi connects
  });

  const [hostnameConfig, setHostnameConfig] = useState<HostnameConfig>({
    hostname: '',
    mdnsEnabled: true,
  });

  const [wifiProfiles, setWiFiProfiles] = useState<WiFiProfile[]>([]);
  const [editingProfile, setEditingProfile] = useState<Partial<WiFiProfile> | null>(null);
  const [showProfileForm, setShowProfileForm] = useState(false);

  const [autoReconnectConfig, setAutoReconnectConfig] = useState<AutoReconnectConfig>({
    enabled: true,
    maxAttempts: 5,
    attemptInterval: 30,
    fallbackToAP: true,
  });

  // UI state
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showWiFiConfirm, setShowWiFiConfirm] = useState(false);
  const [showAPConfirm, setShowAPConfirm] = useState(false);
  const [showAPAdvanced, setShowAPAdvanced] = useState(false);
  const [showHostnameSection, setShowHostnameSection] = useState(false);
  const [showProfilesSection, setShowProfilesSection] = useState(false);
  const [availableNetworks, setAvailableNetworks] = useState<ScanResult[]>([]);
  const [showNetworkList, setShowNetworkList] = useState(false);
  const [resettingPortal, setResettingPortal] = useState(false);

  // Load initial configuration
  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    setLoading(true);
    try {
      const [wifi, ap, status, hostname, profiles, autoReconnect] = await Promise.all([
        networkService.getWiFiConfig(),
        networkService.getAPConfig(),
        networkService.getNetworkStatus(),
        networkService.getHostnameConfig(),
        networkService.getWiFiProfiles(),
        networkService.getAutoReconnectConfig(),
      ]);
      setWifiConfig(wifi);
      setAPConfig(ap);
      setNetworkStatus(status);
      setHostnameConfig(hostname);
      setWiFiProfiles(profiles);
      setAutoReconnectConfig(autoReconnect);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load network configuration' });
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh network status every 10 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const status = await networkService.getNetworkStatus();
        setNetworkStatus(status);
      } catch (error) {
        console.error('Failed to refresh network status:', error);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const handleScanNetworks = async () => {
    setScanning(true);
    try {
      const networks = await networkService.scanNetworks();
      setAvailableNetworks(networks);
      setShowNetworkList(true);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to scan networks' });
    } finally {
      setScanning(false);
    }
  };

  const selectNetwork = (ssid: string) => {
    setWifiConfig({ ...wifiConfig, ssid });
    setShowNetworkList(false);
  };

  const handleValidateAndShowWiFiConfirm = () => {
    setMessage(null);
    const validation = validateWiFiConfig(wifiConfig);
    
    if (!validation.valid) {
      setMessage({ 
        type: 'error', 
        text: validation.errors.join(', ') 
      });
      return;
    }
    
    setShowWiFiConfirm(true);
  };

  const handleSaveWiFi = async () => {
    setShowWiFiConfirm(false);
    setSaving('wifi');
    setMessage(null);

    try {
      const result = await networkService.updateWiFiConfig(wifiConfig);
      if (result.success) {
        setMessage({ 
          type: 'success', 
          text: result.message || 'WiFi configuration saved. Device will reconnect...' 
        });
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to save WiFi configuration' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save WiFi configuration' });
    } finally {
      setSaving(null);
    }
  };

  const handleSaveAP = async () => {
    setShowAPConfirm(false);
    setSaving('ap');
    setMessage(null);

    try {
      const result = await networkService.updateAPConfig(apConfig);
      if (result.success) {
        setMessage({ 
          type: 'success', 
          text: result.message || 'Access Point configuration saved successfully' 
        });
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to save AP configuration' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save AP configuration' });
    } finally {
      setSaving(null);
    }
  };

  const handleValidateAndShowAPConfirm = () => {
    setMessage(null);
    const validation = validateAPConfig(apConfig);
    
    if (!validation.valid) {
      setMessage({ 
        type: 'error', 
        text: validation.errors.join(', ') 
      });
      return;
    }
    
    setShowAPConfirm(true);
  };

  // Hostname handlers
  const handleSaveHostname = async () => {
    setMessage(null);
    const validation = validateHostnameConfig(hostnameConfig);
    
    if (!validation.valid) {
      setMessage({ type: 'error', text: validation.errors.join(', ') });
      return;
    }

    try {
      const result = await networkService.updateHostnameConfig(hostnameConfig);
      if (result.success) {
        setMessage({ type: 'success', text: result.message || 'Hostname configuration saved successfully' });
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to save hostname configuration' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save hostname configuration' });
    }
  };

  // WiFi Profile handlers
  const handleNewProfile = () => {
    setEditingProfile({
      name: '',
      ssid: '',
      password: '',
      ip: '',
      gateway: '',
      subnet: '',
      dns: '8.8.8.8',
      dhcp: true,
      priority: wifiProfiles.length + 1,
    });
    setShowProfileForm(true);
  };

  const handleEditProfile = (profile: WiFiProfile) => {
    setEditingProfile(profile);
    setShowProfileForm(true);
  };

  const handleSaveProfile = async () => {
    if (!editingProfile) return;

    setMessage(null);
    const validation = validateWiFiProfile(editingProfile as any);
    
    if (!validation.valid) {
      setMessage({ type: 'error', text: validation.errors.join(', ') });
      return;
    }

    try {
      const profileData = {
        name: editingProfile.name!,
        ssid: editingProfile.ssid!,
        password: editingProfile.password!,
        ip: editingProfile.ip!,
        gateway: editingProfile.gateway!,
        subnet: editingProfile.subnet!,
        dns: editingProfile.dns!,
        dhcp: editingProfile.dhcp!,
        priority: editingProfile.priority!,
      };

      const result = await networkService.saveWiFiProfile(profileData);
      if (result.success) {
        setMessage({ type: 'success', text: result.message || 'WiFi profile saved successfully' });
        setShowProfileForm(false);
        setEditingProfile(null);
        // Reload profiles
        const profiles = await networkService.getWiFiProfiles();
        setWiFiProfiles(profiles);
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to save WiFi profile' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save WiFi profile' });
    }
  };

  const handleDeleteProfile = async (id: string) => {
    if (!confirm('Are you sure you want to delete this WiFi profile?')) return;

    try {
      const result = await networkService.deleteWiFiProfile(id);
      if (result.success) {
        setMessage({ type: 'success', text: result.message || 'WiFi profile deleted successfully' });
        // Reload profiles
        const profiles = await networkService.getWiFiProfiles();
        setWiFiProfiles(profiles);
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to delete WiFi profile' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete WiFi profile' });
    }
  };

  const handleConnectToProfile = async (id: string) => {
    try {
      const result = await networkService.connectToProfile(id);
      if (result.success) {
        setMessage({ type: 'success', text: result.message || 'Connecting to WiFi profile...' });
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to connect to WiFi profile' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to connect to WiFi profile' });
    }
  };

  const handleMovePriority = async (id: string, direction: 'up' | 'down') => {
    const profile = wifiProfiles.find(p => p.id === id);
    if (!profile) return;

    const newPriority = direction === 'up' ? profile.priority - 1 : profile.priority + 1;
    if (newPriority < 1 || newPriority > wifiProfiles.length) return;

    try {
      const result = await networkService.updateProfilePriority(id, newPriority);
      if (result.success) {
        // Reload profiles to get updated order
        const profiles = await networkService.getWiFiProfiles();
        setWiFiProfiles(profiles);
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to update profile priority' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update profile priority' });
    }
  };

  // Auto-reconnect handlers
  const handleSaveAutoReconnect = async () => {
    setMessage(null);
    const validation = validateAutoReconnectConfig(autoReconnectConfig);
    
    if (!validation.valid) {
      setMessage({ type: 'error', text: validation.errors.join(', ') });
      return;
    }

    try {
      const result = await networkService.updateAutoReconnectConfig(autoReconnectConfig);
      if (result.success) {
        setMessage({ type: 'success', text: result.message || 'Auto-reconnect settings saved successfully' });
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to save auto-reconnect settings' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save auto-reconnect settings' });
    }
  };

  // Captive Portal handlers
  const handleResetCaptivePortal = async () => {
    if (!confirm('Are you sure you want to reset the captive portal? It will show again on the next connection to the Access Point.')) {
      return;
    }

    setResettingPortal(true);
    setMessage(null);

    try {
      const result = await networkService.resetCaptivePortal();
      if (result.success) {
        setMessage({ type: 'success', text: result.message || 'Captive portal reset successfully. It will show on next AP connection.' });
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to reset captive portal' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to reset captive portal' });
    } finally {
      setResettingPortal(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading network configuration...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-semibold mb-2">Network</h1>
        <p className="text-gray-500">Configure network settings</p>
      </div>

      {/* Live Network Status */}
      {networkStatus && (
        <div className="mb-4 rounded-lg border border-gray-200 dark:border-gray-800 p-4 bg-white/60 dark:bg-gray-950/60">
          <h2 className="text-sm font-medium mb-3">Current Status</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {/* WiFi Status */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-500">WiFi Connection</span>
                <ConnectionStatus connected={networkStatus.wifiConnected} size="sm" />
              </div>
              {networkStatus.wifiConnected && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">IP Address</span>
                    <span className="font-mono">{networkStatus.wifiIP}</span>
                  </div>
                  <SignalStrength rssi={networkStatus.wifiRSSI} size="sm" />
                </div>
              )}
            </div>
            
            {/* AP Status */}
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
        </div>
      )}

      {/* Status message */}
      {message && (
        <div className={`mb-4 p-3 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' 
            : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
        }`}>
          {message.text}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {/* WiFi Station Settings */}
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-4 bg-white/60 dark:bg-gray-950/60">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium">WiFi Station</h2>
            <button
              onClick={handleScanNetworks}
              disabled={scanning}
              className="text-xs px-3 py-1 rounded bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              {scanning ? 'Scanning...' : 'Scan'}
            </button>
          </div>

          {/* Network scan results */}
          {showNetworkList && availableNetworks.length > 0 && (
            <div className="mb-4 p-2 rounded border border-gray-300 dark:border-gray-700 max-h-40 overflow-y-auto">
              <div className="text-xs font-medium mb-2 text-gray-500">Available Networks:</div>
              {availableNetworks.map((network, idx) => (
                <button
                  key={idx}
                  onClick={() => selectNetwork(network.ssid)}
                  className="w-full text-left px-2 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 rounded flex items-center justify-between"
                >
                  <span>{network.ssid}</span>
                  <span className="text-xs text-gray-500">
                    {network.rssi} dBm {network.encryption !== 'Open' && '🔒'}
                  </span>
                </button>
              ))}
            </div>
          )}
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">SSID</label>
              <input 
                type="text" 
                value={wifiConfig.ssid}
                onChange={(e) => setWifiConfig({ ...wifiConfig, ssid: e.target.value })}
                className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900" 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <input 
                type="password" 
                value={wifiConfig.password}
                onChange={(e) => setWifiConfig({ ...wifiConfig, password: e.target.value })}
                placeholder="Leave empty to keep current"
                className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900" 
              />
            </div>

            <Toggle
              id="dhcp"
              checked={wifiConfig.dhcp}
              onChange={(checked) => setWifiConfig({ ...wifiConfig, dhcp: checked })}
              label="Use DHCP"
            />
            
            {!wifiConfig.dhcp && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">IP Address</label>
                  <input 
                    type="text" 
                    value={wifiConfig.ip}
                    onChange={(e) => setWifiConfig({ ...wifiConfig, ip: e.target.value })}
                    placeholder="192.168.1.100"
                    className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900" 
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Gateway</label>
                  <input 
                    type="text" 
                    value={wifiConfig.gateway}
                    onChange={(e) => setWifiConfig({ ...wifiConfig, gateway: e.target.value })}
                    placeholder="192.168.1.1"
                    className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900" 
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Subnet Mask</label>
                  <input 
                    type="text" 
                    value={wifiConfig.subnet}
                    onChange={(e) => setWifiConfig({ ...wifiConfig, subnet: e.target.value })}
                    placeholder="255.255.255.0"
                    className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900" 
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">DNS Server</label>
                  <input 
                    type="text" 
                    value={wifiConfig.dns}
                    onChange={(e) => setWifiConfig({ ...wifiConfig, dns: e.target.value })}
                    placeholder="8.8.8.8"
                    className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900" 
                  />
                </div>
              </>
            )}
            
            <button 
              onClick={handleValidateAndShowWiFiConfirm}
              disabled={saving === 'wifi'}
              className="w-full px-4 py-2 rounded bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {saving === 'wifi' ? 'Saving...' : 'Save WiFi Settings'}
            </button>
          </div>
        </div>

        {/* Access Point Settings */}
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-4 bg-white/60 dark:bg-gray-950/60">
          <h2 className="text-lg font-medium mb-4">Access Point</h2>
          
          <div className="space-y-3">
            <div className="pb-2 border-b border-gray-200 dark:border-gray-800">
              <Toggle
                id="apAdvanced"
                checked={showAPAdvanced}
                onChange={(checked) => setShowAPAdvanced(checked)}
                label="Advanced Settings"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">SSID</label>
              <input 
                type="text" 
                value={apConfig.ssid}
                onChange={(e) => setAPConfig({ ...apConfig, ssid: e.target.value })}
                className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900" 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <input 
                type="password" 
                value={apConfig.password}
                onChange={(e) => setAPConfig({ ...apConfig, password: e.target.value })}
                placeholder="Leave empty to keep current"
                className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900" 
              />
              <p className="text-xs text-gray-500 mt-1">Minimum 8 characters</p>
            </div>

            {showAPAdvanced && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">Channel</label>
                  <select
                    value={apConfig.channel}
                    onChange={(e) => setAPConfig({ ...apConfig, channel: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                  >
                    <option value={0}>Auto</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map(ch => (
                      <option key={ch} value={ch}>Channel {ch}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Auto recommended</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Max Clients</label>
                  <select
                    value={apConfig.maxClients}
                    onChange={(e) => setAPConfig({ ...apConfig, maxClients: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                  >
                    <option value={0}>Hardware Default (4)</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                      <option key={num} value={num}>{num} Client{num > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-800 pt-3 mt-3">
                  <Toggle
                    id="keepActive"
                    checked={apConfig.keepActive}
                    onChange={(checked) => setAPConfig({ ...apConfig, keepActive: checked })}
                    label="Keep AP Active when WiFi Connected"
                  />
                  <p className="text-xs text-gray-500 mt-1.5 ml-1">
                    When disabled, AP automatically turns off after WiFi connects (recommended for power saving)
                  </p>
                </div>
              </>
            )}
            
            <Toggle
              id="hidden"
              checked={apConfig.hidden}
              onChange={(checked) => setAPConfig({ ...apConfig, hidden: checked })}
              label="Hidden Network"
            />
            
            <button 
              onClick={handleValidateAndShowAPConfirm}
              disabled={saving === 'ap'}
              className="w-full px-4 py-2 rounded bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {saving === 'ap' ? 'Saving...' : 'Save AP Settings'}
            </button>
          </div>
        </div>
      </div>

      {/* Additional Network Settings */}
      <div className="grid gap-4 md:grid-cols-3 mt-4">
        {/* Hostname Configuration Card */}
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-4 bg-white/60 dark:bg-gray-950/60">
          <h2 className="text-lg font-medium mb-4">mDNS / Hostname</h2>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Hostname</label>
              <input
                type="text"
                value={hostnameConfig.hostname}
                onChange={(e) => setHostnameConfig({ ...hostnameConfig, hostname: e.target.value })}
                placeholder="jsenseboard"
                className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
              />
              <p className="text-xs text-gray-500 mt-1">
                Will be accessible as <strong>{hostnameConfig.hostname || 'hostname'}.local</strong>
              </p>
            </div>

            <Toggle
              id="mdnsEnabled"
              checked={hostnameConfig.mdnsEnabled}
              onChange={(checked) => setHostnameConfig({ ...hostnameConfig, mdnsEnabled: checked })}
              label="Enable mDNS"
            />

            <button
              onClick={handleSaveHostname}
              className="w-full px-4 py-2 rounded bg-brand-600 text-white hover:bg-brand-700"
            >
              Save Hostname Settings
            </button>
          </div>
        </div>

        {/* WiFi Profile Management Card */}
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-4 bg-white/60 dark:bg-gray-950/60">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium">WiFi Profiles</h2>
            <button
              onClick={handleNewProfile}
              className="text-xs px-3 py-1 rounded bg-brand-600 text-white hover:bg-brand-700"
            >
              + Add
            </button>
          </div>

          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {wifiProfiles.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                No WiFi profiles saved yet
              </div>
            ) : (
              wifiProfiles.sort((a, b) => a.priority - b.priority).map((profile, index) => (
                <div
                  key={profile.id}
                  className="p-2 rounded border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-medium text-gray-500">#{profile.priority}</span>
                        <h3 className="text-sm font-medium truncate">{profile.name}</h3>
                      </div>
                      <p className="text-xs text-gray-500 truncate">SSID: {profile.ssid}</p>
                    </div>
                    
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={() => handleMovePriority(profile.id, 'up')}
                        disabled={index === 0}
                        className="px-1.5 py-0.5 text-xs rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-30"
                        title="Move up"
                      >
                        ▲
                      </button>
                      <button
                        onClick={() => handleMovePriority(profile.id, 'down')}
                        disabled={index === wifiProfiles.length - 1}
                        className="px-1.5 py-0.5 text-xs rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-30"
                        title="Move down"
                      >
                        ▼
                      </button>
                      <button
                        onClick={() => handleConnectToProfile(profile.id)}
                        className="px-2 py-0.5 text-xs rounded bg-blue-600 text-white hover:bg-blue-700"
                      >
                        Connect
                      </button>
                      <button
                        onClick={() => handleEditProfile(profile)}
                        className="px-2 py-0.5 text-xs rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteProfile(profile.id)}
                        className="px-2 py-0.5 text-xs rounded bg-red-600 text-white hover:bg-red-700"
                      >
                        Del
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Auto-Reconnect Settings Card */}
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-4 bg-white/60 dark:bg-gray-950/60">
          <h2 className="text-lg font-medium mb-4">Auto-Reconnect</h2>
          
          <div className="space-y-3">
            <Toggle
              id="autoReconnectEnabled"
              checked={autoReconnectConfig.enabled}
              onChange={(checked) => setAutoReconnectConfig({ ...autoReconnectConfig, enabled: checked })}
              label="Enable Auto-Reconnect"
            />

            {autoReconnectConfig.enabled && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">Max Attempts</label>
                  <select
                    value={autoReconnectConfig.maxAttempts}
                    onChange={(e) => setAutoReconnectConfig({ ...autoReconnectConfig, maxAttempts: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                  >
                    <option value={0}>Unlimited</option>
                    {[3, 5, 10, 15, 20, 30, 50, 100].map(num => (
                      <option key={num} value={num}>{num} attempts</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {autoReconnectConfig.maxAttempts === 0 ? 'Will retry indefinitely' : `Stop after ${autoReconnectConfig.maxAttempts} failed attempts`}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Retry Interval</label>
                  <select
                    value={autoReconnectConfig.attemptInterval}
                    onChange={(e) => setAutoReconnectConfig({ ...autoReconnectConfig, attemptInterval: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                  >
                    {[5, 10, 15, 30, 60, 120, 180, 300].map(sec => (
                      <option key={sec} value={sec}>
                        {sec < 60 ? `${sec} seconds` : `${sec / 60} minute${sec / 60 > 1 ? 's' : ''}`}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Wait time between reconnection attempts
                  </p>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-800 pt-3 mt-3">
                  <Toggle
                    id="fallbackToAP"
                    checked={autoReconnectConfig.fallbackToAP}
                    onChange={(checked) => setAutoReconnectConfig({ ...autoReconnectConfig, fallbackToAP: checked })}
                    label="Fallback to AP Mode"
                  />
                  <p className="text-xs text-gray-500 mt-1.5 ml-1">
                    Enable Access Point after max attempts reached
                  </p>
                </div>
              </>
            )}

            <button
              onClick={handleSaveAutoReconnect}
              className="w-full px-4 py-2 rounded bg-brand-600 text-white hover:bg-brand-700"
            >
              Save Reconnect Settings
            </button>
          </div>
        </div>
      </div>

      {/* Captive Portal Reset Section */}
      <div className="mt-4 rounded-lg border border-gray-200 dark:border-gray-800 p-4 bg-white/60 dark:bg-gray-950/60">
        <h2 className="text-lg font-medium mb-2">Captive Portal</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Reset the initial setup wizard to show again when connecting to the Access Point.
        </p>
        <button
          onClick={handleResetCaptivePortal}
          disabled={resettingPortal}
          className="px-4 py-2 rounded bg-gray-600 text-white hover:bg-gray-700 disabled:opacity-50"
        >
          {resettingPortal ? 'Resetting...' : 'Reset Captive Portal'}
        </button>
      </div>

      {/* WiFi Profile Form Dialog */}
      {showProfileForm && editingProfile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-md w-full my-8">
            <h3 className="text-lg font-semibold mb-4">
              {editingProfile.id ? 'Edit' : 'Add'} WiFi Profile
            </h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Profile Name</label>
                <input
                  type="text"
                  value={editingProfile.name || ''}
                  onChange={(e) => setEditingProfile({ ...editingProfile, name: e.target.value })}
                  placeholder="Home Network"
                  className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">SSID</label>
                <input
                  type="text"
                  value={editingProfile.ssid || ''}
                  onChange={(e) => setEditingProfile({ ...editingProfile, ssid: e.target.value })}
                  className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Password</label>
                <input
                  type="password"
                  value={editingProfile.password || ''}
                  onChange={(e) => setEditingProfile({ ...editingProfile, password: e.target.value })}
                  placeholder="Leave empty to keep current"
                  className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                />
              </div>

              <Toggle
                id="profileDhcp"
                checked={editingProfile.dhcp ?? true}
                onChange={(checked) => setEditingProfile({ ...editingProfile, dhcp: checked })}
                label="Use DHCP"
              />

              {!editingProfile.dhcp && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">IP Address</label>
                    <input
                      type="text"
                      value={editingProfile.ip || ''}
                      onChange={(e) => setEditingProfile({ ...editingProfile, ip: e.target.value })}
                      placeholder="192.168.1.100"
                      className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Gateway</label>
                    <input
                      type="text"
                      value={editingProfile.gateway || ''}
                      onChange={(e) => setEditingProfile({ ...editingProfile, gateway: e.target.value })}
                      placeholder="192.168.1.1"
                      className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Subnet Mask</label>
                    <input
                      type="text"
                      value={editingProfile.subnet || ''}
                      onChange={(e) => setEditingProfile({ ...editingProfile, subnet: e.target.value })}
                      placeholder="255.255.255.0"
                      className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">DNS Server</label>
                    <input
                      type="text"
                      value={editingProfile.dns || ''}
                      onChange={(e) => setEditingProfile({ ...editingProfile, dns: e.target.value })}
                      placeholder="8.8.8.8"
                      className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => {
                  setShowProfileForm(false);
                  setEditingProfile(null);
                }}
                className="flex-1 px-4 py-2 rounded bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                className="flex-1 px-4 py-2 rounded bg-brand-600 text-white hover:bg-brand-700"
              >
                Save Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WiFi Confirmation Dialog */}
      {showWiFiConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-2">Confirm WiFi Changes</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Changing WiFi settings may disconnect you from the device. Make sure the new settings are correct.
            </p>
            <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-sm mb-4">
              <div><strong>SSID:</strong> {wifiConfig.ssid}</div>
              <div><strong>DHCP:</strong> {wifiConfig.dhcp ? 'Enabled' : 'Disabled'}</div>
              {!wifiConfig.dhcp && <div><strong>IP:</strong> {wifiConfig.ip}</div>}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowWiFiConfirm(false)}
                className="flex-1 px-4 py-2 rounded bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveWiFi}
                className="flex-1 px-4 py-2 rounded bg-brand-600 text-white hover:bg-brand-700"
              >
                Apply Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AP Confirmation Dialog */}
      {showAPConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-2">Confirm AP Changes</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              This will update the Access Point configuration. Connected clients may be disconnected.
            </p>
            <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-sm mb-4">
              <div><strong>SSID:</strong> {apConfig.ssid}</div>
              <div><strong>Channel:</strong> {apConfig.channel === 0 ? 'Auto' : apConfig.channel}</div>
              <div><strong>Max Clients:</strong> {apConfig.maxClients === 0 ? 'Hardware Default' : apConfig.maxClients}</div>
              <div><strong>Hidden:</strong> {apConfig.hidden ? 'Yes' : 'No'}</div>
              <div><strong>Keep Active:</strong> {apConfig.keepActive ? 'Yes (Always on)' : 'No (Auto-disable)'}</div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowAPConfirm(false)}
                className="flex-1 px-4 py-2 rounded bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAP}
                className="flex-1 px-4 py-2 rounded bg-brand-600 text-white hover:bg-brand-700"
              >
                Apply Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

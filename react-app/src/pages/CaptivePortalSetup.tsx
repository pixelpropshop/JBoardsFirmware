import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { networkService } from '../services/networkService';
import type { ScanResult, WiFiConfig } from '../types/network';

export default function CaptivePortalSetup() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'scan' | 'configure' | 'connecting'>('scan');
  const [scanning, setScanning] = useState(true);
  const [networks, setNetworks] = useState<ScanResult[]>([]);
  const [selectedNetwork, setSelectedNetwork] = useState<ScanResult | null>(null);
  const [password, setPassword] = useState('');
  const [useDHCP, setUseDHCP] = useState(true);
  const [staticIP, setStaticIP] = useState('192.168.1.100');
  const [gateway, setGateway] = useState('192.168.1.1');
  const [subnet, setSubnet] = useState('255.255.255.0');
  const [dns, setDNS] = useState('8.8.8.8');
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    scanNetworks();
  }, []);

  const scanNetworks = async () => {
    setScanning(true);
    setError(null);
    try {
      const results = await networkService.scanNetworks();
      setNetworks(results.sort((a, b) => b.rssi - a.rssi)); // Sort by signal strength
    } catch (err) {
      setError('Failed to scan for networks. Please try again.');
    } finally {
      setScanning(false);
    }
  };

  const handleSelectNetwork = (network: ScanResult) => {
    setSelectedNetwork(network);
    setStep('configure');
    setError(null);
  };

  const handleBack = () => {
    if (step === 'configure') {
      setStep('scan');
      setSelectedNetwork(null);
      setPassword('');
      setError(null);
    } else {
      navigate('/captive-portal');
    }
  };

  const handleConnect = async () => {
    if (!selectedNetwork) return;

    // Validate password for secured networks
    if (selectedNetwork.encryption !== 'Open' && password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    // Validate static IP configuration
    if (!useDHCP) {
      const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
      if (!ipRegex.test(staticIP) || !ipRegex.test(gateway) || !ipRegex.test(subnet) || !ipRegex.test(dns)) {
        setError('Invalid IP configuration. Please check all fields.');
        return;
      }
    }

    setConnecting(true);
    setError(null);
    setStep('connecting');

    try {
      const config: WiFiConfig = {
        ssid: selectedNetwork.ssid,
        password: password,
        dhcp: useDHCP,
        ip: useDHCP ? '' : staticIP,
        gateway: useDHCP ? '' : gateway,
        subnet: useDHCP ? '' : subnet,
        dns: useDHCP ? '' : dns,
      };

      const result = await networkService.updateWiFiConfig(config);
      
      if (result.success) {
        // Mark captive portal as complete
        await networkService.completeCaptivePortal(false);
        
        // Wait a moment then redirect to main app
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        setError(result.message || 'Failed to connect to WiFi');
        setStep('configure');
      }
    } catch (err) {
      setError('Failed to connect to WiFi. Please try again.');
      setStep('configure');
    } finally {
      setConnecting(false);
    }
  };

  const getSignalIcon = (rssi: number) => {
    if (rssi >= -50) return '📶';
    if (rssi >= -60) return '📶';
    if (rssi >= -70) return '📡';
    return '📡';
  };

  const getSignalText = (rssi: number) => {
    if (rssi >= -50) return 'Excellent';
    if (rssi >= -60) return 'Good';
    if (rssi >= -70) return 'Fair';
    return 'Weak';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 to-brand-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <button
            onClick={handleBack}
            className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 mb-4"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {step === 'scan' && 'Select WiFi Network'}
            {step === 'configure' && 'Configure Connection'}
            {step === 'connecting' && 'Connecting...'}
          </h1>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6">
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 text-sm">
              {error}
            </div>
          )}

          {/* Step 1: Scan Networks */}
          {step === 'scan' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Available Networks
                </h2>
                <button
                  onClick={scanNetworks}
                  disabled={scanning}
                  className="text-xs px-3 py-1 rounded bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50"
                >
                  {scanning ? 'Scanning...' : 'Rescan'}
                </button>
              </div>

              {scanning ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mx-auto mb-2"></div>
                  Scanning for networks...
                </div>
              ) : networks.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No networks found. Try rescanning.
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {networks.map((network, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectNetwork(network)}
                      className="w-full p-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-brand-500 dark:hover:border-brand-500 transition-colors text-left"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900 dark:text-white">
                              {network.ssid}
                            </span>
                            {network.encryption !== 'Open' && (
                              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                              </svg>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                            <span>{getSignalIcon(network.rssi)} {getSignalText(network.rssi)}</span>
                            <span>Ch {network.channel}</span>
                            <span>{network.encryption}</span>
                          </div>
                        </div>
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Configure */}
          {step === 'configure' && selectedNetwork && (
            <div className="space-y-4">
              {/* Selected Network Info */}
              <div className="p-3 rounded-lg bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {selectedNetwork.ssid}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {getSignalIcon(selectedNetwork.rssi)} {getSignalText(selectedNetwork.rssi)} • {selectedNetwork.encryption}
                    </div>
                  </div>
                </div>
              </div>

              {/* Password (if secured) */}
              {selectedNetwork.encryption !== 'Open' && (
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter WiFi password"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  />
                </div>
              )}

              {/* DHCP Toggle */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-900">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Use DHCP (Automatic IP)
                </span>
                <button
                  onClick={() => setUseDHCP(!useDHCP)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    useDHCP ? 'bg-brand-600' : 'bg-gray-300 dark:bg-gray-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      useDHCP ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Static IP Configuration */}
              {!useDHCP && (
                <div className="space-y-3 pt-2">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                      IP Address
                    </label>
                    <input
                      type="text"
                      value={staticIP}
                      onChange={(e) => setStaticIP(e.target.value)}
                      placeholder="192.168.1.100"
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                      Gateway
                    </label>
                    <input
                      type="text"
                      value={gateway}
                      onChange={(e) => setGateway(e.target.value)}
                      placeholder="192.168.1.1"
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                      Subnet Mask
                    </label>
                    <input
                      type="text"
                      value={subnet}
                      onChange={(e) => setSubnet(e.target.value)}
                      placeholder="255.255.255.0"
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                      DNS Server
                    </label>
                    <input
                      type="text"
                      value={dns}
                      onChange={(e) => setDNS(e.target.value)}
                      placeholder="8.8.8.8"
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              )}

              {/* Connect Button */}
              <button
                onClick={handleConnect}
                disabled={connecting || (selectedNetwork.encryption !== 'Open' && password.length < 8)}
                className="w-full px-4 py-3 rounded-lg bg-brand-600 text-white font-medium hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {connecting ? 'Connecting...' : 'Connect to Network'}
              </button>
            </div>
          )}

          {/* Step 3: Connecting */}
          {step === 'connecting' && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Connecting to {selectedNetwork?.ssid}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                This may take a few moments...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { networkService } from '../services/networkService';

export default function CaptivePortal() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    checkPortalStatus();
  }, []);

  const checkPortalStatus = async () => {
    try {
      const status = await networkService.getCaptivePortalStatus();
      
      // If portal is already completed, redirect to main app
      if (status.isCompleted) {
        navigate('/');
      }
    } catch (error) {
      console.error('Failed to check portal status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectWiFi = () => {
    navigate('/captive-portal/setup');
  };

  const handleAPOnly = async () => {
    setSaving(true);
    try {
      const result = await networkService.completeCaptivePortal(true);
      if (result.success) {
        // Redirect to main app after marking as AP-only
        navigate('/');
      }
    } catch (error) {
      console.error('Failed to set AP-only mode:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 to-brand-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 to-brand-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-brand-600 text-white mb-4">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome to JSense Board
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Choose how you'd like to use this device
          </p>
        </div>

        {/* Options */}
        <div className="space-y-4">
          {/* Connect to WiFi Option */}
          <button
            onClick={handleConnectWiFi}
            className="w-full group relative bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 border-2 border-transparent hover:border-brand-500"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center group-hover:bg-brand-200 dark:group-hover:bg-brand-900/50 transition-colors">
                <svg className="w-6 h-6 text-brand-600 dark:text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0" />
                </svg>
              </div>
              <div className="flex-1 text-left">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  Connect to WiFi Network
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Connect this device to your existing WiFi network for internet access and remote control
                </p>
              </div>
              <svg className="w-6 h-6 text-gray-400 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>

          {/* AP Only Option */}
          <button
            onClick={handleAPOnly}
            disabled={saving}
            className="w-full group relative bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 border-2 border-transparent hover:border-brand-500 disabled:opacity-50"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 transition-colors">
                <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                </svg>
              </div>
              <div className="flex-1 text-left">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  Use as Access Point Only
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {saving ? 'Setting up...' : 'Keep the device in standalone mode. Connect directly to this device\'s WiFi network'}
                </p>
              </div>
              <svg className="w-6 h-6 text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-600">
            You can change this configuration later in Network Settings
          </p>
        </div>
      </div>
    </div>
  );
}

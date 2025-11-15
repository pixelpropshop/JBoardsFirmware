import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { firmwareService } from '../services/firmwareService';
import { api } from '../services/api';

interface UpdateInfo {
  available: boolean;
  currentVersion: string;
  latestVersion: string;
  changelog?: string;
  lastChecked?: number;
}

interface UpdateContextType {
  updateInfo: UpdateInfo;
  isChecking: boolean;
  checkForUpdates: () => Promise<void>;
  dismissUpdate: () => void;
  autoCheckEnabled: boolean;
  setAutoCheckEnabled: (enabled: boolean) => void;
  checkInterval: number;
  setCheckInterval: (hours: number) => void;
}

const UpdateContext = createContext<UpdateContextType | undefined>(undefined);

const DEFAULT_CHECK_INTERVAL = 6; // hours
const STORAGE_KEY_AUTO_CHECK = 'firmware_auto_check_enabled';
const STORAGE_KEY_CHECK_INTERVAL = 'firmware_check_interval';
const STORAGE_KEY_DISMISSED_VERSION = 'firmware_dismissed_version';
const STORAGE_KEY_LAST_CHECK = 'firmware_last_check';

export const UpdateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo>({
    available: false,
    currentVersion: '',
    latestVersion: '',
  });
  const [isChecking, setIsChecking] = useState(false);
  const [autoCheckEnabled, setAutoCheckEnabledState] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY_AUTO_CHECK);
    return stored !== null ? stored === 'true' : true; // Default enabled
  });
  const [checkInterval, setCheckIntervalState] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY_CHECK_INTERVAL);
    return stored ? parseInt(stored) : DEFAULT_CHECK_INTERVAL;
  });

  const setAutoCheckEnabled = useCallback((enabled: boolean) => {
    setAutoCheckEnabledState(enabled);
    localStorage.setItem(STORAGE_KEY_AUTO_CHECK, enabled.toString());
  }, []);

  const setCheckInterval = useCallback((hours: number) => {
    setCheckIntervalState(hours);
    localStorage.setItem(STORAGE_KEY_CHECK_INTERVAL, hours.toString());
  }, []);

  const dismissUpdate = useCallback(() => {
    if (updateInfo.latestVersion) {
      localStorage.setItem(STORAGE_KEY_DISMISSED_VERSION, updateInfo.latestVersion);
      setUpdateInfo(prev => ({ ...prev, available: false }));
    }
  }, [updateInfo.latestVersion]);

  const checkForUpdates = useCallback(async () => {
    setIsChecking(true);
    try {
      // Get current system info to get board name and version
      const systemInfo = await api.fetch<any>('/api/system/info');
      const boardName = systemInfo.productName || 'JSense Board';
      const currentVersion = systemInfo.firmwareVersion || '1.0.0';
      
      const result = await firmwareService.checkForUpdates(boardName, currentVersion);
      
      const dismissedVersion = localStorage.getItem(STORAGE_KEY_DISMISSED_VERSION);
      const isUpdateDismissed = dismissedVersion === result.latestVersion;
      
      setUpdateInfo({
        available: result.updateAvailable && !isUpdateDismissed,
        currentVersion: result.currentVersion,
        latestVersion: result.latestVersion,
        changelog: result.latestStable?.changelog,
        lastChecked: Date.now(),
      });

      localStorage.setItem(STORAGE_KEY_LAST_CHECK, Date.now().toString());
    } catch (error) {
      console.error('[UpdateContext] Failed to check for updates:', error);
    } finally {
      setIsChecking(false);
    }
  }, []);

  // Check on mount
  useEffect(() => {
    if (autoCheckEnabled) {
      checkForUpdates();
    }
  }, []);

  // Periodic checking
  useEffect(() => {
    if (!autoCheckEnabled) return;

    const intervalMs = checkInterval * 60 * 60 * 1000; // Convert hours to ms
    const timer = setInterval(() => {
      checkForUpdates();
    }, intervalMs);

    return () => clearInterval(timer);
  }, [autoCheckEnabled, checkInterval, checkForUpdates]);

  const value: UpdateContextType = {
    updateInfo,
    isChecking,
    checkForUpdates,
    dismissUpdate,
    autoCheckEnabled,
    setAutoCheckEnabled,
    checkInterval,
    setCheckInterval,
  };

  return <UpdateContext.Provider value={value}>{children}</UpdateContext.Provider>;
};

export const useUpdate = () => {
  const context = useContext(UpdateContext);
  if (!context) {
    throw new Error('useUpdate must be used within UpdateProvider');
  }
  return context;
};

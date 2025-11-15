import { useState, useEffect } from 'react';
import { systemService } from '../services/systemService';

export default function Clock() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [usingRTC, setUsingRTC] = useState(false);

  useEffect(() => {
    let intervalId: number;

    // Try to fetch RTC time (only called once on mount)
    const checkRTC = async () => {
      try {
        const rtcTime = await systemService.getRTCTime();
        if (rtcTime && rtcTime.year && rtcTime.month && rtcTime.day) {
          // Convert RTC time to Date object
          const rtcDate = new Date(
            rtcTime.year,
            rtcTime.month - 1,
            rtcTime.day,
            rtcTime.hour,
            rtcTime.minute,
            rtcTime.second
          );
          
          // Validate the date
          if (!isNaN(rtcDate.getTime())) {
            console.log('RTC detected and available');
            return true;
          }
        }
        console.log('RTC not available, using browser time');
        return false;
      } catch (err) {
        console.warn('Failed to connect to RTC, using browser time:', err);
        return false;
      }
    };

    // Fetch RTC time (for RTC mode)
    const fetchRTCTime = async () => {
      try {
        const rtcTime = await systemService.getRTCTime();
        if (rtcTime && rtcTime.year && rtcTime.month && rtcTime.day) {
          const rtcDate = new Date(
            rtcTime.year,
            rtcTime.month - 1,
            rtcTime.day,
            rtcTime.hour,
            rtcTime.minute,
            rtcTime.second
          );
          
          if (!isNaN(rtcDate.getTime())) {
            setCurrentTime(rtcDate);
          }
        }
      } catch (err) {
        // Silent fail - keep showing last known time
      }
    };

    // Update browser time (for browser mode)
    const updateBrowserTime = () => {
      setCurrentTime(new Date());
    };

    // Initialize - check once for RTC on mount
    const init = async () => {
      const rtcAvailable = await checkRTC();
      
      if (rtcAvailable) {
        // RTC is available - use it
        setUsingRTC(true);
        await fetchRTCTime(); // Get initial time
        intervalId = window.setInterval(fetchRTCTime, 5000); // Update every 5 seconds
      } else {
        // No RTC - use browser time
        setUsingRTC(false);
        updateBrowserTime(); // Set initial time
        intervalId = window.setInterval(updateBrowserTime, 1000); // Update every second
      }
    };

    init();

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  const formatTime = (date: Date): string => {
    const hour = date.getHours().toString().padStart(2, '0');
    const minute = date.getMinutes().toString().padStart(2, '0');
    const second = date.getSeconds().toString().padStart(2, '0');
    return `${hour}:${minute}:${second}`;
  };

  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return (
    <div className="flex flex-col items-end text-sm">
      <div className="font-mono font-semibold">{formatTime(currentTime)}</div>
      <div className="text-xs text-gray-500 dark:text-gray-400">
        {formatDate(currentTime)}
        {!usingRTC && (
          <span className="ml-1 text-orange-500" title="Using browser time (RTC not available)">
            *
          </span>
        )}
      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { useUpdate } from '../contexts/UpdateContext';
import { useNavigate } from 'react-router-dom';

export const UpdateNotification: React.FC = () => {
  const { updateInfo, dismissUpdate } = useUpdate();
  const [visible, setVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Show notification when update becomes available
    if (updateInfo.available) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  }, [updateInfo.available]);

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(() => {
      dismissUpdate();
    }, 300); // Wait for fade out animation
  };

  const handleGoToSettings = () => {
    setVisible(false);
    navigate('/settings');
    setTimeout(() => {
      dismissUpdate();
    }, 300);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-50 animate-fade-in"
      role="alert"
      aria-live="polite"
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 max-w-md">
        <div className="flex items-start gap-3">
          {/* Update Icon */}
          <div className="flex-shrink-0">
            <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <svg
                className="h-6 w-6 text-green-600 dark:text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
              Firmware Update Available
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Version {updateInfo.latestVersion} is now available. You're currently on{' '}
              {updateInfo.currentVersion}.
            </p>

            {/* Action Buttons */}
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleGoToSettings}
                className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
              >
                Update Now
              </button>
              <button
                onClick={handleDismiss}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Close notification"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

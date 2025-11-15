import { useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import Clock from './Clock'
import NetworkStatus from './NetworkStatus'
import { useUpdate } from '../contexts/UpdateContext'

const pageNames: Record<string, string> = {
  '/': 'Dashboard',
  '/effects': 'Effects',
  '/sequences': 'Sequences',
  '/audio': 'Audio',
  '/sensors': 'Sensors',
  '/network': 'Network',
  '/jboard-network': 'JBoard Network',
  '/files': 'Files',
  '/settings': 'Settings',
  '/about': 'About',
}

export default function Header() {
  const location = useLocation()
  const navigate = useNavigate()
  const [darkMode, setDarkMode] = useState(true)
  const { updateInfo } = useUpdate()

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
    document.documentElement.classList.toggle('dark')
  }

  const handleReboot = () => {
    // TODO: Implement reboot functionality
    alert('Reboot functionality will be implemented here')
  }

  return (
    <header className="flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-800">
      <div className="font-medium">{pageNames[location.pathname] || 'Dashboard'}</div>
      <div className="flex items-center gap-4">
        <Clock />
        <NetworkStatus />
        
        {/* Settings Button with Update Badge */}
        <button
          onClick={() => navigate('/settings')}
          className="relative inline-flex items-center gap-2 rounded border border-gray-200 dark:border-gray-800 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-900"
          title={updateInfo.available ? `Update available: v${updateInfo.latestVersion}` : 'Settings'}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
          <span>Settings</span>
          {updateInfo.available && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
          )}
        </button>
        
        <button 
          onClick={toggleDarkMode}
          className="inline-flex items-center gap-2 rounded border border-gray-200 dark:border-gray-800 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-900"
        >
          {darkMode ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="4"/>
              <path d="M12 2v2"/>
              <path d="M12 20v2"/>
              <path d="m4.93 4.93 1.41 1.41"/>
              <path d="m17.66 17.66 1.41 1.41"/>
              <path d="M2 12h2"/>
              <path d="M20 12h2"/>
              <path d="m6.34 17.66-1.41 1.41"/>
              <path d="m19.07 4.93-1.41 1.41"/>
            </svg>
          )}
          <span>{darkMode ? 'Dark mode' : 'Light mode'}</span>
        </button>
        <button 
          onClick={handleReboot}
          className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700"
        >
          Reboot
        </button>
      </div>
    </header>
  )
}

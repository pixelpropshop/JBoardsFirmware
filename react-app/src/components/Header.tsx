import { useLocation } from 'react-router-dom'
import { useState } from 'react'

const pageNames: Record<string, string> = {
  '/': 'Dashboard',
  '/effects': 'Effects',
  '/sequences': 'Sequences',
  '/audio': 'Audio',
  '/sensors': 'Sensors',
  '/network': 'Network',
  '/files': 'Files',
  '/about': 'About',
}

export default function Header() {
  const location = useLocation()
  const [darkMode, setDarkMode] = useState(true)

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
      <div className="flex items-center gap-2">
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

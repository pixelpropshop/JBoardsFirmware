import { NavLink } from 'react-router-dom'
import { useBoardConfig } from '../contexts/BoardContext'

const navItems = [
  {
    path: '/',
    name: 'Dashboard',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/>
        <path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      </svg>
    ),
  },
  {
    path: '/effects',
    name: 'Effects',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10"/>
        <path d="M6 12c0-1.7.7-3.2 1.8-4.2"/>
        <circle cx="12" cy="12" r="2"/>
        <path d="M18 12c0 1.7-.7 3.2-1.8 4.2"/>
      </svg>
    ),
  },
  {
    path: '/sequences',
    name: 'Sequences',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z"/>
        <path d="M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12"/>
        <path d="M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17"/>
      </svg>
    ),
  },
  {
    path: '/audio',
    name: 'Audio',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="m11 7.601-5.994 8.19a1 1 0 0 0 .1 1.298l.817.818a1 1 0 0 0 1.314.087L15.09 12"/>
        <path d="M16.5 21.174C15.5 20.5 14.372 20 13 20c-2.058 0-3.928 2.356-6 2-2.072-.356-2.775-3.369-1.5-4.5"/>
        <circle cx="16" cy="7" r="5"/>
      </svg>
    ),
  },
  {
    path: '/sensors',
    name: 'Sensors',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 7V5a2 2 0 0 1 2-2h2"/>
        <path d="M17 3h2a2 2 0 0 1 2 2v2"/>
        <path d="M21 17v2a2 2 0 0 1-2 2h-2"/>
        <path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
      </svg>
    ),
  },
  {
    path: '/network',
    name: 'Network',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="16" y="16" width="6" height="6" rx="1"/>
        <rect x="2" y="16" width="6" height="6" rx="1"/>
        <rect x="9" y="2" width="6" height="6" rx="1"/>
        <path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3"/>
        <path d="M12 12V8"/>
      </svg>
    ),
  },
  {
    path: '/jboard-network',
    name: 'JBoard Network',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="2"/>
        <circle cx="19" cy="6" r="2"/>
        <circle cx="5" cy="6" r="2"/>
        <circle cx="19" cy="18" r="2"/>
        <circle cx="5" cy="18" r="2"/>
        <path d="M12 14v-4m0 0L7 7m5 3l5-3m-5 13l-5-5m5 5l5-5"/>
      </svg>
    ),
  },
  {
    path: '/files',
    name: 'Files',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>
      </svg>
    ),
  },
  {
    path: '/about',
    name: 'About',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 16v-4"/>
        <path d="M12 8h.01"/>
      </svg>
    ),
  },
  {
    path: '/settings',
    name: 'Settings',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>
    ),
  },
]

export default function Sidebar() {
  const { board, loading } = useBoardConfig();

  if (loading || !board) {
    return (
      <aside className="row-span-2 border-r border-gray-200 dark:border-gray-800 p-4 space-y-4">
        <div className="flex items-center gap-2 font-semibold text-lg">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded bg-brand-600 text-white">
            J
          </span>
          Loading...
        </div>
      </aside>
    );
  }

  // Filter nav items based on board configuration
  const visibleNavItems = navItems.filter((item) => {
    switch (item.path) {
      case '/effects':
        return board.ui.showEffects;
      case '/sequences':
        return board.ui.showSequences;
      case '/audio':
        return board.ui.showAudio;
      case '/sensors':
        return board.ui.showSensors;
      case '/files':
        return board.ui.showFiles;
      case '/jboard-network':
        return board.ui.showJBoardNetwork;
      default:
        return true; // Show Dashboard, Network, About by default
    }
  });

  return (
    <aside className="row-span-2 border-r border-gray-200 dark:border-gray-800 p-4 space-y-4">
      <a href="/" className="flex items-center gap-2 font-semibold text-lg">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded bg-brand-600 text-white">
          J
        </span>
        {board.name}
      </a>
      
      <nav className="flex flex-col gap-1">
        {visibleNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `flex items-center gap-2 px-2 py-2 rounded transition-colors ${
                isActive
                  ? 'bg-gray-100 dark:bg-gray-900'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-900'
              }`
            }
          >
            {item.icon}
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

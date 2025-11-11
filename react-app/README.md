# JSense Board React Application

A React application for the JSense Board LED controller interface, built with React, TypeScript, React Router, and Tailwind CSS.

## Features

- **Dark Mode Support**: Toggle between light and dark themes
- **Responsive Design**: Works on desktop and mobile devices
- **Multiple Pages**:
  - Dashboard - System overview with LED channels status
  - Effects - Manage LED effects and patterns
  - Sequences - Create and manage effect sequences
  - Audio - Configure audio reactive settings
  - Sensors - Monitor environmental sensors
  - Network - Configure WiFi and Access Point settings
  - Files - Manage stored files and configurations
  - About - System information and resources

## Tech Stack

- React 18
- TypeScript
- React Router 6
- Tailwind CSS
- Vite

## Installation

```bash
cd react-app
npm install
```

## Development

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Build

Build for production:

```bash
npm run build
```

The built files will be in the `dist` folder.

## TODO: API Integration

This application currently uses **stub data** throughout all components. To integrate with the actual JSense Board API:

1. Create an API service module (e.g., `src/services/api.ts`)
2. Replace stub data in each page component with API calls
3. Add loading states and error handling
4. Implement data fetching with useEffect hooks
5. Consider using a state management solution (React Query, Zustand, etc.)

### Files to Update for API Integration:

- `src/pages/Dashboard.tsx` - Replace system info and LED channels stub data
- `src/pages/Effects.tsx` - Replace effects list stub data
- `src/pages/Sequences.tsx` - Replace sequences stub data
- `src/pages/Audio.tsx` - Replace audio settings stub data
- `src/pages/Sensors.tsx` - Replace sensor readings stub data
- `src/pages/Network.tsx` - Replace network config stub data
- `src/pages/Files.tsx` - Replace files list stub data
- `src/pages/About.tsx` - Replace system info stub data
- `src/components/Header.tsx` - Implement actual reboot functionality

## Design Notes

- Brand color: `#1a6ef2`
- Dark mode is enabled by default
- All TODO comments mark places where stub data should be replaced with API calls
- Components use Tailwind CSS utility classes for styling
- Custom scrollbar styling is defined in `src/index.css`

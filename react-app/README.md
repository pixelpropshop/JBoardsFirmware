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

## API Integration

The application uses a service layer architecture with mock data fallback for development:

- **Base API Service**: `src/services/api.ts` - Provides centralized API configuration and base URL management
- **Feature Services**: Individual service modules for each feature area with mock data fallback in development mode
- **Environment Configuration**: `.env.development` and `.env.production` files control API endpoint behavior

### Service Modules:

- `src/services/boardService.ts` - Board management and LED channels
- `src/services/effectsService.ts` - LED effects and patterns
- `src/services/sequenceService.ts` - Effect sequences
- `src/services/audioService.ts` - Audio files and playback
- `src/services/networkService.ts` - WiFi and network configuration
- `src/services/filesService.ts` - File management
- `src/services/systemService.ts` - System information and operations
- `src/services/jboardService.ts` - JBoard network device discovery and management

The application automatically uses mock data when the ESP32 backend is unavailable, allowing for seamless development and testing.

## Design Notes

- Brand color: `#1a6ef2`
- Dark mode is enabled by default
- All TODO comments mark places where stub data should be replaced with API calls
- Components use Tailwind CSS utility classes for styling
- Custom scrollbar styling is defined in `src/index.css`

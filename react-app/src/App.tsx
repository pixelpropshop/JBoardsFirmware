import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { BoardProvider } from './contexts/BoardContext'
import { ToastProvider, useToast } from './contexts/ToastContext'
import { setToastHandler } from './utils/errorHandler'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Effects from './pages/Effects'
import Sequences from './pages/Sequences'
import SequenceEditor from './pages/SequenceEditor'
import Audio from './pages/Audio'
import Sensors from './pages/Sensors'
import Pixels from './pages/Pixels'
import Network from './pages/Network'
import Files from './pages/Files'
import About from './pages/About'
import Settings from './pages/Settings'
import CaptivePortal from './pages/CaptivePortal'
import CaptivePortalSetup from './pages/CaptivePortalSetup'
import JBoardNetwork from './pages/JBoardNetwork'
import JBoardDeviceDetails from './pages/JBoardDeviceDetails'

function AppContent() {
  const { showToast } = useToast()

  useEffect(() => {
    setToastHandler(showToast)
  }, [showToast])

  return (
    <BoardProvider>
      <Routes>
      {/* Captive Portal Routes (no layout) */}
      <Route path="/captive-portal" element={<CaptivePortal />} />
      <Route path="/captive-portal/setup" element={<CaptivePortalSetup />} />
      
      {/* Main App Routes (with layout) */}
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="effects" element={<Effects />} />
        <Route path="sequences" element={<Sequences />} />
        <Route path="sequences/new" element={<SequenceEditor />} />
        <Route path="sequences/edit/:id" element={<SequenceEditor />} />
        <Route path="audio" element={<Audio />} />
        <Route path="sensors" element={<Sensors />} />
        <Route path="pixels" element={<Pixels />} />
        <Route path="network" element={<Network />} />
        <Route path="jboard-network" element={<JBoardNetwork />} />
        <Route path="jboard-network/:mac" element={<JBoardDeviceDetails />} />
        <Route path="files" element={<Files />} />
        <Route path="about" element={<About />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      </Routes>
    </BoardProvider>
  )
}

function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  )
}

export default App

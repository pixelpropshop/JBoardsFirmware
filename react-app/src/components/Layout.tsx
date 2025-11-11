import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import SequencePlaybackWidget from './SequencePlaybackWidget'
import { ToastContainer } from './Toast'

export default function Layout() {
  return (
    <div className="min-h-dvh grid grid-cols-[240px_1fr] grid-rows-[56px_1fr] dark:bg-gray-950 dark:text-gray-100 bg-white text-gray-900">
      <Sidebar />
      <Header />
      <main className="p-4 overflow-auto scrollbar-thin">
        <Outlet />
      </main>
      <SequencePlaybackWidget />
      <ToastContainer />
    </div>
  )
}

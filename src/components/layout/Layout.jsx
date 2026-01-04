import { useState } from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

export function Layout({ children, title = 'Dashboard' }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content area */}
      <div className="lg:pl-64 min-h-screen flex flex-col">
        {/* Header */}
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          title={title}
        />

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { RenewalBanner } from '../../modules/subscriptions/components/RenewalBanner'
import { RenewalModal } from '../../modules/subscriptions/components/RenewalModal'
import { useRenewalAlert } from '../../modules/subscriptions/hooks/useRenewalAlert'
import { ImpersonationBanner } from '../common/ImpersonationBanner'
import FeedbackWidget from '../common/FeedbackWidget'

export function Layout({ children, title = 'Dashboard' }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const {
    isRenewalModalOpen,
    openRenewalModal,
    closeRenewalModal,
    shouldShowBanner
  } = useRenewalAlert()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Banner de impersonación (siempre visible cuando está activo) */}
      <ImpersonationBanner />

      {/* Banner de renovación (fijo arriba) */}
      <RenewalBanner />

      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content area */}
      <div className={`lg:pl-64 min-h-screen flex flex-col ${shouldShowBanner ? 'pt-14 lg:pt-16' : ''}`}>
        {/* Header */}
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          title={title}
          onRenewalClick={openRenewalModal}
        />

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6">
          {children}
        </main>
      </div>

      {/* Modal de renovación */}
      <RenewalModal
        isOpen={isRenewalModalOpen}
        onClose={closeRenewalModal}
      />

      {/* Widget de Feedback (flotante solo en desktop) */}
      <FeedbackWidget />
    </div>
  )
}

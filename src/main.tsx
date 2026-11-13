import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import '@/design/index.css'
import '@/brand/logo.css'
import '@/components/ui/ui.css'
import '@/components/form/form.css'
import '@/layouts/appshell.css'

import { ErrorBoundary } from '@/app/ErrorBoundary'
import { PreferencesProvider } from '@/app/PreferencesProvider'
import { AppRouter } from '@/app/router'
import { registerOfflineSupport, requestPersistentStorage } from '@/pwa/register'

const container = document.getElementById('root')
if (!container) throw new Error('Elemento #root não encontrado.')

createRoot(container).render(
  <StrictMode>
    <ErrorBoundary>
      <PreferencesProvider>
        <AppRouter />
      </PreferencesProvider>
    </ErrorBoundary>
  </StrictMode>,
)

registerOfflineSupport()
void requestPersistentStorage()

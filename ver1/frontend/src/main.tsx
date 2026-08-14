import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './features/auth/AuthContext.tsx'
import { registerServiceWorker } from './services/notificationService.ts'
import { listenForNotificationActions, syncPendingNotificationActions } from './services/notificationActionService.ts'

async function bootstrap() {
  await registerServiceWorker()
  await syncPendingNotificationActions().catch(() => undefined)
  listenForNotificationActions()
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <AuthProvider>
        <App />
      </AuthProvider>
    </StrictMode>,
  )
}

void bootstrap()

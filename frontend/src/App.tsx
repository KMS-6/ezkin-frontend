import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './features/auth/AuthRoute'
import { OnboardingPage } from './features/onboarding/OnboardingPage'
import { AppShell } from './layouts/AppShell'
import { HomePage } from './pages/HomePage'
import { AnalysisReportPage } from './pages/AnalysisReportPage'
import { TriggerAnalysisPage } from './pages/TriggerAnalysisPage'
import { LifeLogPage } from './pages/LifeLogPage'
import { BriefingPage } from './pages/BriefingPage'
import { ProductDetailPage } from './pages/ProductDetailPage'
import { SettingsPage } from './pages/SettingsPage'
import { ScanPage } from './pages/ScanPage'
import { SosPage } from './pages/SosPage'
import { ShelfPage } from './pages/ShelfPage'
import { SplashPage } from './pages/SplashPage'
import { QuickInputPage } from './pages/QuickInputPage'
import { AndroidNotificationCoordinator } from './features/notifications/AndroidNotificationCoordinator'
import { AndroidBackButtonCoordinator } from './features/navigation/AndroidBackButtonCoordinator'

function App() {
  return (
    <BrowserRouter>
      <AndroidNotificationCoordinator />
      <AndroidBackButtonCoordinator />
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<SplashPage />} />
          <Route path="login" element={<Navigate to="/" replace />} />
          <Route path="signup" element={<Navigate to="/" replace />} />

          <Route element={<ProtectedRoute onboarding="incomplete" />}>
            <Route path="onboarding" element={<OnboardingPage />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route path="home" element={<HomePage />} />
            <Route path="briefing" element={<BriefingPage />} />
            <Route path="lifelog" element={<LifeLogPage />} />
            <Route path="quick-input/:kind" element={<QuickInputPage />} />
            <Route path="scan" element={<ScanPage />} />
            <Route path="shelf" element={<ShelfPage />} />
            <Route path="shelf/:id" element={<ProductDetailPage />} />
            <Route path="analysis" element={<AnalysisReportPage />} />
            <Route path="analysis/trigger/:scanId" element={<TriggerAnalysisPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="sos" element={<SosPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App

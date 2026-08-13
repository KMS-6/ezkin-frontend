import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute, PublicOnlyRoute, RootRedirect } from './features/auth/AuthRoute'
import { LoginPage } from './features/auth/pages/LoginPage'
import { SignupPage } from './features/auth/pages/SignupPage'
import { OnboardingPage } from './features/onboarding/OnboardingPage'
import { AppShell } from './layouts/AppShell'
import { HomePage } from './pages/HomePage'
import { AnalysisPage } from './pages/AnalysisPage'
import { LifeLogPage } from './pages/LifeLogPage'
import { BriefingPage } from './pages/BriefingPage'
import { ProductDetailPage } from './pages/ProductDetailPage'
import { SettingsPage } from './pages/SettingsPage'
import { ScanPage } from './pages/ScanPage'
import { SosPage } from './pages/SosPage'
import { ShelfPage } from './pages/ShelfPage'
import { NotificationSettingsPage } from './pages/NotificationSettingsPage'
import { MealQuickInputPage } from './pages/MealQuickInputPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<RootRedirect />} />

          <Route element={<PublicOnlyRoute />}>
            <Route path="login" element={<LoginPage />} />
            <Route path="signup" element={<SignupPage />} />
          </Route>

          <Route element={<ProtectedRoute onboarding="incomplete" />}>
            <Route path="onboarding" element={<OnboardingPage />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route path="home" element={<HomePage />} />
            <Route path="briefing" element={<BriefingPage />} />
            <Route path="lifelog" element={<LifeLogPage />} />
            <Route path="scan" element={<ScanPage />} />
            <Route path="shelf" element={<ShelfPage />} />
            <Route path="shelf/:id" element={<ProductDetailPage />} />
            <Route path="analysis" element={<AnalysisPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="settings/notifications" element={<NotificationSettingsPage />} />
            <Route path="quick-input/meal" element={<MealQuickInputPage />} />
            <Route path="sos" element={<SosPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App

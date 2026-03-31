import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/lib/auth'
import { TrainingList } from '@/pages/TrainingList'
import { TrainingForm } from '@/pages/TrainingForm'
import { TrainingDetail } from '@/pages/TrainingDetail'
import { SettingsPage } from '@/pages/SettingsPage'
import { LoginPage } from '@/pages/LoginPage'

function AppRoutes() {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Načítání...</p>
      </div>
    )
  }

  if (!session) {
    return <LoginPage />
  }

  return (
    <Routes>
      <Route path="/" element={<TrainingList />} />
      <Route path="/team/:teamId" element={<TrainingList />} />
      <Route path="/training/:id" element={<TrainingDetail />} />
      <Route path="/new" element={<TrainingForm />} />
      <Route path="/edit/:id" element={<TrainingForm />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}

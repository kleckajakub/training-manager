import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { TrainingList } from '@/pages/TrainingList'
import { TrainingForm } from '@/pages/TrainingForm'
import { TrainingDetail } from '@/pages/TrainingDetail'
import { SettingsPage } from '@/pages/SettingsPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<TrainingList />} />
        <Route path="/training/:id" element={<TrainingDetail />} />
        <Route path="/new" element={<TrainingForm />} />
        <Route path="/edit/:id" element={<TrainingForm />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </BrowserRouter>
  )
}

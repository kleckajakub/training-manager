import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { TrainingList } from '@/pages/TrainingList'
import { TrainingForm } from '@/pages/TrainingForm'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<TrainingList />} />
        <Route path="/new" element={<TrainingForm />} />
        <Route path="/edit/:id" element={<TrainingForm />} />
      </Routes>
    </BrowserRouter>
  )
}

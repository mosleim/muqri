import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from '@/pages/HomePage';
import SetupPage from '@/pages/SetupPage';
import PrayerPage from '@/pages/PrayerPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/setup" element={<SetupPage />} />
        <Route path="/prayer" element={<PrayerPage />} />
      </Routes>
    </BrowserRouter>
  );
}

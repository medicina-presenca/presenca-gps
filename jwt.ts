import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { TRPCProvider } from './lib/trpc-provider';
import { LoginPage } from './pages/LoginPage';
import { ActivitiesPage } from './pages/ActivitiesPage';
import { ActivityDetailPage } from './pages/ActivityDetailPage';
import './index.css';

function App() {
  return (
    <TRPCProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<ActivitiesPage />} />
          <Route path="/activities/:id" element={<ActivityDetailPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </TRPCProvider>
  );
}

export default App;

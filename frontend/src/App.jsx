import { Route, Routes, Navigate, Outlet, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import SystemStatusBanner from './components/SystemStatusBanner';
import Dashboard from './pages/Dashboard';
import NewSurvey from './pages/NewSurvey';
import SurveyEditor from './pages/SurveyEditor';
import ReportPreview from './pages/ReportPreview';
import Login from './pages/Login';
import { getToken } from './api/axios';
import './index.css';

// Wraps the authenticated app. No token → bounce to /login (remembering where
// they were headed). The chrome (banner, navbar, footer) lives here so the
// login screen stays bare.
function ProtectedLayout() {
  const location = useLocation();
  if (!getToken()) return <Navigate to="/login" replace state={{ from: location }} />;
  return (
    <div className="app-container">
      <SystemStatusBanner />
      <Navbar />
      <main className="main-content">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/surveys/new" element={<NewSurvey />} />
        <Route path="/surveys/:id/edit" element={<SurveyEditor />} />
        <Route path="/surveys/:id/report" element={<ReportPreview />} />
      </Route>
    </Routes>
  );
}

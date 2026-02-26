import { Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import NewSurvey from './pages/NewSurvey';
import SurveyEditor from './pages/SurveyEditor';
import ReportPreview from './pages/ReportPreview';
import './index.css';

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/surveys/new" element={<NewSurvey />} />
        <Route path="/surveys/:id/edit" element={<SurveyEditor />} />
        <Route path="/surveys/:id/report" element={<ReportPreview />} />
      </Routes>
    </>
  );
}

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import DashboardPage from '../pages/Dashboard/DashboardPage';
import CasesPage from '../pages/Cases/CasesPage';
import CaseViewPage from '../pages/Cases/CaseViewPage';
import CaseEditPage from '../pages/Cases/CaseEditPage';
import CaseCreatePage from '../pages/Cases/CaseCreatePage';
import CaseCommentsPage from '../pages/Cases/CaseCommentsPage';
import ReportPage from '../pages/Report/ReportPage';
import TeamsPage from '../pages/Teams/TeamsPage';
import LoginPage from '../pages/Login/LoginPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/cases" element={<CasesPage />} />
        <Route path="/cases/:id" element={<CaseViewPage />} />
        <Route path="/cases/:id/edit" element={<CaseEditPage />} />
        <Route path="/cases/create" element={<CaseCreatePage />} />
        <Route path="/cases/:id/comments" element={<CaseCommentsPage />} />
        <Route path="/report" element={<ReportPage />} /> 
        <Route path="/teams" element={<TeamsPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
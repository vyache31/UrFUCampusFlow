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
import TeamCreatePage from '../pages/Teams/TeamCreatePage';
import TeamViewPage from '../pages/Teams/TeamViewPage';
import BotManagementPage from '../pages/BotManagement/BotManagementPage';
import OutlookCallbackPage from '../pages/OutlookCallback/OutlookCallbackPage';
import SSOPage from '../pages/Login/SSOPage';

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
        <Route path="/teams/create" element={<TeamCreatePage />} />
        <Route path="/teams/:id" element={<TeamViewPage />} />
        <Route path="/bot-management" element={<BotManagementPage />} />
        <Route path="/outlook/callback" element={<OutlookCallbackPage />} />
        <Route path="/sso" element={<SSOPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

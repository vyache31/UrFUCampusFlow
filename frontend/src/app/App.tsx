import { BrowserRouter, Routes, Route } from 'react-router-dom';
import type { ReactElement } from 'react';
import { ToastProvider } from '../context/ToastContext';
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
import TeamEditPage from '../pages/Teams/TeamEditPage';
import BotManagementPage from '../pages/BotManagement/BotManagementPage';
import OutlookCallbackPage from '../pages/OutlookCallback/OutlookCallbackPage';
import SSOPage from '../pages/Login/SSOPage';
import TeamCaseHistoryPage from '../pages/Teams/TeamCaseHistoryPage';

interface AppRoute {
  path: string;
  element: ReactElement;
}

const ROUTES: AppRoute[] = [
  { path: '/', element: <DashboardPage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/cases', element: <CasesPage /> },
  { path: '/cases/create', element: <CaseCreatePage /> },
  { path: '/cases/:id', element: <CaseViewPage /> },
  { path: '/cases/:id/edit', element: <CaseEditPage /> },
  { path: '/cases/:id/comments', element: <CaseCommentsPage /> },
  { path: '/report', element: <ReportPage /> },
  { path: '/teams', element: <TeamsPage /> },
  { path: '/teams/create', element: <TeamCreatePage /> },
  { path: '/teams/:id', element: <TeamViewPage /> },
  { path: '/teams/:id/edit', element: <TeamEditPage /> },
  { path: '/teams/:id/history', element: <TeamCaseHistoryPage /> },
  { path: '/bot-management', element: <BotManagementPage /> },
  { path: '/outlook/callback', element: <OutlookCallbackPage /> },
  { path: '/sso', element: <SSOPage /> },
];

const App = () => (
  <ToastProvider>
    <BrowserRouter>
      <Routes>
        {ROUTES.map(({ path, element }) => (
          <Route key={path} path={path} element={element} />
        ))}
      </Routes>
    </BrowserRouter>
  </ToastProvider>
);

export default App;
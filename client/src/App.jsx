import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';
import ProblemSelection from './pages/ProblemSelection';
import Attendance from './pages/Attendance';
import GameZone from './pages/GameZone';
import GameLeaderboard from './pages/GameLeaderboard';
import MemoryWall from './pages/MemoryWall';
import FinalLeaderboard from './pages/FinalLeaderboard';
import AdminControl from './pages/AdminControl';
import Scoreboard from './pages/Scoreboard';
import VolunteerDashboard from './pages/VolunteerDashboard';
import AssignedTeams from './pages/AssignedTeams';
import QRScanner from './pages/QRScanner';
import TeamMonitoring from './pages/TeamMonitoring';
import PhotoCapture from './pages/PhotoCapture';
import Notifications from './pages/Notifications';
import ReviewerDashboard from './pages/ReviewerDashboard';
import EvaluationForm from './pages/EvaluationForm';
import { AdminTeams, AdminProblems, AdminSelectionControl, AdminAttendance, AdminReviewers, AdminReviewControl, AdminGameControl, AdminMemoryWall, AdminNotifications, AdminLeaderboards, AdminExport } from './pages/AdminPages';

// Protected Route Wrapper
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const token = localStorage.getItem('arena_token');
  const role = localStorage.getItem('arena_role');

  if (!token) return <Navigate to="/login" replace />;
  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    // If Admin accidentally clicks Team link, send them back to Admin.
    if (role === 'admin') return <Navigate to="/admin" replace />;
    if (role === 'volunteer') return <Navigate to="/volunteer" replace />;
    if (role === 'reviewer') return <Navigate to="/reviewer" replace />;
    if (role === 'team') return <Navigate to="/dashboard" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
};

// Layout for Portals
const PortalLayout = ({ children }) => {
  const role = localStorage.getItem('arena_role');
  return (
    <div className="flex bg-arena-gradient min-h-screen">
      <div className="fixed top-0 left-0 bottom-0 z-50">
        <Sidebar role={role} />
      </div>
      <div className="flex-1 flex flex-col ml-72 overflow-y-auto custom-scrollbar h-screen relative z-10">
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
};

// Portals...
const TeamPortal = () => (
  <ProtectedRoute allowedRoles={['team']}>
    <PortalLayout>
      <Routes>
        <Route index element={<Dashboard />} />
        <Route path="selection" element={<ProblemSelection />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="games" element={<GameZone />} />
        <Route path="game-leaderboard" element={<GameLeaderboard />} />
        <Route path="memory-wall" element={<MemoryWall />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="leaderboard" element={<FinalLeaderboard />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </PortalLayout>
  </ProtectedRoute>
);

const AdminPortal = () => (
  <ProtectedRoute allowedRoles={['admin']}>
    <PortalLayout>
      <Routes>
        <Route index element={<AdminControl />} />
        <Route path="teams" element={<AdminTeams />} />
        <Route path="problems" element={<AdminProblems />} />
        <Route path="selection-control" element={<AdminSelectionControl />} />
        <Route path="attendance" element={<AdminAttendance />} />
        <Route path="reviewers" element={<AdminReviewers />} />
        <Route path="review-control" element={<AdminReviewControl />} />
        <Route path="game-control" element={<AdminGameControl />} />
        <Route path="memory-wall" element={<AdminMemoryWall />} />
        <Route path="notifications" element={<AdminNotifications />} />
        <Route path="leaderboards" element={<AdminLeaderboards />} />
        <Route path="scoreboard" element={<Scoreboard />} />
        <Route path="export" element={<AdminExport />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </PortalLayout>
  </ProtectedRoute>
);

const VolunteerPortal = () => (
  <ProtectedRoute allowedRoles={['volunteer']}>
    <PortalLayout>
      <Routes>
        <Route index element={<VolunteerDashboard />} />
        <Route path="teams" element={<AssignedTeams />} />
        <Route path="scan" element={<QRScanner />} />
        <Route path="monitoring" element={<TeamMonitoring />} />
        <Route path="photos" element={<PhotoCapture />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="*" element={<Navigate to="/volunteer" replace />} />
      </Routes>
    </PortalLayout>
  </ProtectedRoute>
);

const ReviewerPortal = () => (
  <ProtectedRoute allowedRoles={['reviewer']}>
    <PortalLayout>
      <Routes>
        <Route index element={<ReviewerDashboard />} />
        <Route path="evaluation/:teamId" element={<EvaluationForm />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="*" element={<Navigate to="/reviewer" replace />} />
      </Routes>
    </PortalLayout>
  </ProtectedRoute>
);

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard/*" element={<TeamPortal />} />
        <Route path="/admin/*" element={<AdminPortal />} />
        <Route path="/volunteer/*" element={<VolunteerPortal />} />
        <Route path="/reviewer/*" element={<ReviewerPortal />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;

import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Search, 
  UploadCloud, 
  QrCode, 
  Gamepad2, 
  Trophy, 
  Image as ImageIcon, 
  Bell, 
  LogOut,
  Users,
  Settings,
  Camera,
  ClipboardCheck,
  Activity,
  BarChart3,
  FileText
} from 'lucide-react';

const Sidebar = ({ role }) => {
  const menus = {
    team: [
      { name: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" />, path: '/dashboard' },
      { name: 'Problem Selection', icon: <Search className="w-5 h-5" />, path: '/dashboard/selection' },
      { name: 'Attendance', icon: <ClipboardCheck className="w-5 h-5" />, path: '/dashboard/attendance' },
      { name: 'Game Zone', icon: <Gamepad2 className="w-5 h-5" />, path: '/dashboard/games' },
      { name: 'Game Leaderboard', icon: <Trophy className="w-5 h-5" />, path: '/dashboard/game-leaderboard' },
      { name: 'Memory Wall', icon: <ImageIcon className="w-5 h-5" />, path: '/dashboard/memory-wall' },
      { name: 'Notifications', icon: <Bell className="w-5 h-5" />, path: '/dashboard/notifications' },
      { name: 'Final Leaderboard', icon: <BarChart3 className="w-5 h-5" />, path: '/dashboard/leaderboard' },
    ],
    volunteer: [
      { name: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" />, path: '/volunteer' },
      { name: 'Assigned Teams', icon: <Users className="w-5 h-5" />, path: '/volunteer/teams' },
      { name: 'Attendance Scanner', icon: <Camera className="w-5 h-5" />, path: '/volunteer/scan' },
    ],
    reviewer: [
      { name: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" />, path: '/reviewer' },
      { name: 'Assigned Teams', icon: <Users className="w-5 h-5" />, path: '/reviewer/teams' },
      { name: 'Evaluation', icon: <ClipboardCheck className="w-5 h-5" />, path: '/reviewer/evaluation' },
      { name: 'Notifications', icon: <Bell className="w-5 h-5" />, path: '/reviewer/notifications' },
    ],
    admin: [
      { name: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" />, path: '/admin' },
      { name: 'Team Management', icon: <Users className="w-5 h-5" />, path: '/admin/teams' },
      { name: 'Problem Statements', icon: <FileText className="w-5 h-5" />, path: '/admin/problems' },
      { name: 'Selection Control', icon: <Search className="w-5 h-5" />, path: '/admin/selection-control' },
      { name: 'Attendance Control', icon: <QrCode className="w-5 h-5" />, path: '/admin/attendance' },
      { name: 'Reviewer Mgmt', icon: <Users className="w-5 h-5" />, path: '/admin/reviewers' },
      { name: 'Review Control', icon: <ClipboardCheck className="w-5 h-5" />, path: '/admin/review-control' },
      { name: 'Game Control', icon: <Gamepad2 className="w-5 h-5" />, path: '/admin/game-control' },
      { name: 'Memory Wall Control', icon: <ImageIcon className="w-5 h-5" />, path: '/admin/memory-wall' },
      { name: 'Notifications/Polls', icon: <Bell className="w-5 h-5" />, path: '/admin/notifications' },
      { name: 'Leaderboards', icon: <Trophy className="w-5 h-5" />, path: '/admin/leaderboards' },
      { name: 'Scoreboard', icon: <BarChart3 className="w-5 h-5" />, path: '/admin/scoreboard' },
      { name: 'Export Data', icon: <FileText className="w-5 h-5" />, path: '/admin/export' },
    ]
  };

  const menuItems = menus[role] || menus.team;

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  return (
    <div className="h-screen w-72 glass-premium !rounded-none border-r border-white/10 flex flex-col pt-8 bg-black/40 backdrop-blur-3xl z-40 relative shadow-2xl">
      <div className="px-6 mb-10 flex flex-col items-center">
        <img src="/createx_logo.png" alt="CREATEX" className="h-12 object-contain mb-4 animate-pulse-slow" />
        <h1 className="text-xl font-black text-white tracking-widest uppercase text-glow">ARENA CONTROL</h1>
        <p className="text-[10px] text-arena-rose font-bold uppercase tracking-widest mt-1 opacity-70 border border-arena-rose/30 px-3 md py-1 rounded-full">{role.toUpperCase()} ACCESS</p>
      </div>

      <nav className="flex-1 px-4 flex flex-col gap-2 overflow-y-auto custom-scrollbar">
        {menuItems.map((item, idx) => (
          <NavLink
            key={idx}
            to={item.path}
            end
            className={({ isActive }) => `
              flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 group
              ${isActive 
                ? 'bg-gradient-to-r from-arena-wine to-arena-rose text-white shadow-wine-glow font-bold' 
                : 'text-arena-muted hover:bg-white/5 hover:text-white font-medium'}
            `}
          >
            {({ isActive }) => (
              <>
                <span className={`group-hover:scale-110 transition-transform ${isActive ? 'text-white' : 'text-arena-muted group-hover:text-arena-rose'}`}>
                  {item.icon}
                </span>
                <span className="text-xs uppercase tracking-[0.2em] truncate">
                  {item.name}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-white/10">
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-arena-rose hover:bg-red-500/10 transition-colors group"
        >
          <LogOut className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          <span className="text-sm font-bold tracking-widest uppercase">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;

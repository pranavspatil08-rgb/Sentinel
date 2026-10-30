import React, { useEffect, useState } from 'react';
import { Camera, UserSession } from '../data/sentinelData';
import { 
  Shield, 
  LayoutDashboard, 
  Search, 
  Map as MapIcon, 
  FolderArchive, 
  Bell, 
  FileText, 
  LogOut, 
  Menu,
  X,
  Eye,
  Camera as CameraIcon
} from 'lucide-react';

export type AppScreen = 'dashboard' | 'map' | 'search' | 'cases' | 'alerts' | 'activity' | 'evidence' | 'evidence-manager';

interface HeaderBarProps {
  currentScreen: AppScreen;
  onNavigate: (screen: AppScreen) => void;
  userSession: UserSession;
  onLogout: () => void;
  activeAlertsCount: number;
  cameras?: Camera[];
}

export const NavigationSidebar: React.FC<HeaderBarProps & { isMobileOpen?: boolean; onCloseMobile?: () => void }> = ({
  currentScreen,
  onNavigate,
  userSession,
  onLogout,
  activeAlertsCount,
  cameras = [],
  isMobileOpen = false,
  onCloseMobile,
}) => {

  const handleNav = (screen: AppScreen) => {
    onNavigate(screen);
    if (onCloseMobile) onCloseMobile();
  };

  const isAdmin = userSession.role === 'Admin';

  // Dynamic camera counts
  const totalCameras = cameras.length || 6;
  const onlineCameras = cameras.length ? cameras.filter(c => c.status === 'online').length : 5;
  const offlineCameras = totalCameras - onlineCameras;

  const navItems: { id: AppScreen; label: string; icon: React.ReactNode; badge?: number; adminOnly?: boolean }[] = [
    { id: 'dashboard', label: 'Operations Dashboard', icon: <LayoutDashboard className="w-4 h-4 shrink-0" /> },
    { id: 'map', label: 'Route Reconstruction', icon: <MapIcon className="w-4 h-4 shrink-0" /> },
    { id: 'search', label: 'Sightings Search', icon: <Search className="w-4 h-4 shrink-0" /> },
    { id: 'cases', label: 'Investigation Dossiers', icon: <FolderArchive className="w-4 h-4 shrink-0" /> },
    { id: 'alerts', label: 'Alerts & Watchlist', icon: <Bell className="w-4 h-4 shrink-0" />, badge: activeAlertsCount },
    { id: 'evidence', label: 'Evidence Examination', icon: <Eye className="w-4 h-4 shrink-0" /> },
    { id: 'evidence-manager', label: 'Evidence Manager', icon: <CameraIcon className="w-4 h-4 shrink-0" />, adminOnly: true },
    { id: 'activity', label: 'Activity & Audit Trail', icon: <FileText className="w-4 h-4 shrink-0" />, adminOnly: true },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#171B1F] text-[#DCDAD4] select-none border-r border-[#262B30]">
      {/* Platform Branding */}
      <div className="p-4 border-b border-[#262B30] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-[4px] bg-[#22282E] border border-[#343B43] flex items-center justify-center text-[#F4F3EF] shrink-0">
            <Shield className="w-4 h-4 text-[#D9822B]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm tracking-wider text-white">SENTINEL</span>
              <span className="text-[12px] uppercase font-mono font-medium text-[#DCDAD4] bg-[#22282E] px-1.5 py-0.5 rounded-[4px] border border-[#343B43] whitespace-nowrap">
                MAHARASHTRA POLICE
              </span>
            </div>
            <p className="text-[12px] text-[#88857C] leading-snug mt-0.5">State CCTV Intelligence Workstation</p>
          </div>
        </div>
        {onCloseMobile && (
          <button 
            onClick={onCloseMobile}
            className="md:hidden p-1 text-[#88857C] hover:text-white rounded-[4px] cursor-pointer"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Jurisdiction & Dynamic Camera Status */}
      <div className="px-4 py-3 bg-[#121518] border-b border-[#262B30] flex items-center justify-between text-xs text-[#88857C]">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full bg-[#16A34A] shrink-0" />
          <span className="truncate text-[12px] text-[#DCDAD4]">Pune sample region</span>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-[12px] text-[#A2A6AB] shrink-0">
          <span className="text-white font-medium">{onlineCameras}/{totalCameras}</span>
          <span>Online</span>
          {offlineCameras > 0 && (
            <span className="text-[#D9822B] font-medium">({offlineCameras} off)</span>
          )}
        </div>
      </div>

      {/* Main Navigation Links */}
      <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-1.5 text-[12px] font-mono tracking-wider text-[#6F7379] uppercase">
          Workstation Navigation
        </div>
        {navItems
          .filter(item => !item.adminOnly || isAdmin)
          .map((item) => {
            const isActive = currentScreen === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-[4px] transition-colors cursor-pointer text-left ${
                  isActive
                    ? 'bg-[#22282E] text-white font-semibold border-l-2 border-[#D9822B]'
                    : 'text-[#A2A6AB] hover:text-white hover:bg-[#1C2126]'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className={isActive ? 'text-[#D9822B]' : 'text-[#6F7379]'}>
                    {item.icon}
                  </span>
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="px-1.5 py-0.5 text-xs font-mono font-bold text-white bg-[#DC2626] rounded-[2px] min-w-[18px] text-center">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
      </nav>

      {/* Operational Notice */}
      <div className="px-4 py-3 text-xs text-[#88857C] border-t border-[#262B30] bg-[#121518] leading-relaxed">
        Maharashtra State Police Grid. Operational decisions are logged in an append-only registry.
      </div>

      {/* User Profile & Terminal Controls */}
      <div className="p-3 border-t border-[#262B30] bg-[#121518]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-[4px] bg-[#22282E] border border-[#343B43] flex items-center justify-center text-xs font-mono font-semibold text-white">
              {userSession.username.replace(/\s*Patil/i, '').slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium text-white truncate">
                {userSession.username.replace(/\s*Patil/i, '')}
              </div>
              <div className="text-xs text-[#88857C] uppercase font-mono">{userSession.role} Terminal</div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                onLogout();
              }}
              title="Sign out of workstation"
              className="p-1.5 text-[#88857C] hover:text-[#DC2626] rounded-[4px] hover:bg-[#22282E] transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 h-screen sticky top-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop & Sidebar */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div 
            className="fixed inset-0 bg-[#0E1217]/70 backdrop-blur-xs transition-opacity" 
            onClick={onCloseMobile} 
          />
          <div className="relative flex flex-col w-72 max-w-[85vw] h-full shadow-none border-r border-[#262B30]">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};

export const WorkspaceHeader: React.FC<{
  currentScreen: AppScreen;
  onOpenMobileNav: () => void;
  activeAlertsCount: number;
  userSession: UserSession;
  cameras?: Camera[];
}> = ({ currentScreen, onOpenMobileNav, activeAlertsCount, userSession, cameras = [] }) => {
  const [clock, setClock] = useState('');
  const [health, setHealth] = useState<{api:string;store:string;ai:string}>({api:'checking',store:'checking',ai:'checking'});
  useEffect(()=>{const tick=()=>setClock(new Date().toLocaleTimeString('en-IN',{timeZone:'Asia/Kolkata',hour12:false})+' IST');tick();const timer=setInterval(tick,1000);const check=()=>fetch('/api/health').then(r=>r.json()).then(setHealth).catch(()=>setHealth({api:'offline',store:'offline',ai:'offline'}));check();const poll=setInterval(check,15000);return()=>{clearInterval(timer);clearInterval(poll)}},[]);
  const getScreenTitle = (screen: AppScreen) => {
    switch (screen) {
      case 'dashboard':
        return { title: 'Operations Dashboard', subtitle: 'Pilot region: Pune City · Scalable to all districts of Maharashtra' };
      case 'map':
        return { title: 'Route Reconstruction', subtitle: 'Chronological camera sightings reconstructed on OpenStreetMap GIS' };
      case 'search':
        return { title: 'Sightings Search', subtitle: 'Registration plate search and appearance filtering across CCTV grid' };
      case 'cases':
        return { title: 'Investigation Dossiers', subtitle: 'Active investigation files, linked camera records, and evidence export' };
      case 'alerts':
        return { title: 'Alerts & Watchlist', subtitle: 'Real-time vehicle and subject match alerts requiring dispatch triage' };
      case 'evidence':
        return { title: 'Evidence Examination', subtitle: 'CCTV frame inspection, optical analysis, and human verification decision' };
      case 'activity':
        return { title: 'Activity & Audit Trail', subtitle: 'Append-only operational audit log of investigator decisions' };
      case 'evidence-manager':
        return { title: 'Evidence Manager', subtitle: 'Upload and manage evidence images' };
    }
  };

  const { title, subtitle } = getScreenTitle(currentScreen);

  const totalCameras = cameras.length || 6;
  const onlineCameras = cameras.length ? cameras.filter(c => c.status === 'online').length : 5;

  return (
    <header className="sticky top-0 z-20 bg-[#FFFFFF] border-b border-[#DCDAD4] px-4 md:px-6 py-3 print:hidden">
      <div className="flex items-center justify-between gap-x-4 gap-y-2 flex-wrap">
        {/* Left: Mobile Nav Toggle + View Titles */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onOpenMobileNav}
            className="md:hidden p-1.5 text-[#171B1F] hover:bg-[#F4F3EF] rounded-[4px] border border-[#DCDAD4] cursor-pointer"
            aria-label="Open navigation menu"
          >
            <Menu className="w-4 h-4" />
          </button>
          <div className="min-w-0 text-left">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-[#88857C] hidden sm:inline">SENTINEL /</span>
              <h1 className="text-sm md:text-base font-semibold text-[#171B1F] whitespace-nowrap">
                {title}
              </h1>
            </div>
            <p className="text-xs text-[#88857C] hidden sm:block">
              {subtitle}
            </p>
          </div>
        </div>

        {/* Right: Operational Status Strip */}
        <div className="flex items-center gap-3 flex-wrap justify-end">
          {/* Network Status Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] text-xs font-mono bg-[#FFFFFF] border border-[#DCDAD4] text-[#171B1F]">
            <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
            <span>{onlineCameras}/{totalCameras} Cameras Online</span>
          </div>

          {/* Demonstration Environment Tag */}
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] text-xs font-mono bg-[#FFFBEB] text-[#D9822B] border border-[#DCDAD4]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D9822B]" />
          <span>Demo data</span>
          </span>

          <div className="hidden xl:flex items-center gap-2 text-xs font-mono">
            <span>{clock}</span><span>API {health.api}</span><span>DB {health.store}</span><span>AI {health.ai}</span>
          </div>
          <select aria-label="Region" className="hidden lg:block text-xs bg-white border border-[#DCDAD4] rounded px-2 py-1" defaultValue="Pune City (sample data loaded)">
            <option>Pune City (sample data loaded)</option><option disabled>Mumbai — Next phase</option><option disabled>Nagpur — Next phase</option><option disabled>Nashik — Next phase</option><option disabled>Chhatrapati Sambhajinagar — Next phase</option><option disabled>Dhule — Next phase</option>
          </select>

          {/* Operator Info */}
          <div className="hidden lg:flex items-center gap-2 pl-3 border-l border-[#DCDAD4] text-xs text-[#88857C]">
            <span>Operator:</span>
            <span className="font-semibold text-[#171B1F]">{userSession.username.replace(/\s*Patil/i, '')}</span>
            <span className="px-1.5 py-0.5 rounded-[4px] text-xs font-mono bg-[#171B1F] text-white">
              {userSession.role}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export const HeaderBar = NavigationSidebar;

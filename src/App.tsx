/**
 * SENTINEL — Police CCTV Intelligence Workstation
 * 
 * Jurisdiction: Maharashtra Police (Pune City Surveillance Grid)
 * Multi-camera ANPR optical recognition, appearance correlation, and route reconstruction.
 */

import React, { useState, useEffect } from 'react';
import { 
  Camera, 
  Sighting, 
  Case, 
  WatchlistItem, 
  AlertItem, 
  ActivityLogItem, 
  UserSession,
  INITIAL_CAMERAS, 
  INITIAL_SIGHTINGS, 
  INITIAL_CASES, 
  INITIAL_WATCHLIST, 
  INITIAL_ALERTS, 
  INITIAL_ACTIVITY_LOG 
} from './data/sentinelData';
import { LoginView } from './components/LoginView';
import { NavigationSidebar, WorkspaceHeader, AppScreen } from './components/HeaderBar';
import { DashboardView } from './components/DashboardView';
import { RealLeafletMap } from './components/RealLeafletMap';
import { SearchView } from './components/SearchView';
import { CasesView } from './components/CasesView';
import { AlertsView } from './components/AlertsView';
import { CaseDetailView } from './components/CaseDetailView';
import { ActivityLogView } from './components/ActivityLogView';
import { FooterBar } from './components/FooterBar';
import { EvidenceManager } from './components/EvidenceManager';

export default function App() {
  const [userSession, setUserSession] = useState<UserSession | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // App dataset (synced with persistent server store)
  const [cameras, setCameras] = useState<Camera[]>(INITIAL_CAMERAS);
  const [sightings, setSightings] = useState<Sighting[]>(INITIAL_SIGHTINGS);
  const [cases, setCases] = useState<Case[]>(INITIAL_CASES);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(INITIAL_WATCHLIST);
  const [alerts, setAlerts] = useState<AlertItem[]>(INITIAL_ALERTS);
  const [activityLog, setActivityLog] = useState<ActivityLogItem[]>(INITIAL_ACTIVITY_LOG);

  // Navigation State
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('dashboard');
  const [selectedCaseId, setSelectedCaseId] = useState<string>(INITIAL_CASES[0]?.caseId || 'CASE-2026-001');
  const [selectedSightingId, setSelectedSightingId] = useState<string>(INITIAL_SIGHTINGS[0]?.id || 'SGT-01');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // 1. Check existing server session on initial load
  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch('/api/session');
        const data = await res.json();
        if (res.ok && data.authenticated && data.user) {
          setUserSession(data.user);
          await refreshData();
        }
      } catch (err) {
        console.warn('Session check failed or running offline:', err);
      } finally {
        setIsInitializing(false);
      }
    }
    checkSession();
  }, []);

  // Live-refresh while background AI image generation is running
  useEffect(() => {
    if (!userSession) return;
    let last = -1;
    const t = setInterval(async () => {
      try {
        const r = await fetch('/api/evidence/status');
        if (!r.ok) return;
        const st = await r.json();
        if (st.running || st.done !== last) { last = st.done; await refreshData(); }
      } catch {}
    }, 5000);
    return () => clearInterval(t);
  }, [userSession]);

  // Fetch data from server
  async function refreshData() {
    try {
      const res = await fetch('/api/data');
      if (res.ok) {
        const data = await res.json();
        if (data.cameras) setCameras(data.cameras);
        if (data.sightings) setSightings(data.sightings);
        if (data.cases) setCases(data.cases);
        if (data.watchlist) setWatchlist(data.watchlist);
        if (data.alerts) setAlerts(data.alerts);
        if (data.activityLog) setActivityLog(data.activityLog);
      }
    } catch (err) {
      console.warn('Data sync warning:', err);
    }
  }

  // 2. Login Callback
  const handleLoginSuccess = async (user: UserSession) => {
    setUserSession(user);
    setCurrentScreen('dashboard');
    await refreshData();
  };

  // 3. Logout Callback
  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    setUserSession(null);
    setCurrentScreen('dashboard');
  };

  // 4. Confirm or Reject Sighting Decision
  const handleUpdateDecision = async (
    sightingId: string, 
    decision: 'confirmed' | 'rejected', 
    notes?: string
  ) => {
    // Optimistic local update
    setSightings((prev) =>
      prev.map((s) => (s.id === sightingId ? { ...s, decision, notes: notes || s.notes } : s))
    );

    try {
      const res = await fetch('/api/sighting/decision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sightingId, decision, notes }),
      });
      if (res.ok) {
        await refreshData();
      }
    } catch (err) {
      console.error('Error updating decision on server:', err);
    }
  };

  // 5. Simulate Live Sighting (Requirement 15)
  const handleSimulateSighting = async () => {
    try {
      const res = await fetch('/api/sighting/simulate', { method: 'POST' });
      if (res.ok) {
        await refreshData();
        setCurrentScreen('alerts');
      }
    } catch (err) {
      console.error('Simulation error:', err);
    }
  };

  // 6. Reset Demo Data (Requested)
  const handleResetDemoData = async () => {
    try {
      const res = await fetch('/api/reset-demo', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.data) {
          setCameras(data.data.cameras);
          setSightings(data.data.sightings);
          setCases(data.data.cases);
          setWatchlist(data.data.watchlist);
          setAlerts(data.data.alerts);
          setActivityLog(data.data.activityLog);
        }
      }
    } catch (err) {
      console.error('Reset demo error:', err);
    }
  };

  // 7. Acknowledge Alert
  const handleAcknowledgeAlert = async (alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, status: 'acknowledged' } : a))
    );
    try {
      await fetch('/api/alert/acknowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId }),
      });
    } catch (err) {
      console.error('Error acknowledging alert:', err);
    }
  };

  // 8. Update Case
  const handleUpdateCase = async (caseId: string, updates: Partial<Case>) => {
    setCases((prev) =>
      prev.map((c) => (c.caseId === caseId ? { ...c, ...updates } : c))
    );
    try {
      await fetch('/api/case/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseId, ...updates }),
      });
    } catch (err) {
      console.error('Error updating case:', err);
    }
  };

  // 9. Watchlist Actions (Admin only)
  const handleAddWatchlist = async (item: any) => {
    try {
      const res = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add', item }),
      });
      if (res.ok) {
        await refreshData();
      }
    } catch (err) {
      console.error('Watchlist add error:', err);
    }
  };

  const handleRemoveWatchlist = async (id: string) => {
    try {
      const res = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'remove', item: { id } }),
      });
      if (res.ok) {
        await refreshData();
      }
    } catch (err) {
      console.error('Watchlist remove error:', err);
    }
  };

  // 10. Case Full Export (Admin only)
  const handleExportCase = async (caseId: string) => {
    try {
      const res = await fetch(`/api/case/export/${caseId}`);
      if (!res.ok) {
        alert('Case export restricted to Administrator clearance.');
        return;
      }
      const bundle = await res.json();
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(bundle, null, 2));
      const dlAnchor = document.createElement('a');
      dlAnchor.setAttribute('href', dataStr);
      dlAnchor.setAttribute('download', `SENTINEL_CASE_EXPORT_${caseId}.json`);
      document.body.appendChild(dlAnchor);
      dlAnchor.click();
      dlAnchor.remove();
      await refreshData();
    } catch (err) {
      console.error('Export error:', err);
    }
  };

  // Log client search query to server audit log
  const handleLogSearch = async (query: string) => {
    try {
      await fetch('/api/audit/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SEARCH_SIGHTINGS',
          details: `Executed search for query: "${query}"`,
        }),
      });
      await refreshData();
    } catch {
      // ignore
    }
  };

  // Navigation Helpers
  const handleOpenEvidence = (sightingId: string) => {
    setSelectedSightingId(sightingId);
    setCurrentScreen('evidence');
  };

  const handleOpenMapForCase = (caseId: string) => {
    setSelectedCaseId(caseId);
    setCurrentScreen('map');
  };

  const handleOpenCaseDossier = (caseId: string) => {
    setSelectedCaseId(caseId);
    setCurrentScreen('cases');
  };

  const handleQuickSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentScreen('search');
    handleLogSearch(query);
  };

  // Loading screen during initial session verification
  useEffect(()=>{const key=(e:KeyboardEvent)=>{const el=e.target as HTMLElement;if(['INPUT','TEXTAREA','SELECT'].includes(el?.tagName))return;const idx=sightings.findIndex(s=>s.id===selectedSightingId);if(e.key==='/'){e.preventDefault();setCurrentScreen('search');setTimeout(()=>document.getElementById('global-search')?.focus(),0)}else if(e.key==='?'){alert('Keyboard shortcuts: J/K next/previous sighting, C confirm, R reject with reason, / focus search.')}else if(e.key.toLowerCase()==='j'&&sightings.length)setSelectedSightingId(sightings[(idx+1+sightings.length)%sightings.length].id);else if(e.key.toLowerCase()==='k'&&sightings.length)setSelectedSightingId(sightings[(idx-1+sightings.length)%sightings.length].id);else if(e.key.toLowerCase()==='c'&&selectedSightingId)handleUpdateDecision(selectedSightingId,'confirmed');else if(e.key.toLowerCase()==='r'&&selectedSightingId){const reason=prompt('Reason for rejecting this sighting:');if(reason?.trim())handleUpdateDecision(selectedSightingId,'rejected',reason.trim())}};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key)},[sightings,selectedSightingId]);
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-[#F4F3EF] text-[#171B1F] flex items-center justify-center font-sans text-xs">
        <div className="bg-white p-6 rounded-[4px] border border-[#DCDAD4] text-center space-y-3 max-w-sm w-full mx-4">
          <div className="w-8 h-8 border-2 border-[#171B1F] border-t-transparent rounded-full animate-spin mx-auto" />
          <div className="font-semibold text-sm text-[#171B1F]">Connecting to Maharashtra Police CCTV Grid</div>
          <p className="text-xs text-[#88857C]">Synchronizing municipal surveillance telemetry...</p>
        </div>
      </div>
    );
  }

  // If not logged in, render Login screen
  if (!userSession) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  const activeAlertsCount = alerts.filter((a) => a.status === 'active').length;


  return (
    <div className="min-h-screen flex bg-[#F4F3EF] text-[#171B1F]">
      {/* Graphite Sidebar (#171B1F) */}
      <NavigationSidebar
        currentScreen={currentScreen}
        onNavigate={(screen) => setCurrentScreen(screen)}
        userSession={userSession}
        onLogout={handleLogout}
        activeAlertsCount={activeAlertsCount}
        cameras={cameras}
        isMobileOpen={isMobileNavOpen}
        onCloseMobile={() => setIsMobileNavOpen(false)}
      />

      {/* Main Content Workspace Column (#F4F3EF) */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <WorkspaceHeader
          currentScreen={currentScreen}
          onOpenMobileNav={() => setIsMobileNavOpen(true)}
          activeAlertsCount={activeAlertsCount}
          userSession={userSession}
          cameras={cameras}
        />

        <main className="flex-1 p-4 md:p-6 max-w-[1600px] w-full mx-auto">
          {/* 1. Dashboard */}
          {currentScreen === 'dashboard' && (
            <DashboardView
              cameras={cameras}
              sightings={sightings}
              cases={cases}
              onOpenCase={handleOpenCaseDossier}
              onQuickSearch={handleQuickSearch}
              onOpenMapForCase={handleOpenMapForCase}
            />
          )}

          {/* 2. Real Leaflet Map */}
          {currentScreen === 'map' && (
            <RealLeafletMap
              cameras={cameras}
              sightings={sightings}
              cases={cases}
              selectedCaseId={selectedCaseId}
              onSelectCase={(caseId) => setSelectedCaseId(caseId)}
              onOpenEvidence={handleOpenEvidence}
            />
          )}

          {/* 3. Search */}
          {currentScreen === 'search' && (
            <SearchView
              cameras={cameras}
              sightings={sightings}
              initialSearchQuery={searchQuery}
              onSelectSighting={handleOpenEvidence}
              onLogSearch={handleLogSearch}
            />
          )}

          {/* 4. Cases */}
          {currentScreen === 'cases' && (
            <CasesView
              cases={cases}
              sightings={sightings}
              cameras={cameras}
              userRole={userSession.role}
              onSelectCaseForMap={handleOpenMapForCase}
              onOpenEvidence={handleOpenEvidence}
              onUpdateCase={handleUpdateCase}
              onExportCase={handleExportCase}
            />
          )}

          {/* 5. Alerts & Watchlist */}
          {currentScreen === 'alerts' && (
            <AlertsView
              watchlist={watchlist}
              alerts={alerts}
              sightings={sightings}
              userRole={userSession.role}
              onAcknowledgeAlert={handleAcknowledgeAlert}
              onSimulateSighting={handleSimulateSighting}
              onAddWatchlist={handleAddWatchlist}
              onRemoveWatchlist={handleRemoveWatchlist}
              onOpenEvidence={handleOpenEvidence}
            />
          )}

          {/* 6. Evidence View */}
          {currentScreen === 'evidence' && (
            <CaseDetailView
              sightingId={selectedSightingId}
              cameras={cameras}
              sightings={sightings}
              cases={cases}
              userSession={userSession}
              onBackToSearch={() => setCurrentScreen('search')}
              onUpdateDecision={handleUpdateDecision}
              onOpenMapForCase={handleOpenMapForCase}
            />
          )}

          {currentScreen === 'evidence-manager' && userSession.role === 'Admin' && <EvidenceManager sightings={sightings} cameras={cameras} />}

          {/* 7. Activity Log & Audit Trail (Admin) */}
          {currentScreen === 'activity' && (
            <ActivityLogView 
              activityLog={activityLog} 
              userRole={userSession.role}
              onResetDemoData={userSession.role === 'Admin' ? handleResetDemoData : undefined}
            />
          )}
        </main>

        {/* Operational Disclaimer Footer */}
        <FooterBar />
      </div>
    </div>
  );
}

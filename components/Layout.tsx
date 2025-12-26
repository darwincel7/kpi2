import React, { useState } from 'react';
import { User, Role } from '../types';
import { 
  LayoutDashboard, 
  PlusCircle, 
  Trophy, 
  Users, 
  Settings, 
  LogOut, 
  Menu,
  X,
  TrendingUp
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentUser: User;
  currentView: string;
  onNavigate: (view: string) => void;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentUser, currentView, onNavigate, onLogout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const NavItem = ({ view, icon: Icon, label }: { view: string, icon: any, label: string }) => (
    <button
      onClick={() => {
        onNavigate(view);
        setIsMobileMenuOpen(false);
      }}
      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
        currentView === view 
          ? 'bg-blue-600 text-white shadow-md' 
          : 'text-slate-600 hover:bg-slate-100'
      }`}
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-slate-200 p-4 flex justify-between items-center sticky top-0 z-20">
        <div className="flex items-center space-x-2">
          <div className="bg-blue-600 text-white p-1.5 rounded-lg font-bold">DC</div>
          <span className="font-bold text-slate-800">Darwin Cell</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-slate-600">
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 border-b border-slate-100 flex flex-col items-center">
          <img 
            src={currentUser.avatar} 
            alt={currentUser.name} 
            className="w-16 h-16 rounded-full border-2 border-blue-100 mb-3"
          />
          <h2 className="font-bold text-slate-800">{currentUser.name}</h2>
          <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-wide">
            {currentUser.role === Role.ADMIN ? 'Gerencia' : 'Colaboradora'}
          </span>
        </div>

        <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
          {currentUser.role === Role.ADMIN ? (
            <>
              <NavItem view="dashboard-admin" icon={LayoutDashboard} label="Dashboard General" />
              <NavItem view="ranking" icon={Trophy} label="Ranking & Bonos" />
              <NavItem view="staff" icon={Users} label="Colaboradoras" />
              <NavItem view="audit" icon={Settings} label="Auditoría / Reglas" />
            </>
          ) : (
            <>
              <NavItem view="my-progress" icon={TrendingUp} label="Mi Progreso" />
              <NavItem view="daily-entry" icon={PlusCircle} label="Registro Diario" />
            </>
          )}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button 
            onClick={onLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto h-screen p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
      
      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;
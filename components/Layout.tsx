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
  TrendingUp,
  ChevronRight
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

  const NavItem = ({ view, icon: Icon, label }: { view: string, icon: any, label: string }) => {
    const isActive = currentView === view;
    return (
      <button
        onClick={() => {
          onNavigate(view);
          setIsMobileMenuOpen(false);
        }}
        className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-300 group ${
          isActive 
            ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/30' 
            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
        }`}
      >
        <div className="flex items-center space-x-3">
          <Icon size={20} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-primary-600'} />
          <span className={`font-semibold text-sm tracking-wide ${isActive ? '' : 'group-hover:translate-x-1 transition-transform'}`}>{label}</span>
        </div>
        {isActive && <ChevronRight size={16} className="text-white opacity-50" />}
      </button>
    );
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#f8fafc]">
      {/* Mobile Header */}
      <div className="md:hidden bg-white/80 backdrop-blur-md border-b border-slate-200 p-4 flex justify-between items-center sticky top-0 z-40">
        <div className="flex items-center space-x-2">
          <div className="bg-gradient-to-br from-primary-600 to-indigo-700 text-white p-1.5 rounded-lg font-bold shadow-lg shadow-indigo-500/30">DC</div>
          <span className="font-bold text-slate-800 tracking-tight">Darwin Cell</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-72 bg-white border-r border-slate-100 transform transition-transform duration-500 cubic-bezier(0.16, 1, 0.3, 1)
        md:relative md:translate-x-0 shadow-2xl md:shadow-none flex flex-col
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Brand Section */}
        <div className="p-8 hidden md:flex items-center space-x-3">
           <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-indigo-700 rounded-xl flex items-center justify-center text-white font-extrabold text-lg shadow-lg shadow-indigo-500/20">DC</div>
           <div>
             <h1 className="font-bold text-slate-900 tracking-tight text-lg leading-none">Darwin Cell</h1>
             <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest">Performance</span>
           </div>
        </div>

        {/* User Profile Snippet */}
        <div className="px-6 pb-6 pt-2 md:pt-0">
           <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center space-x-3">
              <img 
                src={currentUser.avatar} 
                alt={currentUser.name} 
                className="w-10 h-10 rounded-full border-2 border-white shadow-sm object-cover"
              />
              <div className="overflow-hidden">
                <h2 className="font-bold text-slate-800 text-sm truncate">{currentUser.name}</h2>
                <span className="text-xs font-semibold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full inline-block mt-1">
                  {currentUser.role === Role.ADMIN ? 'Gerencia' : 'Staff'}
                </span>
              </div>
           </div>
        </div>

        <nav className="px-4 space-y-1.5 flex-1 overflow-y-auto custom-scrollbar">
          <div className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Menú Principal</div>
          {currentUser.role === Role.ADMIN ? (
            <>
              <NavItem view="dashboard-admin" icon={LayoutDashboard} label="Dashboard General" />
              <NavItem view="ranking" icon={Trophy} label="Ranking & Bonos" />
              <NavItem view="staff" icon={Users} label="Colaboradoras" />
              <div className="pt-4 pb-2">
                 <div className="px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Sistema</div>
              </div>
              <NavItem view="audit" icon={Settings} label="Configuración" />
            </>
          ) : (
            <>
              <NavItem view="my-progress" icon={TrendingUp} label="Mi Progreso" />
              <NavItem view="daily-entry" icon={PlusCircle} label="Registro Diario" />
            </>
          )}
        </nav>

        <div className="p-6 border-t border-slate-50">
          <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 font-medium text-sm group"
          >
            <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto h-screen relative scroll-smooth">
        {/* Top Fade Gradient */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-slate-50/50 to-transparent pointer-events-none z-10" />
        
        <div className="max-w-7xl mx-auto p-4 md:p-10 relative z-20">
          {children}
        </div>
      </main>
      
      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-20 md:hidden transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;
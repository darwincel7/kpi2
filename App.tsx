import React, { useState } from 'react';
import { User, Role } from './types';
import { USERS } from './constants';
import Layout from './components/Layout';
import DashboardAdmin from './pages/DashboardAdmin';
import MyProgress from './pages/MyProgress';
import DailyEntryForm from './pages/DailyEntryForm';
import Ranking from './pages/Ranking';
import StaffManagement from './pages/StaffManagement';
import SettingsAudit from './pages/SettingsAudit';
import { Lock, ArrowRight, X, User as UserIcon } from 'lucide-react';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<string>('dashboard-admin');
  
  // Login State
  const [selectedLoginUser, setSelectedLoginUser] = useState<User | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');

  // Simple Router Logic
  const renderView = () => {
    if (!currentUser) return null;

    switch (currentView) {
      case 'dashboard-admin':
        return <DashboardAdmin />;
      case 'ranking':
        return <Ranking />;
      case 'my-progress':
        return <MyProgress user={currentUser} />;
      case 'daily-entry':
        return <DailyEntryForm user={currentUser} onComplete={() => setCurrentView('my-progress')} />;
      case 'staff':
        return <StaffManagement />;
      case 'audit':
        return <SettingsAudit />;
      default:
        return <DashboardAdmin />;
    }
  };

  const attemptLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoginUser) return;

    if (passwordInput === selectedLoginUser.password) {
      setCurrentUser(selectedLoginUser);
      // Set default view based on role
      setCurrentView(selectedLoginUser.role === Role.ADMIN ? 'dashboard-admin' : 'my-progress');
      // Reset login state
      setSelectedLoginUser(null);
      setPasswordInput('');
      setLoginError('');
    } else {
      setLoginError('Contraseña incorrecta');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  // Login Screen
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 left-0 w-full h-64 bg-blue-600 rounded-b-[3rem] shadow-2xl z-0"></div>
        
        <div className="max-w-4xl w-full bg-white rounded-3xl shadow-2xl p-8 md:p-12 animate-fade-in z-10 grid grid-cols-1 md:grid-cols-2 gap-12">
          
          {/* Left Column: Brand & Intro */}
          <div className="flex flex-col justify-center text-center md:text-left">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 text-white text-3xl font-bold rounded-2xl mb-6 shadow-xl shadow-blue-200 mx-auto md:mx-0">
              DC
            </div>
            <h1 className="text-4xl font-extrabold text-slate-800 mb-4 tracking-tight">Darwin Cell</h1>
            <p className="text-slate-500 text-lg leading-relaxed mb-8">
              Sistema de gestión de alto rendimiento. Controla tus KPIs, maximiza tus bonos y alcanza tus metas diarias.
            </p>
            <div className="hidden md:flex space-x-2 text-sm text-slate-400">
               <span className="bg-slate-100 px-3 py-1 rounded-full">v1.0.0 Stable</span>
               <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full">Secure Login</span>
            </div>
          </div>

          {/* Right Column: User Selection or Password */}
          <div className="flex flex-col justify-center">
            
            {!selectedLoginUser ? (
              // Step 1: Select User
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-slate-800 mb-2">Selecciona tu perfil</h2>
                <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {USERS.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => {
                        setSelectedLoginUser(user);
                        setLoginError('');
                      }}
                      className="flex items-center p-3 border border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group w-full text-left"
                    >
                      <img 
                        src={user.avatar} 
                        alt={user.name} 
                        className="w-12 h-12 rounded-full border-2 border-slate-100 mr-4 group-hover:border-blue-200"
                      />
                      <div className="flex-1">
                        <p className="font-bold text-slate-800 group-hover:text-blue-700">{user.name}</p>
                        <p className="text-xs text-slate-500 uppercase font-semibold">
                          {user.role === Role.ADMIN ? 'Gerencia' : 'Staff'}
                        </p>
                      </div>
                      <ArrowRight size={18} className="text-slate-300 group-hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              // Step 2: Enter Password
              <div className="animate-fade-in">
                <button 
                  onClick={() => setSelectedLoginUser(null)}
                  className="text-sm text-slate-500 hover:text-slate-800 mb-6 flex items-center transition-colors"
                >
                  <ArrowRight className="rotate-180 mr-1" size={16} /> Volver a lista
                </button>
                
                <div className="text-center mb-6">
                  <img 
                    src={selectedLoginUser.avatar} 
                    alt={selectedLoginUser.name} 
                    className="w-20 h-20 rounded-full border-4 border-white shadow-lg mx-auto mb-3"
                  />
                  <h2 className="text-xl font-bold text-slate-800">{selectedLoginUser.name}</h2>
                  <p className="text-sm text-slate-500">Ingresa tu clave para continuar</p>
                </div>

                <form onSubmit={attemptLogin} className="space-y-4">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock size={18} />
                    </div>
                    <input
                      type="password"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 rounded-xl border ${loginError ? 'border-red-500 focus:ring-red-200' : 'border-slate-200 focus:ring-blue-200'} focus:outline-none focus:ring-4 transition-all`}
                      placeholder="Contraseña..."
                      autoFocus
                    />
                  </div>
                  
                  {loginError && (
                    <div className="text-red-500 text-sm font-medium flex items-center justify-center">
                      <X size={14} className="mr-1" /> {loginError}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-200 transition-all transform active:scale-95"
                  >
                    Iniciar Sesión
                  </button>
                </form>
                
                <div className="mt-6 text-center">
                  <p className="text-xs text-slate-400">
                    Claves Demo: Admin="admin", Staff="123"
                  </p>
                </div>
              </div>
            )}
            
          </div>
        </div>
      </div>
    );
  }

  return (
    <Layout 
      currentUser={currentUser} 
      currentView={currentView} 
      onNavigate={setCurrentView}
      onLogout={handleLogout}
    >
      {renderView()}
    </Layout>
  );
};

export default App;
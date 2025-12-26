import React, { useState, useEffect } from 'react';
import { User, Role } from './types';
import { fetchUsers, createAuditLog } from './services/kpiService';
import Layout from './components/Layout';
import DashboardAdmin from './pages/DashboardAdmin';
import MyProgress from './pages/MyProgress';
import DailyEntryForm from './pages/DailyEntryForm';
import Ranking from './pages/Ranking';
import StaffManagement from './pages/StaffManagement';
import SettingsAudit from './pages/SettingsAudit';
import { Lock, ArrowRight, X, User as UserIcon, Loader2, ShieldCheck, Sparkles } from 'lucide-react';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<string>('dashboard-admin');
  
  // Data State
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // Login State
  const [selectedLoginUser, setSelectedLoginUser] = useState<User | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');

  // Navigation State (To pass data between views)
  const [adminSelectedStaffId, setAdminSelectedStaffId] = useState<string | null>(null);
  // State for Admin filling entry for another user
  const [entryTargetUser, setEntryTargetUser] = useState<User | null>(null);

  useEffect(() => {
    const init = async () => {
      setLoadingUsers(true);
      const fetchedUsers = await fetchUsers();
      setUsers(fetchedUsers);
      
      // Attempt to restore session
      try {
        const savedUserJson = localStorage.getItem('darwin_session_user');
        if (savedUserJson) {
          const savedUser = JSON.parse(savedUserJson);
          // Verify the user still exists in the latest fetch (security/consistency check)
          const validUser = fetchedUsers.find(u => u.id === savedUser.id);
          
          if (validUser) {
            setCurrentUser(validUser);
            // Restore last view if needed, or default based on role
            setCurrentView(validUser.role === Role.ADMIN ? 'dashboard-admin' : 'my-progress');
          } else {
            localStorage.removeItem('darwin_session_user');
          }
        }
      } catch (e) {
        console.error("Session restore failed", e);
        localStorage.removeItem('darwin_session_user');
      }
      
      setLoadingUsers(false);
    };
    init();
  }, []);

  const handleAdminNavigateToStaff = (userId: string) => {
    setAdminSelectedStaffId(userId);
    setCurrentView('staff');
  };

  const handleAdminCreateEntry = (user: User) => {
      setEntryTargetUser(user);
      setCurrentView('daily-entry');
  };

  // Simple Router Logic
  const renderView = () => {
    if (!currentUser) return null;

    switch (currentView) {
      case 'dashboard-admin':
        return <DashboardAdmin onViewStaff={handleAdminNavigateToStaff} />;
      case 'ranking':
        return <Ranking />;
      case 'my-progress':
        return <MyProgress user={currentUser} />;
      case 'daily-entry':
        return (
            <DailyEntryForm 
                user={entryTargetUser || currentUser} 
                onComplete={() => {
                    setEntryTargetUser(null);
                    // Redirect back to appropriate view
                    setCurrentView(currentUser.role === Role.ADMIN ? 'staff' : 'my-progress');
                }} 
            />
        );
      case 'staff':
        return (
          <StaffManagement 
            currentUser={currentUser}
            initialUserId={adminSelectedStaffId} 
            onClearInitial={() => setAdminSelectedStaffId(null)}
            onCreateEntry={handleAdminCreateEntry}
          />
        );
      case 'audit':
        return <SettingsAudit currentUser={currentUser} />;
      default:
        return <DashboardAdmin onViewStaff={handleAdminNavigateToStaff} />;
    }
  };

  const attemptLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoginUser) return;

    if (passwordInput === selectedLoginUser.password) {
      setCurrentUser(selectedLoginUser);
      // Save session
      localStorage.setItem('darwin_session_user', JSON.stringify(selectedLoginUser));
      
      createAuditLog('Inicio de Sesión', selectedLoginUser.name, 'Ingreso exitoso al sistema');
      
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
    setAdminSelectedStaffId(null);
    setEntryTargetUser(null);
    localStorage.removeItem('darwin_session_user');
  };

  // High-End Login Screen
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden font-sans">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 bg-slate-900">
           <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse"></div>
           <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[120px] animate-pulse" style={{animationDelay: '2s'}}></div>
        </div>

        <div className="w-full max-w-5xl bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl shadow-black/50 overflow-hidden flex flex-col md:flex-row relative z-10 animate-fade-in">
          
          {/* Left Panel: Brand */}
          <div className="md:w-1/2 p-10 md:p-16 flex flex-col justify-between bg-gradient-to-br from-indigo-600/90 to-violet-700/90 text-white relative overflow-hidden">
            {/* Texture overlay */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            
            <div className="relative z-10">
              <div className="flex items-center space-x-3 mb-8">
                 <div className="bg-white text-indigo-700 p-2 rounded-xl font-black text-xl shadow-lg">DC</div>
                 <span className="text-xl font-bold tracking-tight">Darwin Cell</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
                Rendimiento <br/>
                <span className="text-indigo-200">Inteligente.</span>
              </h1>
              <p className="text-indigo-100 text-lg leading-relaxed max-w-sm">
                Plataforma de gestión de KPIs diseñada para equipos de alto impacto. Monitorea, analiza y crece.
              </p>
            </div>
            
            <div className="relative z-10 mt-12 flex items-center space-x-4">
               <div className="flex -space-x-3">
                  <img className="w-10 h-10 rounded-full border-2 border-indigo-500" src="https://picsum.photos/id/64/100" alt=""/>
                  <img className="w-10 h-10 rounded-full border-2 border-indigo-500" src="https://picsum.photos/id/65/100" alt=""/>
                  <img className="w-10 h-10 rounded-full border-2 border-indigo-500" src="https://picsum.photos/id/66/100" alt=""/>
               </div>
               <div className="text-sm font-medium text-indigo-100">
                  <p>Usado por el equipo líder</p>
               </div>
            </div>
          </div>

          {/* Right Panel: Login Form */}
          <div className="md:w-1/2 bg-white p-10 md:p-16 flex flex-col justify-center">
            
            <div className="mb-8">
               <h2 className="text-2xl font-bold text-slate-800 mb-2">Bienvenido de nuevo</h2>
               <p className="text-slate-500">Accede a tu panel de control personal.</p>
            </div>

            {loadingUsers ? (
               <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <Loader2 className="animate-spin text-indigo-600" size={40} />
                  <p className="text-slate-400 font-medium animate-pulse">Sincronizando equipo...</p>
               </div>
            ) : !selectedLoginUser ? (
              // Step 1: User List
              <div className="space-y-4 animate-slide-up">
                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                  {users.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => {
                        setSelectedLoginUser(user);
                        setLoginError('');
                      }}
                      className="w-full flex items-center p-3 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50 hover:shadow-md transition-all group text-left"
                    >
                      <div className="relative">
                        <img 
                            src={user.avatar} 
                            alt={user.name} 
                            className="w-12 h-12 rounded-full border-2 border-slate-100 group-hover:border-indigo-200 object-cover"
                        />
                        <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${user.role === Role.ADMIN ? 'bg-indigo-500' : 'bg-emerald-500'}`}></div>
                      </div>
                      <div className="ml-4 flex-1">
                        <p className="font-bold text-slate-800 group-hover:text-indigo-700 transition-colors">{user.name}</p>
                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                          {user.role === Role.ADMIN ? 'Administración' : 'Ventas & Staff'}
                        </p>
                      </div>
                      <ArrowRight size={18} className="text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              // Step 2: Password
              <div className="animate-fade-in w-full">
                <button 
                  onClick={() => setSelectedLoginUser(null)}
                  className="mb-8 flex items-center text-sm text-slate-400 hover:text-indigo-600 transition-colors group"
                >
                  <ArrowRight className="rotate-180 mr-2 group-hover:-translate-x-1 transition-transform" size={16} /> 
                  Elegir otro usuario
                </button>
                
                <div className="flex items-center space-x-4 mb-8">
                  <img 
                    src={selectedLoginUser.avatar} 
                    alt={selectedLoginUser.name} 
                    className="w-16 h-16 rounded-full border-2 border-indigo-100 shadow-md object-cover"
                  />
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">{selectedLoginUser.name}</h3>
                    <p className="text-sm text-indigo-600 font-medium flex items-center">
                        <ShieldCheck size={14} className="mr-1" />
                        Acceso Seguro
                    </p>
                  </div>
                </div>

                <form onSubmit={attemptLogin} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Contraseña</label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                        <Lock size={18} />
                        </div>
                        <input
                        type="password"
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        className={`w-full pl-11 pr-4 py-3.5 rounded-xl border bg-slate-50 font-medium text-slate-800 placeholder-slate-400 focus:bg-white transition-all outline-none focus:ring-4 focus:ring-indigo-100 ${loginError ? 'border-red-500' : 'border-slate-200 focus:border-indigo-500'}`}
                        placeholder="••••••••"
                        autoFocus
                        />
                    </div>
                  </div>
                  
                  {loginError && (
                    <div className="text-red-500 text-sm font-medium flex items-center bg-red-50 p-3 rounded-lg animate-fade-in">
                      <X size={16} className="mr-2" /> {loginError}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300 transition-all transform active:scale-[0.98] flex justify-center items-center"
                  >
                    <span>Ingresar al Sistema</span>
                    <ArrowRight size={20} className="ml-2" />
                  </button>
                </form>
              </div>
            )}
            
            <div className="mt-auto pt-8 text-center">
                <p className="text-xs text-slate-400">
                    &copy; 2024 Darwin Cell Enterprise. Secure System.
                </p>
            </div>
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
import React, { useState, useEffect } from 'react';
import { TARGETS as DEFAULT_TARGETS } from '../constants';
import { Role, User, Target } from '../types';
import { fetchEntriesByUser, getAggregatedStats, calculateScore, fetchUsers, createUser, deleteUser, updateUser, fetchTargets, createAuditLog } from '../services/kpiService';
import { Search, Mail, Phone, ChevronRight, BarChart2, MoreVertical, X, Plus, UserPlus, Trash2, Loader2, Shield, Lock, Edit2, ClipboardPlus } from 'lucide-react';
import MyProgress from './MyProgress';

interface StaffManagementProps {
  currentUser: User;
  initialUserId?: string | null;
  onClearInitial?: () => void;
  onCreateEntry?: (user: User) => void;
}

const StaffManagement: React.FC<StaffManagementProps> = ({ currentUser, initialUserId, onClearInitial, onCreateEntry }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [targets, setTargets] = useState<Target>(DEFAULT_TARGETS);
  const [loading, setLoading] = useState(true);
  
  // Create/Edit User Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [userFormData, setUserFormData] = useState({
      name: '',
      role: Role.STAFF,
      password: '',
      avatar: 'https://picsum.photos/200'
  });
  const [submitting, setSubmitting] = useState(false);

  // We need a small local cache of user stats to render the cards efficiently
  const [userStatsCache, setUserStatsCache] = useState<Record<string, { recentScore: number, totalAmount: number }>>({});

  const loadData = async () => {
    setLoading(true);
    const [fetchedUsers, fetchedTargets] = await Promise.all([
        fetchUsers(),
        fetchTargets()
    ]);
    setUsers(fetchedUsers);
    setTargets(fetchedTargets);
    
    // Process stats
    const cache: Record<string, any> = {};
    const staff = fetchedUsers.filter(u => u.role === Role.STAFF);
    
    await Promise.all(staff.map(async (u) => {
        const entries = await fetchEntriesByUser(u.id);
        const stats = getAggregatedStats(entries);
        let scoreSum = 0;
        entries.slice(-7).forEach(e => scoreSum += calculateScore(e, fetchedTargets).totalScore); 
        const recentAvgScore = entries.slice(-7).length ? Math.round(scoreSum / entries.slice(-7).length) : 0;
        
        cache[u.id] = {
            recentScore: recentAvgScore,
            totalAmount: stats.totalAmount
        };
    }));
    setUserStatsCache(cache);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (initialUserId && users.length > 0) {
        const user = users.find(u => u.id === initialUserId);
        if (user) {
            setSelectedUser(user);
        }
        if (onClearInitial) onClearInitial();
    }
  }, [initialUserId, onClearInitial, users]);

  const openCreateModal = () => {
      setEditingUserId(null);
      setUserFormData({ name: '', role: Role.STAFF, password: '', avatar: `https://picsum.photos/200?random=${Date.now()}` });
      setIsModalOpen(true);
  };

  const openEditModal = (e: React.MouseEvent, user: User) => {
      e.stopPropagation();
      setEditingUserId(user.id);
      setUserFormData({
          name: user.name,
          role: user.role,
          password: user.password || '',
          avatar: user.avatar || ''
      });
      setIsModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitting(true);
      try {
          if (editingUserId) {
              await updateUser({ id: editingUserId, ...userFormData } as User);
              await createAuditLog('Usuario Editado', currentUser.name, `Actualización: ${userFormData.name}`);
          } else {
              await createUser(userFormData);
              await createAuditLog('Usuario Creado', currentUser.name, `Nuevo usuario: ${userFormData.name} (${userFormData.role})`);
          }
          setIsModalOpen(false);
          await loadData();
      } catch (error) {
          alert("Error al guardar usuario");
      } finally {
          setSubmitting(false);
      }
  };

  const handleDeleteUser = async (e: React.MouseEvent, id: string, name: string) => {
      e.stopPropagation();
      if(confirm(`¿Estás seguro de eliminar a ${name}? Esta acción no se puede deshacer.`)) {
          await deleteUser(id);
          await createAuditLog('Usuario Eliminado', currentUser.name, `Usuario eliminado: ${name}`);
          await loadData();
      }
  };

  const staffUsers = users.filter(u => u.role === Role.STAFF).filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (selectedUser) {
      return (
          <div className="animate-fade-in">
              <div className="mb-6 flex items-center justify-between">
                  <button 
                    onClick={() => setSelectedUser(null)}
                    className="flex items-center text-slate-500 hover:text-blue-600 font-medium transition-colors bg-white px-4 py-2 rounded-lg border border-slate-200 hover:border-blue-200"
                  >
                      <X className="mr-1" size={18} /> Volver a la lista
                  </button>
                  <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm font-bold flex items-center border border-blue-100">
                      <BarChart2 size={16} className="mr-2" />
                      Viendo perfil de: {selectedUser.name}
                  </div>
              </div>
              <div className="border-t border-slate-200 pt-6">
                 <MyProgress user={selectedUser} />
              </div>
          </div>
      );
  }

  if (loading && users.length === 0) return <div className="flex justify-center py-10"><Loader2 className="animate-spin text-blue-600" /></div>;

  return (
    <div className="space-y-6 animate-fade-in relative">
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Directorio de Colaboradoras</h1>
          <p className="text-slate-500">Administra el acceso y visualiza el rendimiento individual.</p>
        </div>
        <div className="mt-4 md:mt-0 w-full md:w-auto relative flex gap-3">
             <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Buscar..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-100 outline-none w-full md:w-64"
                />
            </div>
            <button 
                onClick={openCreateModal}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-bold flex items-center transition-colors"
            >
                <Plus size={18} className="mr-2" /> Nuevo
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {staffUsers.map(user => {
            const stats = userStatsCache[user.id] || { recentScore: 0, totalAmount: 0 };

            return (
                <div key={user.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow group relative">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center space-x-4">
                            <img src={user.avatar} className="w-14 h-14 rounded-full border-2 border-white shadow-sm" alt={user.name} />
                            <div>
                                <h3 className="font-bold text-slate-800">{user.name}</h3>
                                <span className="inline-block bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-bold">Activo</span>
                            </div>
                        </div>
                        <div className="flex space-x-1">
                            {onCreateEntry && (
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onCreateEntry(user); }}
                                    className="text-slate-300 hover:text-green-500 hover:bg-green-50 p-2 rounded-full transition-colors"
                                    title="Nuevo Reporte Diario"
                                >
                                    <ClipboardPlus size={18} />
                                </button>
                            )}
                            <button 
                                onClick={(e) => openEditModal(e, user)}
                                className="text-slate-300 hover:text-blue-500 hover:bg-blue-50 p-2 rounded-full transition-colors"
                                title="Editar Usuario"
                            >
                                <Edit2 size={18} />
                            </button>
                            <button 
                                onClick={(e) => handleDeleteUser(e, user.id, user.name)}
                                className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors"
                                title="Eliminar Usuario"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-slate-50 p-3 rounded-xl text-center">
                            <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Score Semanal</p>
                            <p className={`text-xl font-bold ${stats.recentScore >= 80 ? 'text-green-600' : 'text-orange-500'}`}>{stats.recentScore}</p>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-xl text-center">
                            <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Ventas Mes</p>
                            <p className="text-xl font-bold text-blue-600">RD$ {(stats.totalAmount/1000).toFixed(0)}k</p>
                        </div>
                    </div>

                    <div className="flex items-center justify-between text-sm text-slate-500 mb-6 space-x-2">
                         <div className="flex items-center text-xs bg-slate-100 px-2 py-1 rounded">
                             <Lock size={12} className="mr-1" /> Pass: {user.password}
                         </div>
                    </div>

                    <button 
                        onClick={() => setSelectedUser(user)}
                        className="w-full py-3 rounded-xl bg-slate-50 text-slate-700 font-bold hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center group-hover:shadow-lg"
                    >
                        Ver Rendimiento Detallado
                        <ChevronRight size={16} className="ml-2 opacity-50" />
                    </button>
                </div>
            );
        })}

        {/* Add New Card Button */}
        <button 
            onClick={openCreateModal}
            className="border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center text-slate-400 hover:border-blue-300 hover:text-blue-500 transition-all min-h-[300px]"
        >
            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4 group-hover:bg-blue-50 transition-colors">
                <UserPlus size={32} />
            </div>
            <span className="font-medium text-lg">Agregar Nueva Colaboradora</span>
        </button>
      </div>

      {/* CREATE/EDIT MODAL */}
      {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black bg-opacity-40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md z-10 animate-fade-in p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-slate-800 text-xl flex items-center">
                        {editingUserId ? <Edit2 className="mr-2 text-blue-600" /> : <UserPlus className="mr-2 text-blue-600" />}
                        {editingUserId ? 'Editar Usuario' : 'Nueva Usuario'}
                    </h3>
                    <button onClick={() => setIsModalOpen(false)}><X className="text-slate-400 hover:text-slate-600" /></button>
                </div>
                <form onSubmit={handleSaveUser} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Nombre Completo</label>
                        <input type="text" required className="w-full border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500" value={userFormData.name} onChange={e => setUserFormData({...userFormData, name: e.target.value})} placeholder="Ej. Maria Pérez" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Rol</label>
                        <select className="w-full border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500" value={userFormData.role} onChange={e => setUserFormData({...userFormData, role: e.target.value as Role})}>
                            <option value={Role.STAFF}>Vendedora (Staff)</option>
                            <option value={Role.ADMIN}>Administradora</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Contraseña de Acceso</label>
                        <input type="text" required className="w-full border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500" value={userFormData.password} onChange={e => setUserFormData({...userFormData, password: e.target.value})} placeholder="Ej. 1234" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Avatar URL (Opcional)</label>
                        <input type="text" className="w-full border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500" value={userFormData.avatar} onChange={e => setUserFormData({...userFormData, avatar: e.target.value})} placeholder="https://..." />
                    </div>
                    <button type="submit" disabled={submitting} className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 mt-4 disabled:opacity-50 flex justify-center">
                        {submitting ? <Loader2 className="animate-spin" /> : (editingUserId ? 'Guardar Cambios' : 'Crear Usuario')}
                    </button>
                </form>
            </div>
          </div>
      )}
    </div>
  );
};

export default StaffManagement;
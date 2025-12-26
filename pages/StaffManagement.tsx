import React, { useState } from 'react';
import { USERS, MOCK_HISTORY, TARGETS } from '../constants';
import { Role, User } from '../types';
import { getEntriesByUser, getAggregatedStats, calculateScore } from '../services/kpiService';
import { Search, Mail, Phone, ChevronRight, BarChart2, MoreVertical, X } from 'lucide-react';
import MyProgress from './MyProgress';

const StaffManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const staffUsers = USERS.filter(u => u.role === Role.STAFF).filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // If a user is selected, show their "MyProgress" view in a wrapper
  if (selectedUser) {
      return (
          <div className="animate-fade-in">
              <div className="mb-6 flex items-center justify-between">
                  <button 
                    onClick={() => setSelectedUser(null)}
                    className="flex items-center text-slate-500 hover:text-blue-600 font-medium transition-colors"
                  >
                      <X className="mr-1" size={20} /> Volver a la lista
                  </button>
                  <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm font-bold flex items-center">
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Directorio de Colaboradoras</h1>
          <p className="text-slate-500">Administra el acceso y visualiza el rendimiento individual.</p>
        </div>
        <div className="mt-4 md:mt-0 w-full md:w-auto relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <input 
                type="text" 
                placeholder="Buscar colaboradora..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-100 outline-none w-full md:w-64"
            />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {staffUsers.map(user => {
            const entries = getEntriesByUser(user.id);
            const stats = getAggregatedStats(entries);
            
            // Calculate average score
            let scoreSum = 0;
            entries.slice(-7).forEach(e => scoreSum += calculateScore(e, TARGETS).totalScore); // Last 7 days avg
            const recentAvgScore = entries.slice(-7).length ? Math.round(scoreSum / entries.slice(-7).length) : 0;

            return (
                <div key={user.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center space-x-4">
                            <img src={user.avatar} className="w-14 h-14 rounded-full border-2 border-white shadow-sm" alt={user.name} />
                            <div>
                                <h3 className="font-bold text-slate-800">{user.name}</h3>
                                <span className="inline-block bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-bold">Activo</span>
                            </div>
                        </div>
                        <button className="text-slate-300 hover:text-slate-600">
                            <MoreVertical size={20} />
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-slate-50 p-3 rounded-xl text-center">
                            <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Score Semanal</p>
                            <p className={`text-xl font-bold ${recentAvgScore >= 80 ? 'text-green-600' : 'text-orange-500'}`}>{recentAvgScore}</p>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-xl text-center">
                            <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Ventas Mes</p>
                            <p className="text-xl font-bold text-blue-600">RD$ {(stats.totalAmount/1000).toFixed(0)}k</p>
                        </div>
                    </div>

                    <div className="flex items-center justify-between text-sm text-slate-500 mb-6 space-x-2">
                        <div className="flex items-center"><Mail size={14} className="mr-1" /> Email</div>
                        <div className="flex items-center"><Phone size={14} className="mr-1" /> 809-555-0101</div>
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

        {/* Add New Card (Mock) */}
        <button className="border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center text-slate-400 hover:border-blue-300 hover:text-blue-500 transition-all min-h-[300px]">
            <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-3">
                <span className="text-2xl font-light">+</span>
            </div>
            <span className="font-medium">Agregar Nueva Colaboradora</span>
        </button>
      </div>
    </div>
  );
};

export default StaffManagement;
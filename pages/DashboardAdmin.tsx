import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  LineChart, Line, AreaChart, Area, Cell
} from 'recharts';
import { fetchEntries, getAggregatedStats, calculateScore, calculateConversion, fetchActiveBonusRules, fetchUsers, fetchTargets } from '../services/kpiService';
import { supabase } from '../services/supabaseClient';
import { TARGETS as DEFAULT_TARGETS } from '../constants';
import { KPIEntry, BonusRule, User, Target } from '../types';
import KPICard from '../components/KPICard';
import { DollarSign, Activity, TrendingUp, AlertTriangle, UserCheck, Calendar, Filter, X, Check, Loader2, Download, Clock, Radio, Users } from 'lucide-react';
import { Role } from '../types';

interface DashboardAdminProps {
  onViewStaff?: (userId: string) => void;
}

const DashboardAdmin: React.FC<DashboardAdminProps> = ({ onViewStaff }) => {
  const [entries, setEntries] = useState<KPIEntry[]>([]);
  const [activeBonusRules, setActiveBonusRules] = useState<BonusRule[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [targets, setTargets] = useState<Target>(DEFAULT_TARGETS);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);

  // Date Management State
  const [dateRange, setDateRange] = useState<'7d' | '30d' | 'custom'>('7d');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  
  const formatDate = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
  };

  const today = new Date();
  const defaultStart = new Date();
  defaultStart.setDate(today.getDate() - 6);
  
  const [startDate, setStartDate] = useState(formatDate(defaultStart));
  const [endDate, setEndDate] = useState(formatDate(today));

  const loadData = async () => {
    if (entries.length === 0) setLoading(true);
    
    const [data, rules, fetchedUsers, fetchedTargets] = await Promise.all([
        fetchEntries(), 
        fetchActiveBonusRules(),
        fetchUsers(),
        fetchTargets()
    ]);
    data.sort((a, b) => b.date.localeCompare(a.date));
    setEntries(data);
    setActiveBonusRules(rules);
    setUsers(fetchedUsers);
    setTargets(fetchedTargets);
    setLoading(false);
  };

  useEffect(() => {
    loadData();

    const channel = supabase
      .channel('dashboard_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'kpi_entries' },
        (payload) => {
          setIsLive(true);
          loadData();
          setTimeout(() => setIsLive(false), 2000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const applyQuickRange = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - (days - 1));
    
    setStartDate(formatDate(start));
    setEndDate(formatDate(end));
    setDateRange(days === 7 ? '7d' : '30d');
    setIsDatePickerOpen(false);
  };

  const handleCustomDateChange = (type: 'start' | 'end', value: string) => {
    if (type === 'start') setStartDate(value);
    else setEndDate(value);
    setDateRange('custom');
  };

  const handleExportCSV = () => {
    // ... csv logic (same as before) ...
    const headers = ['Fecha', 'Colaboradora', 'Ventas', 'Monto', 'Equipos', 'Conversión', 'Seguimientos', 'Errores', 'Notas'];
    const csvContent = [
      headers.join(','),
      ...filteredEntries.map(e => {
        const user = users.find(u => u.id === e.userId)?.name || 'Desconocido';
        const conversion = calculateConversion(e.salesClosed, e.clientsAttended);
        const notesClean = e.notes ? e.notes.replace(/,/g, ' ') : '';
        return [
          e.date,
          `"${user}"`,
          e.salesClosed,
          e.amountSold,
          e.devicesSold,
          `${conversion}%`,
          e.followUps,
          e.errors,
          `"${notesClean}"`
        ].join(',');
      })
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `kpi_export_${startDate}_${endDate}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="animate-spin text-primary-600" size={48} />
      </div>
    );
  }

  const filteredEntries = entries.filter(e => e.date >= startDate && e.date <= endDate);
  const stats = getAggregatedStats(filteredEntries);
  const staffUsers = users.filter(u => u.role === Role.STAFF);

  const getDaysArray = (start: string, end: string) => {
    const arr = [];
    const dt = new Date(start + 'T00:00:00');
    const endDt = new Date(end + 'T00:00:00');
    while (dt <= endDt) {
        arr.push(dt.toISOString().split('T')[0]);
        dt.setDate(dt.getDate() + 1);
    }
    return arr;
  };

  const dateAxis = getDaysArray(startDate, endDate);

  const rankingData = staffUsers.map(user => {
    const userEntries = filteredEntries.filter(e => e.userId === user.id);
    const userStats = getAggregatedStats(userEntries);
    let totalScoreSum = 0;
    userEntries.forEach(e => {
      totalScoreSum += calculateScore(e, targets).totalScore;
    });
    const avgScore = userEntries.length ? Math.round(totalScoreSum / userEntries.length) : 0;

    return {
      user,
      stats: userStats,
      score: avgScore,
      entriesCount: userEntries.length
    };
  }).sort((a, b) => b.score - a.score);

  const salesByStaffData = rankingData.map(d => ({
    name: d.user.name.split(' ')[0],
    amount: d.stats.totalAmount,
    sales: d.stats.totalSales,
  }));

  const salesTrendData = dateAxis.map(date => {
    const dayEntries = filteredEntries.filter(e => e.date === date);
    const totalDaySales = dayEntries.reduce((sum, e) => sum + e.amountSold, 0);
    return {
      date: date.substring(5),
      fullDate: date,
      amount: totalDaySales
    };
  });

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center glass-panel p-6 rounded-2xl shadow-sm border border-slate-100 relative z-20">
        <div>
          <div className="flex items-center space-x-3 mb-1">
             <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Dashboard General</h1>
             <div className={`flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold border transition-colors duration-500 uppercase tracking-wide ${isLive ? 'bg-green-100 text-green-700 border-green-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`}></div>
                <span>{isLive ? 'Live Update' : 'Conectado'}</span>
             </div>
          </div>
          <p className="text-slate-500 text-sm font-medium">
             Análisis de rendimiento en tiempo real
          </p>
        </div>
        
        <div className="mt-4 md:mt-0 flex flex-wrap items-center gap-3">
          <button 
             onClick={handleExportCSV}
             className="px-4 py-2 bg-white text-slate-600 hover:text-primary-600 border border-slate-200 hover:border-primary-200 rounded-xl font-bold text-xs uppercase tracking-wide flex items-center transition-all shadow-sm hover:shadow"
           >
             <Download size={14} className="mr-2" /> CSV
           </button>

           <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
             <button 
               onClick={() => applyQuickRange(7)}
               className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all ${dateRange === '7d' ? 'bg-slate-100 text-slate-800' : 'text-slate-500 hover:bg-slate-50'}`}
             >
               7 Días
             </button>
             <button 
               onClick={() => applyQuickRange(30)}
               className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all ${dateRange === '30d' ? 'bg-slate-100 text-slate-800' : 'text-slate-500 hover:bg-slate-50'}`}
             >
               30 Días
             </button>
             
             <div className="h-4 w-px bg-slate-200 mx-1"></div>
             
             <div className="relative">
               <button 
                  onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      dateRange === 'custom' || isDatePickerOpen ? 'text-primary-600 bg-primary-50' : 'text-slate-500 hover:bg-slate-50'
                  }`}
               >
                 <Calendar size={14} />
                 <span className="hidden sm:inline">{dateRange === 'custom' ? 'Custom' : ''}</span>
               </button>

               {isDatePickerOpen && (
                   <div className="absolute right-0 top-full mt-3 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 z-50 animate-fade-in">
                       {/* Date Picker Content (Same logic) */}
                       <div className="flex justify-between items-center mb-4">
                           <h4 className="font-bold text-slate-700 text-sm">Rango Personalizado</h4>
                           <button onClick={() => setIsDatePickerOpen(false)} className="text-slate-400 hover:text-slate-600">
                               <X size={16} />
                           </button>
                       </div>
                       <div className="space-y-3">
                           <div>
                               <label className="block text-xs font-semibold text-slate-500 mb-1">Desde</label>
                               <input 
                                  type="date" 
                                  value={startDate}
                                  max={endDate}
                                  onChange={(e) => handleCustomDateChange('start', e.target.value)}
                                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:ring-2 focus:ring-blue-100 outline-none"
                               />
                           </div>
                           <div>
                               <label className="block text-xs font-semibold text-slate-500 mb-1">Hasta</label>
                               <input 
                                  type="date" 
                                  value={endDate}
                                  min={startDate}
                                  max={formatDate(new Date())}
                                  onChange={(e) => handleCustomDateChange('end', e.target.value)}
                                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:ring-2 focus:ring-blue-100 outline-none"
                               />
                           </div>
                           <button 
                              onClick={() => setIsDatePickerOpen(false)}
                              className="w-full mt-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold py-2 rounded-lg flex items-center justify-center"
                           >
                               <Check size={16} className="mr-2" /> Aplicar
                           </button>
                       </div>
                   </div>
               )}
             </div>
           </div>
        </div>
      </div>

      {dateRange === 'custom' && (
          <div className="flex justify-center -mt-4 mb-4 animate-fade-in">
              <span className="bg-white text-slate-600 text-xs font-bold px-4 py-1.5 rounded-full border border-slate-200 shadow-sm flex items-center">
                  <Filter size={12} className="mr-1.5 text-primary-500" />
                  {startDate} — {endDate}
              </span>
          </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard 
          title="Venta Total" 
          value={`RD$ ${stats.totalAmount.toLocaleString()}`} 
          icon={<DollarSign size={24} />} 
          color="green"
          trend="up"
          trendValue="Revenue"
        />
        <KPICard 
          title="Conversión Avg" 
          value={`${stats.avgConversion}%`} 
          icon={<TrendingUp size={24} />} 
          color="blue"
          subtitle={`Meta: ${targets.dailyConversion}%`}
        />
        <KPICard 
          title="Productividad Score" 
          value={rankingData.length > 0 ? Math.round(rankingData.reduce((acc, curr) => acc + curr.score, 0) / rankingData.length) : 0} 
          icon={<Activity size={24} />} 
          color="purple"
          subtitle="Promedio Global"
        />
        <KPICard 
          title="Alertas / Errores" 
          value={filteredEntries.reduce((sum, e) => sum + e.errors, 0)} 
          icon={<AlertTriangle size={24} />} 
          color="red"
          subtitle="Requiere atención"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-lg transition-shadow duration-300">
          <div className="flex justify-between items-center mb-6">
            <div>
                <h3 className="text-lg font-bold text-slate-800">Monto por Colaboradora</h3>
                <p className="text-xs text-slate-400">Comparativa directa</p>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesByStaffData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.4}/>
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 500}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', background: 'rgba(255,255,255,0.95)' }}
                  formatter={(value) => [`RD$ ${value.toLocaleString()}`, 'Monto']} 
                />
                <Bar dataKey="amount" fill="url(#colorSales)" radius={[8, 8, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-lg transition-shadow duration-300">
          <div className="flex justify-between items-center mb-6">
             <div>
                <h3 className="text-lg font-bold text-slate-800">Tendencia de Ventas</h3>
                <p className="text-xs text-slate-400">Evolución diaria</p>
             </div>
          </div>
          <div className="h-72">
             <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesTrendData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 500}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    formatter={(value) => [`RD$ ${value.toLocaleString()}`, 'Venta']}
                    labelFormatter={(label, payload) => payload[0]?.payload.fullDate || label}
                  />
                  <Area type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorTrend)" />
                </AreaChart>
             </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Feed & Detailed Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Recent Activity Feed */}
        <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-slate-100 p-0 overflow-hidden flex flex-col h-full">
           <div className="p-6 border-b border-slate-50 bg-slate-50/50">
                <h3 className="font-bold text-slate-800 flex items-center text-sm uppercase tracking-wide">
                    <Clock size={16} className="mr-2 text-primary-500"/> Actividad Reciente
                </h3>
           </div>
           <div className="flex-1 p-6 space-y-6 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
             {entries.slice(0, 10).map((entry) => {
               const user = users.find(u => u.id === entry.userId);
               return (
                 <div key={entry.id} className="relative pl-6 pb-2 animate-fade-in group">
                   {/* Timeline line */}
                   <div className="absolute left-0 top-1 bottom-0 w-px bg-slate-100 group-last:hidden"></div>
                   <div className="absolute left-[-4px] top-1.5 w-2 h-2 rounded-full bg-primary-500 ring-4 ring-white"></div>
                   
                   <div className="flex justify-between items-start">
                       <div>
                            <p className="text-sm font-bold text-slate-800">{user?.name || 'Usuario'}</p>
                            <p className="text-xs text-slate-500 mb-1">Registro del {entry.date}</p>
                       </div>
                       <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">
                           {entry.salesClosed} Ventas
                       </span>
                   </div>
                   <div className="mt-2 bg-slate-50 p-2 rounded-lg border border-slate-100 flex items-center justify-between">
                        <span className="text-xs font-semibold text-green-700">RD$ {entry.amountSold.toLocaleString()}</span>
                        {entry.errors > 0 && (
                            <span className="text-[10px] text-red-500 flex items-center font-bold">
                                <AlertTriangle size={10} className="mr-1" /> {entry.errors} Err
                            </span>
                        )}
                   </div>
                 </div>
               );
             })}
             {entries.length === 0 && <div className="text-center py-10 text-slate-400 text-sm">Sin actividad reciente</div>}
           </div>
        </div>

        {/* Main Ranking Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide flex items-center">
                  <Users size={16} className="mr-2 text-primary-500"/> Productividad por Staff
              </h3>
            </div>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-100">
                  <th className="px-6 py-5 pl-8">Rank</th>
                  <th className="px-6 py-5">Colaboradora</th>
                  <th className="px-6 py-5">Productividad</th>
                  <th className="px-6 py-5">Monto</th>
                  <th className="px-6 py-5 text-center">Bonos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {rankingData.map((item, index) => {
                  const bonuses = activeBonusRules.filter(rule => {
                      if(rule.metric === 'amount') return item.stats.totalAmount >= rule.threshold;
                      if(rule.metric === 'conversion') return item.stats.avgConversion >= rule.threshold;
                      if(rule.metric === 'score') return item.score >= rule.threshold;
                      if(rule.metric === 'devices') return item.stats.totalDevices >= rule.threshold;
                      return false;
                  });
                  const totalBonus = bonuses.reduce((sum, b) => sum + b.amount, 0);

                  return (
                    <tr 
                      key={item.user.id} 
                      className="hover:bg-slate-50/80 transition-all cursor-pointer group" 
                      onClick={() => onViewStaff && onViewStaff(item.user.id)}
                    >
                      <td className="px-6 py-4 pl-8">
                        <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                            index === 0 ? 'bg-yellow-100 text-yellow-700' :
                            index === 1 ? 'bg-slate-200 text-slate-600' :
                            index === 2 ? 'bg-orange-100 text-orange-700' : 'text-slate-400 bg-slate-50'
                        }`}>
                            {index + 1}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <img src={item.user.avatar} alt="" className="w-10 h-10 rounded-full border-2 border-white shadow-sm object-cover" />
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                          </div>
                          <div>
                             <span className="font-bold text-slate-800 block text-sm group-hover:text-primary-600 transition-colors">{item.user.name.split(' ')[0]}</span>
                             <span className="text-xs text-slate-400">{item.entriesCount} reportes</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="w-32">
                           <div className="flex justify-between text-xs mb-1">
                               <span className="font-bold text-slate-700">{item.score}/100</span>
                               <span className={`font-bold ${item.stats.avgConversion >= targets.dailyConversion ? 'text-green-600' : 'text-slate-400'}`}>{item.stats.avgConversion}% Conv</span>
                           </div>
                           <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${item.score >= 80 ? 'bg-primary-500' : item.score >= 60 ? 'bg-blue-400' : 'bg-orange-400'}`} style={{width: `${item.score}%`}}></div>
                           </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-700 text-sm">RD$ {item.stats.totalAmount.toLocaleString()}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {totalBonus > 0 ? (
                          <div className="inline-flex items-center bg-green-50 text-green-700 px-3 py-1 rounded-full border border-green-100 shadow-sm text-xs font-bold">
                             <DollarSign size={12} className="mr-1" />
                             {totalBonus.toLocaleString()}
                          </div>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardAdmin;
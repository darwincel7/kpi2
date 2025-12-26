import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  LineChart, Line, AreaChart, Area
} from 'recharts';
import { getEntries, getAggregatedStats, calculateScore } from '../services/kpiService';
import { USERS, TARGETS, BONUS_RULES } from '../constants';
import KPICard from '../components/KPICard';
import { DollarSign, Activity, TrendingUp, AlertTriangle, UserCheck, Calendar, Filter, X, Check, Smartphone } from 'lucide-react';
import { Role } from '../types';

const DashboardAdmin: React.FC = () => {
  // Date Management State
  const [dateRange, setDateRange] = useState<'7d' | '30d' | 'custom'>('7d');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  
  // Initialize with last 7 days
  const today = new Date();
  const defaultStart = new Date();
  defaultStart.setDate(today.getDate() - 6); // 7 days inclusive
  
  const formatDate = (d: Date) => d.toISOString().split('T')[0];
  
  const [startDate, setStartDate] = useState(formatDate(defaultStart));
  const [endDate, setEndDate] = useState(formatDate(today));

  // Quick Range Handlers
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

  // Data Filtering
  const allEntries = getEntries();
  const filteredEntries = allEntries.filter(e => e.date >= startDate && e.date <= endDate);
  const stats = getAggregatedStats(filteredEntries);
  
  const staffUsers = USERS.filter(u => u.role === Role.STAFF);

  // Helper to generate continuous date array for charts (so empty days show as 0)
  const getDaysArray = (start: string, end: string) => {
    const arr = [];
    const dt = new Date(start);
    const endDt = new Date(end);
    while (dt <= endDt) {
        arr.push(new Date(dt).toISOString().split('T')[0]);
        dt.setDate(dt.getDate() + 1);
    }
    return arr;
  };

  const dateAxis = getDaysArray(startDate, endDate);

  // 1. Ranking Table Data
  const rankingData = staffUsers.map(user => {
    const userEntries = filteredEntries.filter(e => e.userId === user.id);
    const userStats = getAggregatedStats(userEntries);
    
    let totalScoreSum = 0;
    userEntries.forEach(e => {
      totalScoreSum += calculateScore(e, TARGETS).totalScore;
    });
    const avgScore = userEntries.length ? Math.round(totalScoreSum / userEntries.length) : 0;

    return {
      user,
      stats: userStats,
      score: avgScore,
      entriesCount: userEntries.length
    };
  }).sort((a, b) => b.score - a.score);

  // 2. Bar Chart: Sales vs Amount (Top Performers)
  const salesByStaffData = rankingData.map(d => ({
    name: d.user.name.split(' ')[0],
    amount: d.stats.totalAmount,
    sales: d.stats.totalSales,
  }));

  // 3. Line Chart: Sales Trend (Total Daily Sales)
  const salesTrendData = dateAxis.map(date => {
    const dayEntries = filteredEntries.filter(e => e.date === date);
    const totalDaySales = dayEntries.reduce((sum, e) => sum + e.amountSold, 0);
    return {
      date: date.substring(5), // MM-DD
      fullDate: date,
      amount: totalDaySales
    };
  });

  // 4. Stacked Bar Chart: Activity Mix per Staff
  const activityStackData = staffUsers.map(user => {
    const userEntries = filteredEntries.filter(e => e.userId === user.id);
    return {
      name: user.name.split(' ')[0],
      Ventas: userEntries.reduce((s, e) => s + e.salesClosed, 0),
      Seguimientos: userEntries.reduce((s, e) => s + e.followUps, 0),
      Cotizaciones: userEntries.reduce((s, e) => s + e.quotesSent, 0),
    };
  });

  // 5. Area Chart: Conversion Trend
  const conversionTrendData = dateAxis.map(date => {
    const dayEntries = filteredEntries.filter(e => e.date === date);
    const dayStats = getAggregatedStats(dayEntries);
    return {
      date: date.substring(5), // MM-DD
      conversion: dayStats.avgConversion,
    };
  });

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative z-20">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Dashboard General</h1>
          <p className="text-slate-500 mt-1 flex items-center">
             <Activity size={16} className="mr-2 text-blue-500" />
             Visión global del rendimiento de la célula
          </p>
        </div>
        
        {/* Date Filter Controls */}
        <div className="mt-4 md:mt-0 flex items-center space-x-3 bg-slate-50 p-1.5 rounded-xl border border-slate-200 relative">
           <button 
             onClick={() => applyQuickRange(7)}
             className={`px-4 py-2 rounded-lg font-medium text-sm transition-all shadow-sm ${dateRange === '7d' ? 'bg-white text-blue-600 ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}
           >
             7 Días
           </button>
           <button 
             onClick={() => applyQuickRange(30)}
             className={`px-4 py-2 rounded-lg font-medium text-sm transition-all shadow-sm ${dateRange === '30d' ? 'bg-white text-blue-600 ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}
           >
             30 Días
           </button>
           
           <div className="h-6 w-px bg-slate-300 mx-2"></div>
           
           <div className="relative">
             <button 
                onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    dateRange === 'custom' || isDatePickerOpen ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:bg-slate-200'
                }`}
             >
               <Calendar size={18} />
               <span className="hidden sm:inline">{dateRange === 'custom' ? 'Personalizado' : 'Fecha'}</span>
             </button>

             {/* Date Picker Dropdown */}
             {isDatePickerOpen && (
                 <div className="absolute right-0 top-full mt-3 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 z-50 animate-fade-in">
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
                                max={new Date().toISOString().split('T')[0]}
                                onChange={(e) => handleCustomDateChange('end', e.target.value)}
                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:ring-2 focus:ring-blue-100 outline-none"
                             />
                         </div>
                         <button 
                            onClick={() => setIsDatePickerOpen(false)}
                            className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-2 rounded-lg flex items-center justify-center"
                         >
                             <Check size={16} className="mr-2" /> Aplicar Filtro
                         </button>
                     </div>
                 </div>
             )}
           </div>
        </div>
      </div>

      {/* Date Range Indicator */}
      {dateRange === 'custom' && (
          <div className="flex justify-center -mt-4 mb-4">
              <span className="bg-blue-50 text-blue-600 text-xs font-bold px-3 py-1 rounded-full border border-blue-100 flex items-center">
                  <Filter size={12} className="mr-1" />
                  Mostrando datos del {startDate} al {endDate}
              </span>
          </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard 
          title="Venta Total (Periodo)" 
          value={`RD$ ${stats.totalAmount.toLocaleString()}`} 
          icon={<DollarSign size={24} />} 
          color="green"
          trend="up"
          trendValue={dateRange === '7d' ? 'Últimos 7 días' : dateRange === '30d' ? 'Últimos 30 días' : 'Rango personalizado'}
        />
        <KPICard 
          title="Conversión Promedio" 
          value={`${stats.avgConversion}%`} 
          icon={<TrendingUp size={24} />} 
          color="blue"
          subtitle={`Meta Equipo: ${TARGETS.dailyConversion}%`}
        />
        <KPICard 
          title="Productividad (Score)" 
          value={rankingData.length > 0 ? Math.round(rankingData.reduce((acc, curr) => acc + curr.score, 0) / rankingData.length) : 0} 
          icon={<UserCheck size={24} />} 
          color="purple"
          subtitle="Promedio del equipo"
        />
        <KPICard 
          title="Alertas Operativas" 
          value={filteredEntries.reduce((sum, e) => sum + e.errors, 0)} 
          icon={<AlertTriangle size={24} />} 
          color="red"
          subtitle="En este periodo"
        />
      </div>

      {/* Row 1: Sales Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Sales by Staff (Bar) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800">Monto Vendido por Colaboradora</h3>
            <span className="text-xs font-semibold bg-blue-50 text-blue-600 px-3 py-1 rounded-full">Ranking Ventas</span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesByStaffData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value) => `RD$ ${value.toLocaleString()}`} 
                />
                <Bar dataKey="amount" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Monto (RD$)" barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sales Trend (Line) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-6">
             <h3 className="text-lg font-bold text-slate-800">Tendencia de Ventas Diarias</h3>
             <span className="text-xs font-semibold bg-green-50 text-green-600 px-3 py-1 rounded-full">Equipo Total</span>
          </div>
          <div className="h-72">
             <ResponsiveContainer width="100%" height="100%">
                <LineChart data={salesTrendData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value) => `RD$ ${value.toLocaleString()}`}
                    labelFormatter={(label, payload) => payload[0]?.payload.fullDate || label}
                  />
                  <Line type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={3} dot={{r: 3, fill: '#10b981', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 6}} name="Ventas" />
                </LineChart>
             </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 2: Activity & Conversion */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Activity Mix (Stacked Bar) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-2">Distribución de Actividad</h3>
          <p className="text-sm text-slate-400 mb-6">Volumen operativo por colaboradora</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activityStackData} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={60} tick={{fill: '#475569', fontWeight: 600}} />
                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend iconType="circle" />
                <Bar dataKey="Ventas" stackId="a" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
                <Bar dataKey="Seguimientos" stackId="a" fill="#6366f1" barSize={20} />
                <Bar dataKey="Cotizaciones" stackId="a" fill="#3b82f6" radius={[4, 0, 0, 4]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Conversion Trend */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
           <h3 className="text-lg font-bold text-slate-800 mb-6">Efectividad de Conversión (%)</h3>
           <div className="h-72">
             <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={conversionTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorConv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <YAxis unit="%" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="conversion" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#colorConv)" name="Conversión %" />
                </AreaChart>
             </ResponsiveContainer>
           </div>
        </div>
      </div>

      {/* Ranking & Detailed Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Ranking & Productividad</h3>
            <p className="text-sm text-slate-500">Ordenado por Score General</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-bold"># Rank</th>
                <th className="px-6 py-4 font-bold">Colaboradora</th>
                <th className="px-6 py-4 font-bold">Score Promedio</th>
                <th className="px-6 py-4 font-bold">Monto Vendido</th>
                <th className="px-6 py-4 font-bold">Equipos</th>
                <th className="px-6 py-4 font-bold">Conversión</th>
                <th className="px-6 py-4 font-bold">Seguimientos</th>
                <th className="px-6 py-4 font-bold text-center">Bonos Proyectados</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rankingData.map((item, index) => {
                const bonuses = BONUS_RULES.filter(rule => {
                    if(rule.metric === 'amount') return item.stats.totalAmount >= rule.threshold;
                    if(rule.metric === 'conversion') return item.stats.avgConversion >= rule.threshold;
                    if(rule.metric === 'score') return item.score >= rule.threshold;
                    if(rule.metric === 'devices') return item.stats.totalDevices >= rule.threshold;
                    return false;
                });
                const totalBonus = bonuses.reduce((sum, b) => sum + b.amount, 0);

                return (
                  <tr key={item.user.id} className="hover:bg-blue-50/30 transition-colors group cursor-pointer" onClick={() => console.log("Navigate to user detail", item.user.id)}>
                    <td className="px-6 py-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-sm ${
                        index === 0 ? 'bg-yellow-400 text-white ring-2 ring-yellow-200' : 
                        index === 1 ? 'bg-slate-300 text-slate-600' :
                        index === 2 ? 'bg-orange-300 text-white' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {index + 1}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <img src={item.user.avatar} alt="" className="w-10 h-10 rounded-full border-2 border-white shadow-sm" />
                        <div>
                           <span className="font-bold text-slate-800 block">{item.user.name}</span>
                           <span className="text-xs text-slate-400">Staff</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-full max-w-[100px] bg-slate-100 rounded-full h-2.5 mr-3 overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${item.score > 80 ? 'bg-green-500' : item.score > 60 ? 'bg-blue-500' : 'bg-orange-500'}`} 
                            style={{ width: `${item.score}%` }}
                          ></div>
                        </div>
                        <span className="font-bold text-slate-800">{item.score}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-600">RD$ {item.stats.totalAmount.toLocaleString()}</td>
                    <td className="px-6 py-4 font-medium text-slate-600">{item.stats.totalDevices}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                        item.stats.avgConversion >= TARGETS.dailyConversion ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {item.stats.avgConversion}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium">{item.stats.totalFollowUps}</td>
                    <td className="px-6 py-4 text-center">
                      {totalBonus > 0 ? (
                        <div className="inline-flex items-center bg-green-50 text-green-700 px-3 py-1 rounded-lg border border-green-100 shadow-sm">
                           <DollarSign size={14} className="mr-1" />
                           <span className="font-bold">RD$ {totalBonus.toLocaleString()}</span>
                        </div>
                      ) : (
                        <span className="text-slate-300 text-sm">-</span>
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
  );
};

export default DashboardAdmin;
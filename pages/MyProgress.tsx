import React, { useState } from 'react';
import { User, KPIEntry, DailyScore, Role } from '../types';
import { getEntriesByUser, calculateScore, getAggregatedStats, getEntries } from '../services/kpiService';
import { TARGETS, BONUS_RULES, USERS } from '../constants';
import KPICard from '../components/KPICard';
import { TrendingUp, Target, Award, CheckCircle, X, Calendar, DollarSign, Activity, AlertCircle, ChevronRight, Trophy, AlertTriangle, Repeat, Smartphone } from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface MyProgressProps {
  user: User;
}

type ModalType = 'score_details' | 'sales_history' | 'conversion_details' | 'followup_history' | 'bonus_details' | 'day_details' | 'top_ranking';

interface ModalState {
  isOpen: boolean;
  type: ModalType | null;
  data: any;
  title: string;
}

const MyProgress: React.FC<MyProgressProps> = ({ user }) => {
  const entries = getEntriesByUser(user.id);
  const stats = getAggregatedStats(entries);
  const [modal, setModal] = useState<ModalState>({ isOpen: false, type: null, data: null, title: '' });

  // Calculate today's score if available
  const todayStr = new Date().toISOString().split('T')[0];
  const todayEntry = entries.find(e => e.date === todayStr);
  const todayScore = todayEntry ? calculateScore(todayEntry, TARGETS) : null;

  // Last 7 days chart data
  const chartData = entries.slice(-7).map(e => ({
    date: e.date.substring(5),
    fullDate: e.date,
    score: calculateScore(e, TARGETS).totalScore,
    entry: e,
    scoreObj: calculateScore(e, TARGETS)
  }));

  // Handlers for interactions
  const openScoreDetails = () => {
    if (!todayScore || !todayEntry) return;
    setModal({
      isOpen: true,
      type: 'score_details',
      title: 'Desglose de Score de Hoy',
      data: { score: todayScore, entry: todayEntry }
    });
  };

  const openSalesHistory = () => {
    setModal({
      isOpen: true,
      type: 'sales_history',
      title: 'Historial de Ventas (Mes Actual)',
      data: entries.filter(e => e.salesClosed > 0 || e.amountSold > 0).reverse()
    });
  };

  const openConversionDetails = () => {
    setModal({
      isOpen: true,
      type: 'conversion_details',
      title: 'Análisis de Conversión',
      data: { entries: entries.slice(-30).reverse(), avg: stats.avgConversion }
    });
  };

  const openFollowupHistory = () => {
    setModal({
      isOpen: true,
      type: 'followup_history',
      title: 'Registro de Seguimientos',
      data: entries.filter(e => e.followUps > 0).reverse()
    });
  };

  const openBonusDetails = (rule: any, currentVal: number) => {
    setModal({
      isOpen: true,
      type: 'bonus_details',
      title: `Detalle de Bono: ${rule.name}`,
      data: { rule, currentVal }
    });
  };

  const openDayDetails = (entry: KPIEntry) => {
    const score = calculateScore(entry, TARGETS);
    setModal({
      isOpen: true,
      type: 'day_details',
      title: `Resumen del día ${entry.date}`,
      data: { entry, score }
    });
  };

  const openTopRanking = () => {
    // 1. Get all entries
    const allEntries = getEntries();
    
    // 2. Filter last 30 days
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    const recentEntries = allEntries.filter(e => new Date(e.date) >= thirtyDaysAgo);

    // 3. Aggregate per user (Only Staff)
    const staff = USERS.filter(u => u.role === Role.STAFF);
    const leaderboard = staff.map(u => {
        const userEntries = recentEntries.filter(e => e.userId === u.id);
        return {
            id: u.id,
            name: u.name,
            avatar: u.avatar,
            sales: userEntries.reduce((acc, curr) => acc + curr.salesClosed, 0),
            exchanges: userEntries.reduce((acc, curr) => acc + curr.exchanges, 0),
            errors: userEntries.reduce((acc, curr) => acc + curr.errors, 0),
        };
    });

    setModal({
        isOpen: true,
        type: 'top_ranking',
        title: '🏆 TOP Ranking (Últimos 30 días)',
        data: leaderboard
    });
  };

  const closeModal = () => setModal({ ...modal, isOpen: false });

  // --- Modal Content Renderers ---

  const renderTopRanking = (leaderboard: any[]) => {
      const topSales = [...leaderboard].sort((a, b) => b.sales - a.sales);
      const topExchanges = [...leaderboard].sort((a, b) => b.exchanges - a.exchanges);
      const topErrors = [...leaderboard].sort((a, b) => b.errors - a.errors);

      const renderList = (data: any[], metricKey: string, colorClass: string, icon: React.ReactNode, label: string) => (
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex-1 min-w-[280px]">
              <div className={`flex items-center space-x-2 mb-4 font-bold ${colorClass}`}>
                  {icon}
                  <span className="text-slate-700 uppercase text-xs tracking-wider">{label}</span>
              </div>
              <div className="space-y-3">
                  {data.map((item, idx) => (
                      <div key={item.id} className={`flex items-center justify-between p-3 rounded-lg ${item.id === user.id ? 'bg-blue-100 border border-blue-200' : 'bg-white border border-slate-100'}`}>
                          <div className="flex items-center space-x-3">
                              <div className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${
                                  idx === 0 ? 'bg-yellow-400 text-yellow-900' : 
                                  idx === 1 ? 'bg-slate-300 text-slate-700' : 
                                  idx === 2 ? 'bg-orange-300 text-orange-800' : 'bg-slate-100 text-slate-400'
                              }`}>
                                  {idx + 1}
                              </div>
                              <img src={item.avatar} alt="" className="w-8 h-8 rounded-full border border-slate-200" />
                              <span className={`text-sm font-medium ${item.id === user.id ? 'text-blue-800' : 'text-slate-700'}`}>
                                  {item.name.split(' ')[0]} {item.id === user.id && '(Tú)'}
                              </span>
                          </div>
                          <span className="font-bold text-slate-800">{item[metricKey]}</span>
                      </div>
                  ))}
              </div>
          </div>
      );

      return (
          <div className="space-y-2">
              <p className="text-sm text-slate-500 text-center mb-6">Comparativa de rendimiento entre compañeras.</p>
              <div className="flex flex-col md:flex-row gap-4 overflow-x-auto pb-4">
                  {renderList(topSales, 'sales', 'text-green-600', <Target size={18} />, 'Líderes en Ventas')}
                  {renderList(topExchanges, 'exchanges', 'text-purple-600', <Repeat size={18} />, 'Más Cambiazos')}
                  {renderList(topErrors, 'errors', 'text-red-600', <AlertTriangle size={18} />, 'Más Errores')}
              </div>
          </div>
      );
  };

  const renderScoreDetails = (data: { score: DailyScore, entry: KPIEntry }) => {
    const { score, entry } = data;
    const dailyTargetAmount = Math.round(TARGETS.monthlySalesAmount / 30);
    const dailyTargetDevices = Math.round(TARGETS.monthlyDevices / 30);
    
    // Updated Points Breakdown according to new Logic
    const items = [
        { label: 'Ventas (Monto)', pts: score.salesScore, max: 30, val: `RD$ ${entry.amountSold.toLocaleString()}`, target: `Meta: ${dailyTargetAmount.toLocaleString()}` },
        { label: 'Equipos Vendidos', pts: score.devicesScore, max: 10, val: `${entry.devicesSold}`, target: `Meta: ${dailyTargetDevices}` },
        { label: 'Conversión', pts: score.conversionScore, max: 20, val: `${score.conversionRate}%`, target: `Meta: ${TARGETS.dailyConversion}%` },
        { label: 'Seguimientos', pts: score.followUpScore, max: 10, val: `${entry.followUps}`, target: `Meta: ${TARGETS.dailyFollowUps}` },
        { label: 'Calidad', pts: score.qualityScore, max: 10, val: `${entry.qualityScore}/5`, target: 'Eval: Supervisor' },
        { label: 'Disciplina & Ops', pts: score.disciplineScore, max: 20, val: `${entry.punctualityScore}/5`, target: `Errores: ${entry.errors}` },
    ];

    return (
        <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-xl text-center mb-6">
                <p className="text-slate-500 text-sm mb-1">Puntaje Total Calculado</p>
                <h2 className="text-4xl font-bold text-blue-700">{score.totalScore}<span className="text-lg text-blue-400">/100</span></h2>
            </div>
            <div className="space-y-3">
                {items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-lg hover:bg-slate-50">
                        <div>
                            <p className="font-bold text-slate-800">{item.label}</p>
                            <p className="text-xs text-slate-500">{item.val} • <span className="text-slate-400">{item.target}</span></p>
                        </div>
                        <div className="text-right">
                            <span className="font-bold text-blue-600 text-lg">{Math.round(item.pts)}</span>
                            <span className="text-xs text-slate-400">/{item.max} pts</span>
                        </div>
                    </div>
                ))}
            </div>
            <p className="text-center text-xs text-slate-400 mt-2">
                * Las metas diarias se calculan en base al objetivo mensual dividido por 30.
            </p>
        </div>
    );
  };

  const renderHistoryTable = (data: KPIEntry[], type: 'sales' | 'followups') => {
      if (!data || data.length === 0) return <p className="text-center text-slate-500 py-8">No hay registros aún.</p>;
      
      return (
          <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-500">
                      <tr>
                          <th className="p-3 font-semibold">Fecha</th>
                          {type === 'sales' ? (
                              <>
                                <th className="p-3 font-semibold">Ventas #</th>
                                <th className="p-3 font-semibold">Equipos</th>
                                <th className="p-3 font-semibold text-right">Monto</th>
                              </>
                          ) : (
                              <th className="p-3 font-semibold text-right">Seguimientos</th>
                          )}
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                      {data.map(e => (
                          <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                              <td className="p-3 text-slate-700">{e.date}</td>
                              {type === 'sales' ? (
                                  <>
                                    <td className="p-3 font-medium">{e.salesClosed}</td>
                                    <td className="p-3 font-medium text-slate-500">{e.devicesSold}</td>
                                    <td className="p-3 text-right font-bold text-green-600">RD$ {e.amountSold.toLocaleString()}</td>
                                  </>
                              ) : (
                                  <td className="p-3 text-right font-medium text-slate-700">{e.followUps}</td>
                              )}
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      );
  };

  const renderConversionDetails = (data: { entries: KPIEntry[], avg: number }) => (
      <div className="space-y-6">
          <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl">
              <div>
                  <p className="text-sm text-slate-500">Promedio Global</p>
                  <p className="text-2xl font-bold text-slate-800">{data.avg}%</p>
              </div>
              <div className="text-right">
                  <p className="text-sm text-slate-500">Meta Objetiva</p>
                  <p className="text-xl font-bold text-green-600">{TARGETS.dailyConversion}%</p>
              </div>
          </div>
          <div className="space-y-2">
              <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Últimos registros</h4>
              {data.entries.slice(0, 10).map(e => {
                  const rate = calculateScore(e, TARGETS).conversionRate;
                  const isGood = rate >= TARGETS.dailyConversion;
                  return (
                      <div key={e.id} className="flex justify-between items-center p-3 border border-slate-100 rounded-lg">
                          <span className="text-sm text-slate-600">{e.date}</span>
                          <div className="flex items-center space-x-4">
                              <span className="text-xs text-slate-400">{e.salesClosed} vtas / {e.clientsAttended} clientes</span>
                              <span className={`font-bold ${isGood ? 'text-green-600' : 'text-orange-500'}`}>{rate}%</span>
                          </div>
                      </div>
                  );
              })}
          </div>
      </div>
  );

  const renderBonusDetails = (data: { rule: any, currentVal: number }) => {
      const { rule, currentVal } = data;
      const remaining = Math.max(rule.threshold - currentVal, 0);
      const percent = Math.min((currentVal / rule.threshold) * 100, 100);
      
      return (
          <div className="space-y-6 text-center">
              <div className="inline-block p-4 bg-yellow-50 rounded-full text-yellow-600 mb-2">
                  <Award size={48} />
              </div>
              <h3 className="text-xl font-bold text-slate-800">{rule.name}</h3>
              <p className="text-slate-500">Gana <span className="font-bold text-green-600">RD$ {rule.amount.toLocaleString()}</span> al llegar a la meta.</p>
              
              <div className="bg-slate-50 p-6 rounded-xl text-left space-y-4">
                  <div>
                      <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-500">Progreso Actual</span>
                          <span className="font-bold text-slate-800">{percent.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden">
                          <div className={`h-full ${percent >= 100 ? 'bg-green-500' : 'bg-blue-500'} transition-all duration-500`} style={{ width: `${percent}%` }}></div>
                      </div>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                      <div>
                          <p className="text-xs text-slate-400 uppercase">Actual</p>
                          <p className="font-bold text-lg text-slate-700">{currentVal.toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                          <p className="text-xs text-slate-400 uppercase">Meta</p>
                          <p className="font-bold text-lg text-slate-700">{rule.threshold.toLocaleString()}</p>
                      </div>
                  </div>
                  {remaining > 0 ? (
                      <div className="bg-blue-100 text-blue-700 p-3 rounded-lg text-sm text-center font-medium">
                          ¡Faltan {remaining.toLocaleString()} para desbloquear!
                      </div>
                  ) : (
                      <div className="bg-green-100 text-green-700 p-3 rounded-lg text-sm text-center font-bold flex items-center justify-center">
                          <CheckCircle size={16} className="mr-2" /> ¡Meta Alcanzada!
                      </div>
                  )}
              </div>
          </div>
      );
  };

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Hola, {user.name.split(' ')[0]} 👋</h1>
          <p className="text-slate-500">Aquí está tu rendimiento actual.</p>
        </div>
        
        <div className="flex items-center space-x-3 w-full md:w-auto">
            <button 
                onClick={openTopRanking}
                className="flex-1 md:flex-none flex items-center justify-center space-x-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2.5 rounded-xl font-bold shadow-md hover:shadow-lg transition-all active:scale-95"
            >
                <Trophy size={18} />
                <span>TOP Ranking</span>
            </button>
            
            {todayEntry ? (
                <div className="bg-green-50 text-green-700 px-4 py-2.5 rounded-xl font-medium border border-green-100 flex items-center shadow-sm">
                <CheckCircle size={18} className="mr-2" />
                <span className="text-sm">Completado</span>
                </div>
            ) : (
                <div className="bg-orange-50 text-orange-700 px-4 py-2.5 rounded-xl font-medium border border-orange-100 flex items-center shadow-sm animate-pulse">
                <Target size={18} className="mr-2" />
                <span className="text-sm">Registrar Hoy</span>
                </div>
            )}
        </div>
      </div>

      {/* Today's Snapshot - Clickable */}
      {todayEntry && todayScore && (
        <div 
            onClick={openScoreDetails}
            className="group cursor-pointer bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg transform transition-all hover:scale-[1.01] hover:shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="bg-white/20 p-2 rounded-full hover:bg-white/30 backdrop-blur-sm">
                  <ChevronRight className="text-white" />
              </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0 text-center md:text-left">
              <p className="text-blue-100 font-medium mb-1 flex items-center justify-center md:justify-start">
                Score Diario de Hoy <AlertCircle size={14} className="ml-2 opacity-60" />
              </p>
              <h2 className="text-5xl font-bold tracking-tight">{todayScore.totalScore}<span className="text-2xl text-blue-200 font-normal">/100</span></h2>
            </div>
            <div className="flex space-x-8">
               <div className="text-center group-hover:translate-y-[-2px] transition-transform duration-300">
                 <p className="text-blue-200 text-sm mb-1">Ventas</p>
                 <p className="font-bold text-xl">{todayScore.salesScore.toFixed(0)} pts</p>
               </div>
               <div className="text-center group-hover:translate-y-[-2px] transition-transform duration-300 delay-75">
                 <p className="text-blue-200 text-sm mb-1">Equipos</p>
                 <p className="font-bold text-xl">{todayScore.devicesScore.toFixed(0)} pts</p>
               </div>
               <div className="text-center group-hover:translate-y-[-2px] transition-transform duration-300 delay-150">
                 <p className="text-blue-200 text-sm mb-1">Conversión</p>
                 <p className="font-bold text-xl">{todayScore.conversionScore.toFixed(0)} pts</p>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Stats Grid - Interactive */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPICard 
          title="Acumulado Ventas (Mes)" 
          value={`RD$ ${stats.totalAmount.toLocaleString()}`} 
          icon={<TrendingUp size={24} />}
          color="blue"
          onClick={openSalesHistory}
        />
        <KPICard 
          title="Tu Conversión" 
          value={`${stats.avgConversion}%`} 
          subtitle={`Meta: ${TARGETS.dailyConversion}%`}
          icon={<Target size={24} />}
          color={stats.avgConversion >= TARGETS.dailyConversion ? 'green' : 'orange'}
          onClick={openConversionDetails}
        />
         <KPICard 
          title="Seguimientos Totales" 
          value={stats.totalFollowUps} 
          icon={<Award size={24} />}
          color="purple"
          onClick={openFollowupHistory}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Bonus Progress - Interactive */}
        <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-800 mb-6 flex items-center">
                <Award className="mr-2 text-yellow-500" /> Metas de Bonos
            </h3>
            <div className="space-y-6">
                {BONUS_RULES.map(rule => {
                    let currentVal = 0;
                    let label = "";
                    
                    if (rule.metric === 'amount') {
                        currentVal = stats.totalAmount;
                        label = `RD$ ${currentVal.toLocaleString()} / ${rule.threshold.toLocaleString()}`;
                    } else if (rule.metric === 'conversion') {
                        currentVal = stats.avgConversion;
                        label = `${currentVal}% / ${rule.threshold}%`;
                    } else if (rule.metric === 'devices') {
                        currentVal = stats.totalDevices;
                        label = `${currentVal} / ${rule.threshold} Unds.`;
                    } else {
                        currentVal = 50; 
                        label = "En progreso";
                    }

                    const percent = Math.min((currentVal / rule.threshold) * 100, 100);

                    return (
                        <div 
                            key={rule.id} 
                            onClick={() => openBonusDetails(rule, currentVal)}
                            className="group cursor-pointer hover:bg-slate-50 p-2 rounded-lg -mx-2 transition-colors"
                        >
                            <div className="flex justify-between text-sm mb-1">
                                <span className="font-medium text-slate-700 group-hover:text-blue-700 transition-colors">{rule.name}</span>
                                <span className="text-green-600 font-bold">RD$ {rule.amount}</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2.5 mb-1">
                                <div className={`h-2.5 rounded-full ${percent >= 100 ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${percent}%` }}></div>
                            </div>
                            <p className="text-xs text-slate-400 text-right group-hover:text-slate-500">{label}</p>
                        </div>
                    );
                })}
            </div>
        </div>

        {/* History Chart - Interactive */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-800 mb-4 flex justify-between items-center">
              <span>Tu Rendimiento (Últimos 7 días)</span>
              <span className="text-xs font-normal text-slate-400 bg-slate-50 px-2 py-1 rounded">Clic en barra para detalles</span>
          </h3>
          <div className="h-64">
             <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="date" tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                <Tooltip 
                    cursor={{fill: 'transparent'}}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar 
                    dataKey="score" 
                    radius={[4, 4, 0, 0]} 
                    name="Score Diario"
                    onClick={(data) => {
                        const entry = entries.find(e => e.date === data.fullDate);
                        if (entry) openDayDetails(entry);
                    }}
                    cursor="pointer"
                >
                    {chartData.map((entry, index) => (
                        <Cell 
                            key={`cell-${index}`} 
                            fill={entry.score >= 80 ? '#4f46e5' : entry.score >= 60 ? '#6366f1' : '#f59e0b'} 
                            className="hover:opacity-80 transition-opacity"
                        />
                    ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* GENERIC MODAL */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black bg-opacity-40 backdrop-blur-sm transition-opacity" onClick={closeModal}></div>
            <div className={`bg-white rounded-2xl shadow-2xl w-full z-10 overflow-hidden transform transition-all animate-fade-in flex flex-col max-h-[90vh] ${modal.type === 'top_ranking' ? 'max-w-4xl' : 'max-w-lg'}`}>
                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-slate-800 text-lg">{modal.title}</h3>
                    <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 bg-white p-1 rounded-full shadow-sm hover:shadow transition-all">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto custom-scrollbar">
                    {modal.type === 'score_details' && renderScoreDetails(modal.data)}
                    {modal.type === 'sales_history' && renderHistoryTable(modal.data, 'sales')}
                    {modal.type === 'conversion_details' && renderConversionDetails(modal.data)}
                    {modal.type === 'followup_history' && renderHistoryTable(modal.data, 'followups')}
                    {modal.type === 'bonus_details' && renderBonusDetails(modal.data)}
                    {modal.type === 'day_details' && renderScoreDetails({ score: modal.data.score, entry: modal.data.entry })}
                    {modal.type === 'top_ranking' && renderTopRanking(modal.data)}
                </div>
                <div className="p-4 border-t border-slate-100 bg-slate-50 text-center">
                    <button onClick={closeModal} className="text-blue-600 font-bold text-sm hover:underline">
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default MyProgress;
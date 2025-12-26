import React, { useState } from 'react';
import { getEntries, getAggregatedStats, calculateScore, getActiveBonusRules } from '../services/kpiService';
import { USERS, TARGETS } from '../constants';
import { Role } from '../types';
import { Trophy, DollarSign, Target, Award, Crown } from 'lucide-react';

const Ranking: React.FC = () => {
  const [timeframe, setTimeframe] = useState<'current_month' | 'all_time'>('current_month');

  // Filter Data Logic
  const allEntries = getEntries();
  const staffUsers = USERS.filter(u => u.role === Role.STAFF);
  const activeBonusRules = getActiveBonusRules();

  // Helper to filter entries by time
  const getFilteredEntries = (userId: string) => {
    return allEntries.filter(e => {
        if (e.userId !== userId) return false;
        if (timeframe === 'current_month') {
            // Simple check for last 30 days for demo purposes
            const date = new Date(e.date);
            const today = new Date();
            const diffTime = Math.abs(today.getTime() - date.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays <= 30;
        }
        return true;
    });
  };

  // Calculate Comprehensive Stats per User
  const rankingData = staffUsers.map(user => {
    const userEntries = getFilteredEntries(user.id);
    const stats = getAggregatedStats(userEntries);
    
    // Average Score
    let totalScoreSum = 0;
    userEntries.forEach(e => totalScoreSum += calculateScore(e, TARGETS).totalScore);
    const avgScore = userEntries.length ? Math.round(totalScoreSum / userEntries.length) : 0;

    // Calculate Bonuses using ACTIVE rules from service
    const achievedBonuses = activeBonusRules.filter(rule => {
        if (rule.metric === 'amount') return stats.totalAmount >= rule.threshold;
        if (rule.metric === 'conversion') return stats.avgConversion >= rule.threshold;
        if (rule.metric === 'score') return avgScore >= rule.threshold;
        if (rule.metric === 'devices') return stats.totalDevices >= rule.threshold;
        return false;
    });

    const totalBonusAmount = achievedBonuses.reduce((sum, b) => sum + b.amount, 0);

    return {
      user,
      stats,
      avgScore,
      achievedBonuses,
      totalBonusAmount
    };
  }).sort((a, b) => b.stats.totalAmount - a.stats.totalAmount); // Default sort by Sales Amount

  const totalPayout = rankingData.reduce((sum, d) => sum + d.totalBonusAmount, 0);

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center">
            <Trophy className="mr-2 text-yellow-500" /> Ranking & Bonificaciones
          </h1>
          <p className="text-slate-500">Gestión de incentivos y tabla de líderes.</p>
        </div>
        <div className="mt-4 md:mt-0 flex bg-slate-100 p-1 rounded-lg">
            <button 
                onClick={() => setTimeframe('current_month')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${timeframe === 'current_month' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
                Mes Actual
            </button>
            <button 
                onClick={() => setTimeframe('all_time')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${timeframe === 'all_time' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
                Histórico
            </button>
        </div>
      </div>

      {/* Payout Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
            <p className="text-green-100 font-medium mb-1 flex items-center"><DollarSign size={16} className="mr-1"/> Total a Pagar en Bonos</p>
            <h2 className="text-4xl font-bold">RD$ {totalPayout.toLocaleString()}</h2>
            <p className="text-sm text-green-100 mt-2 opacity-80">Acumulado del periodo seleccionado</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col justify-center">
            <p className="text-slate-500 font-medium mb-1 flex items-center"><Crown size={18} className="mr-2 text-yellow-500"/> Top Performer (Ventas)</p>
            <div className="flex items-center mt-2">
                <img src={rankingData[0]?.user.avatar} className="w-12 h-12 rounded-full border-2 border-yellow-100 mr-3" alt="Top" />
                <div>
                    <h3 className="text-xl font-bold text-slate-800">{rankingData[0]?.user.name}</h3>
                    <p className="text-sm text-green-600 font-bold">RD$ {rankingData[0]?.stats.totalAmount.toLocaleString()}</p>
                </div>
            </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col justify-center">
             <p className="text-slate-500 font-medium mb-1 flex items-center"><Target size={18} className="mr-2 text-blue-500"/> Conversión Promedio Equipo</p>
             <h2 className="text-3xl font-bold text-slate-800 mt-1">
                 {Math.round(rankingData.reduce((acc, curr) => acc + curr.stats.avgConversion, 0) / rankingData.length)}%
             </h2>
             <div className="w-full bg-slate-100 rounded-full h-2 mt-3">
                 <div className="bg-blue-500 h-2 rounded-full" style={{width: `${Math.round(rankingData.reduce((acc, curr) => acc + curr.stats.avgConversion, 0) / rankingData.length)}%`}}></div>
             </div>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                        <th className="p-4 font-bold">Colaboradora</th>
                        <th className="p-4 font-bold text-right">Ventas Totales</th>
                        <th className="p-4 font-bold text-center">Conversión</th>
                        <th className="p-4 font-bold text-center">Score Prom.</th>
                        <th className="p-4 font-bold">Bonos Desbloqueados</th>
                        <th className="p-4 font-bold text-right bg-green-50/50 text-green-800">Total Ganado</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {rankingData.map((row) => (
                        <tr key={row.user.id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-4">
                                <div className="flex items-center space-x-3">
                                    <img src={row.user.avatar} className="w-10 h-10 rounded-full border border-slate-200" alt="" />
                                    <div>
                                        <p className="font-bold text-slate-800">{row.user.name}</p>
                                        <p className="text-xs text-slate-400">{row.stats.totalSales} ventas cerradas</p>
                                    </div>
                                </div>
                            </td>
                            <td className="p-4 text-right font-medium text-slate-700">
                                RD$ {row.stats.totalAmount.toLocaleString()}
                            </td>
                            <td className="p-4 text-center">
                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                    row.stats.avgConversion >= TARGETS.dailyConversion ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                                }`}>
                                    {row.stats.avgConversion}%
                                </span>
                            </td>
                            <td className="p-4 text-center">
                                <div className="font-bold text-slate-700">{row.avgScore}</div>
                            </td>
                            <td className="p-4">
                                <div className="flex flex-wrap gap-2">
                                    {row.achievedBonuses.length > 0 ? (
                                        row.achievedBonuses.map(b => (
                                            <span key={b.id} title={b.name} className="inline-flex items-center px-2 py-1 rounded border border-yellow-200 bg-yellow-50 text-yellow-700 text-xs">
                                                <Award size={10} className="mr-1" /> {b.name.split(' ')[1]}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-slate-300 text-xs italic">Sin bonos aún</span>
                                    )}
                                </div>
                            </td>
                            <td className="p-4 text-right font-bold text-green-600 bg-green-50/30">
                                RD$ {row.totalBonusAmount.toLocaleString()}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default Ranking;
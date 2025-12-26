import React from 'react';
import { ArrowUpRight } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red';
  onClick?: () => void;
}

const styles = {
  blue: { bg: 'from-blue-50 to-white', iconBg: 'bg-blue-100 text-blue-600', border: 'border-blue-100', text: 'text-blue-600' },
  green: { bg: 'from-emerald-50 to-white', iconBg: 'bg-emerald-100 text-emerald-600', border: 'border-emerald-100', text: 'text-emerald-600' },
  purple: { bg: 'from-violet-50 to-white', iconBg: 'bg-violet-100 text-violet-600', border: 'border-violet-100', text: 'text-violet-600' },
  orange: { bg: 'from-amber-50 to-white', iconBg: 'bg-amber-100 text-amber-600', border: 'border-amber-100', text: 'text-amber-600' },
  red: { bg: 'from-rose-50 to-white', iconBg: 'bg-rose-100 text-rose-600', border: 'border-rose-100', text: 'text-rose-600' },
};

const KPICard: React.FC<KPICardProps> = ({ 
  title, 
  value, 
  subtitle, 
  icon, 
  trend, 
  trendValue,
  color = 'blue',
  onClick
}) => {
  const currentStyle = styles[color];

  return (
    <div 
      onClick={onClick}
      className={`
        relative overflow-hidden rounded-2xl p-6 
        bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50
        transition-all duration-300 ease-out group
        ${onClick ? 'cursor-pointer hover:-translate-y-1' : ''}
      `}
    >
      {/* Background Gradient Splash */}
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${currentStyle.bg} opacity-50 rounded-full blur-2xl -mr-10 -mt-10 transform transition-transform group-hover:scale-150`}></div>

      <div className="relative z-10 flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl ${currentStyle.iconBg} shadow-sm group-hover:scale-110 transition-transform duration-300`}>
          {icon}
        </div>
        {onClick && (
          <div className="p-2 rounded-full text-slate-300 group-hover:text-primary-600 group-hover:bg-slate-50 transition-colors">
              <ArrowUpRight size={20} />
          </div>
        )}
      </div>
      
      <div className="relative z-10">
        <h3 className="text-3xl font-bold text-slate-800 tracking-tight mb-1">{value}</h3>
        <p className="text-sm font-medium text-slate-500">{title}</p>
      </div>
      
      {(subtitle || trendValue) && (
        <div className="relative z-10 mt-4 flex items-center pt-3 border-t border-slate-50">
          {trendValue && (
            <span className={`flex items-center text-xs font-bold px-2 py-1 rounded-md mr-2 ${
              trend === 'up' ? 'bg-green-50 text-green-700' : trend === 'down' ? 'bg-red-50 text-red-700' : 'bg-slate-50 text-slate-600'
            }`}>
              {trend === 'up' && '↗'} {trend === 'down' && '↘'} {trendValue}
            </span>
          )}
          {subtitle && <span className="text-xs text-slate-400 font-medium truncate">{subtitle}</span>}
        </div>
      )}
    </div>
  );
};

export default KPICard;
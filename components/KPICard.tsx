import React from 'react';
import { ArrowRight } from 'lucide-react';

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

const colorMap = {
  blue: 'bg-blue-50 text-blue-600',
  green: 'bg-green-50 text-green-600',
  purple: 'bg-purple-50 text-purple-600',
  orange: 'bg-orange-50 text-orange-600',
  red: 'bg-red-50 text-red-600',
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
  return (
    <div 
      onClick={onClick}
      className={`bg-white rounded-xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between transition-all group relative overflow-hidden ${
        onClick ? 'cursor-pointer hover:shadow-md hover:border-blue-200 active:scale-[0.99]' : ''
      }`}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
        </div>
        {icon && (
          <div className={`p-3 rounded-lg ${colorMap[color]} transition-colors group-hover:bg-opacity-80`}>
            {icon}
          </div>
        )}
      </div>
      
      {(subtitle || trendValue) && (
        <div className="flex items-center text-sm justify-between">
          <div className="flex items-center">
            {trendValue && (
              <span className={`font-medium mr-2 ${
                trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-slate-600'
              }`}>
                {trend === 'up' && '↑'} {trend === 'down' && '↓'} {trendValue}
              </span>
            )}
            {subtitle && <span className="text-slate-400">{subtitle}</span>}
          </div>
        </div>
      )}
      
      {onClick && (
        <div className="absolute bottom-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <ArrowRight size={16} className="text-slate-300" />
        </div>
      )}
    </div>
  );
};

export default KPICard;
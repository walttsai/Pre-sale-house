import React from 'react';

interface StatCardProps {
  title: string;
  value: string;
  subtext?: string;
  icon?: React.ReactNode;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, subtext, icon }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-lg border border-slate-100 flex items-start justify-between transition-all duration-300 hover:-translate-y-1">
    <div>
      <p className="text-sm font-semibold text-slate-500 mb-2 uppercase tracking-wide">{title}</p>
      <h4 className="text-3xl font-bold text-slate-800 tracking-tight">{value}</h4>
      {subtext && <p className="text-xs text-slate-400 mt-2 font-medium">{subtext}</p>}
    </div>
    {icon && <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600 ring-1 ring-indigo-100">{icon}</div>}
  </div>
);
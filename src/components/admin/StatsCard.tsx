import React from 'react';
import { cn } from '../../lib/utils';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend: string;
  isUp: boolean;
}

export default function StatsCard({ title, value, icon, trend, isUp }: StatsCardProps) {
  return (
    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="p-3 bg-gray-50 rounded-2xl">
          {icon}
        </div>
        <div className={cn(
          "flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full",
          isUp ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"
        )}>
          {isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {trend}
        </div>
      </div>
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{title}</p>
        <h4 className="text-2xl font-black italic">{value}</h4>
      </div>
    </div>
  );
}

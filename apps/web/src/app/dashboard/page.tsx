'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  FileText, Clock, CheckCircle, XCircle, AlertTriangle,
  TrendingUp, Users, Brain,
} from 'lucide-react';

interface KPIs {
  totalAdvances: number;
  pendingAdvances: number;
  reviewedAdvances: number;
  rejectedAdvances: number;
  observedAdvances: number;
  avgAIScore: number;
  avgAIGrade: number;
  avgHumanGrade: number;
  plagiarismAlerts: number;
  recentActivity: any[];
}

export default function DashboardPage() {
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/kpis')
      .then((res) => setKpis(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="px-4 py-5 sm:p-6 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-[var(--surface)] rounded-xl animate-pulse border border-[var(--border-color)]" />
        ))}
      </div>
    );
  }

  const cards = [
    { label: 'Total Avances', value: kpis?.totalAdvances || 0, icon: FileText, colorClass: 'text-blue-500 dark:text-blue-400', bgClass: 'bg-blue-50 dark:bg-blue-500/10' },
    { label: 'Pendientes', value: kpis?.pendingAdvances || 0, icon: Clock, colorClass: 'text-amber-500 dark:text-amber-400', bgClass: 'bg-amber-50 dark:bg-amber-500/10' },
    { label: 'Aprobados', value: kpis?.reviewedAdvances || 0, icon: CheckCircle, colorClass: 'text-emerald-500 dark:text-emerald-400', bgClass: 'bg-emerald-50 dark:bg-emerald-500/10' },
    { label: 'Rechazados', value: kpis?.rejectedAdvances || 0, icon: XCircle, colorClass: 'text-red-500 dark:text-red-400', bgClass: 'bg-red-50 dark:bg-red-500/10' },
    { label: 'Nota Prom. IA', value: kpis?.avgAIGrade?.toFixed(1) || '0.0', icon: Brain, colorClass: 'text-purple-500 dark:text-purple-400', bgClass: 'bg-purple-50 dark:bg-purple-500/10' },
    { label: 'Nota Prom. Humana', value: kpis?.avgHumanGrade?.toFixed(1) || '0.0', icon: TrendingUp, colorClass: 'text-blue-500 dark:text-blue-400', bgClass: 'bg-blue-50 dark:bg-blue-500/10' },
    { label: 'Alertas Plagio', value: kpis?.plagiarismAlerts || 0, icon: AlertTriangle, colorClass: 'text-red-500 dark:text-red-400', bgClass: 'bg-red-50 dark:bg-red-500/10' },
    { label: 'Score IA Prom.', value: `${kpis?.avgAIScore?.toFixed(0) || 0}%`, icon: Brain, colorClass: 'text-emerald-500 dark:text-emerald-400', bgClass: 'bg-emerald-50 dark:bg-emerald-500/10' },
  ];

  return (
    <div className="px-4 py-5 sm:p-6 space-y-5 sm:space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[var(--text-primary)]">Dashboard</h1>
        <p className="text-sm text-[var(--text-muted)] mt-0.5">Vista general del sistema de revisión de tesis</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="bg-[var(--surface)] rounded-xl border border-[var(--border-color)] p-4 hover:shadow-sm dark:hover:shadow-none dark:hover:border-white/15 transition-all animate-fade-in"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 rounded-lg ${card.bgClass} flex items-center justify-center`}>
                <card.icon className={`w-4.5 h-4.5 ${card.colorClass}`} />
              </div>
            </div>
            <p className="text-2xl font-semibold text-[var(--text-primary)]">{card.value}</p>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Activity feed */}
      <div className="bg-[var(--surface)] rounded-xl border border-[var(--border-color)] p-5">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Actividad reciente</h3>
        <div className="space-y-3">
          {(kpis?.recentActivity || []).slice(0, 8).map((activity: any) => (
            <div key={activity.id} className="flex items-center gap-3 py-2 border-b border-[var(--border-color)] last:border-0">
              <div className="w-8 h-8 rounded-full bg-[var(--surface-2)] flex items-center justify-center flex-shrink-0">
                <FileText className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-[var(--text-secondary)] truncate">{activity.message}</p>
                <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                  {new Date(activity.createdAt).toLocaleString('es-PE')}
                </p>
              </div>
            </div>
          ))}
          {(!kpis?.recentActivity || kpis.recentActivity.length === 0) && (
            <p className="text-sm text-[var(--text-muted)] text-center py-6">No hay actividad reciente</p>
          )}
        </div>
      </div>
    </div>
  );
}

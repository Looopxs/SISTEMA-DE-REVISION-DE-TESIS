'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { BarChart3, Users, Award, GraduationCap, TrendingUp, BookOpen, Sparkles } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';

export default function StatisticsPage() {
  const [stats, setStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    api.get('/dashboard/stats-by-program')
      .then((res) => setStats(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const chartData = stats.map(s => {
    const scores = s.advances.map((a: any) => a.aiAnalysis?.overallScore).filter((score: any) => score !== null && score !== undefined);
    const avgScore = scores.length ? scores.reduce((a: number, b: number) => a + b, 0) / scores.length : 0;
    return { name: s.code || s.name.substring(0, 15), fullName: s.name, students: s._count.users, avgScore: Math.round(avgScore) };
  });

  // Calculate metrics
  const totalPrograms = stats.length;
  const totalStudents = stats.reduce((acc, s) => acc + s._count.users, 0);
  const allScores = stats.flatMap(s => s.advances.map((a: any) => a.aiAnalysis?.overallScore).filter((score: any) => score !== null && score !== undefined));
  const overallAvgScore = allScores.length ? allScores.reduce((a: number, b: number) => a + b, 0) / allScores.length : 0;

  // Hydration protection
  if (!mounted) {
    return (
      <div className="p-8 space-y-6">
        <div className="h-10 w-48 bg-slate-200 rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-28 bg-white rounded-2xl border border-slate-100 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-white rounded-2xl border border-slate-100 animate-pulse" />
          <div className="h-80 bg-white rounded-2xl border border-slate-100 animate-pulse" />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary-500 animate-pulse" />
          <h2 className="text-slate-400 font-semibold">Cargando estadísticas de JORANA IA...</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-28 bg-white rounded-2xl border border-slate-100 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-white rounded-2xl border border-slate-100 animate-pulse" />
          <div className="h-80 bg-white rounded-2xl border border-slate-100 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-5 sm:p-8 space-y-5 sm:space-y-8 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 leading-tight">Estadísticas de JORANA IA</h1>
        <p className="text-sm text-slate-500 mt-1">Métricas integradas del rendimiento académico y demografía estudiantil por programa de posgrado.</p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { l: 'Programas de Posgrado', v: totalPrograms, i: GraduationCap, bg: 'from-blue-500 to-indigo-500', iconBg: 'bg-indigo-50 text-indigo-600', desc: 'Programas académicos activos' },
          { l: 'Estudiantes Registrados', v: totalStudents, i: Users, bg: 'from-emerald-500 to-teal-500', iconBg: 'bg-emerald-50 text-emerald-600', desc: 'Estudiantes en la plataforma' },
          { l: 'Promedio de Score IA', v: `${Math.round(overallAvgScore)}%`, i: Award, bg: 'from-purple-500 to-pink-500', iconBg: 'bg-purple-50 text-purple-600', desc: 'Calificación promedio global de IA' }
        ].map((card, idx) => {
          const Icon = card.i;
          return (
            <div key={idx} className="relative overflow-hidden bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-all duration-300 group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full blur-2xl group-hover:bg-slate-100/50 transition-colors -z-10 translate-x-10 -translate-y-10"></div>
              <div className="flex items-center gap-4">
                <div className={`p-3.5 rounded-xl ${card.iconBg} font-semibold transition-transform duration-300 group-hover:scale-110`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">{card.l}</span>
                  <span className="text-2xl font-black text-slate-900 mt-0.5 block">{card.v}</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">{card.desc}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Average IA Score */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2.5">
              <BarChart3 className="w-4 h-4 text-indigo-500" />
              <span>Promedio de Score IA por Programa</span>
            </h3>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 uppercase">
              Rendimiento
            </span>
          </div>

          <div className="h-72">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B', fontWeight: 500 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748B', fontWeight: 500 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                  <Tooltip
                    cursor={{ fill: '#F8FAFC' }}
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                      color: '#FFF',
                      fontSize: '12px',
                      padding: '10px 14px'
                    }}
                    labelFormatter={(label, items) => {
                      const item = items[0]?.payload;
                      return item ? item.fullName : label;
                    }}
                  />
                  <Bar dataKey="avgScore" fill="#6366F1" radius={[6, 6, 0, 0]} maxBarSize={45}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#4F46E5' : '#6366F1'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">Sin información de calificaciones</div>
            )}
          </div>
        </div>

        {/* Chart 2: Students Count */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2.5">
              <Users className="w-4 h-4 text-emerald-500" />
              <span>Estudiantes por Programa</span>
            </h3>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 uppercase">
              Demografía
            </span>
          </div>

          <div className="h-72">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#64748B', fontWeight: 500 }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#64748B', fontWeight: 500 }} axisLine={false} tickLine={false} width={80} />
                  <Tooltip
                    cursor={{ fill: '#F8FAFC' }}
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                      color: '#FFF',
                      fontSize: '12px',
                      padding: '10px 14px'
                    }}
                    labelFormatter={(label, items) => {
                      const item = items[0]?.payload;
                      return item ? item.fullName : label;
                    }}
                  />
                  <Bar dataKey="students" fill="#10B981" radius={[0, 6, 6, 0]} maxBarSize={35}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#059669' : '#10B981'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">Sin información de estudiantes</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

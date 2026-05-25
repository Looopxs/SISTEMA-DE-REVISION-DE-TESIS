'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import Cookies from 'js-cookie';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/login', { email, password });
      Cookies.set('kimy_token', res.data.accessToken, { expires: 7 });
      Cookies.set('kimy_user', JSON.stringify(res.data.user), { expires: 7 });
      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error de autenticación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[var(--bg)] transition-colors duration-200">
      {/* Theme toggle — floating */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      {/* Panel izquierdo - decorativo */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#0F172A] via-[#1E3A5F] to-[#185FA5] relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-32 right-16 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl"></div>
        </div>
        <div className="relative z-10 text-center px-12">
          <div className="w-20 h-20 mx-auto mb-8 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
            <span className="text-3xl font-bold text-white">J</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">JORANA IA</h1>
          <p className="text-xl text-blue-200 mb-2">Sistema de Revisión Inteligente</p>
          <p className="text-sm text-blue-300/70 max-w-md">
            Evaluación automatizada de avances de tesis con inteligencia artificial.
            Retroalimentación accionable para estudiantes y herramientas de gestión para revisores.
          </p>
          <div className="mt-12 grid grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-2xl font-bold text-white">IA</div>
              <div className="text-xs text-blue-300/60 mt-1">Análisis GPT-4o</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">100%</div>
              <div className="text-xs text-blue-300/60 mt-1">Trazabilidad</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">PDF</div>
              <div className="text-xs text-blue-300/60 mt-1">Reportes</div>
            </div>
          </div>
        </div>
      </div>

      {/* Panel derecho - formulario */}
      <div className="flex-1 flex items-center justify-center px-5 sm:px-8 py-12 bg-[var(--surface)] transition-colors duration-200">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 text-center">
            <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-primary-500 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">J</span>
            </div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">JORANA IA</h1>
          </div>

          <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-1">Iniciar sesión</h2>
          <p className="text-sm text-[var(--text-muted)] mb-8">Ingresa tus credenciales para acceder al sistema</p>

          {error && (
            <div className="mb-6 p-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-sm text-red-700 dark:text-red-400 animate-fade-in">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg)] text-[var(--text-primary)] text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all placeholder:text-[var(--text-muted)]"
                placeholder="tu@universidad.edu"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg)] text-[var(--text-primary)] text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all placeholder:text-[var(--text-muted)]"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Ingresando...
                </span>
              ) : 'Iniciar sesión'}
            </button>
          </form>

          <div className="mt-8 p-4 rounded-lg bg-[var(--surface-2)] border border-[var(--border-color)]">
            <p className="text-xs font-medium text-[var(--text-muted)] mb-2">Credenciales de prueba:</p>
            <div className="space-y-1 text-xs text-[var(--text-secondary)] font-mono">
              <p>admin@kimy.edu / Kimy2026!</p>
              <p>coordinador@kimy.edu / Kimy2026!</p>
              <p>asesor1@kimy.edu / Kimy2026!</p>
              <p>estudiante1@kimy.edu / Kimy2026!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

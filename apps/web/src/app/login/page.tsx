'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import Cookies from 'js-cookie';
import { ThemeToggle } from '@/components/ThemeToggle';
import Image from 'next/image';
import { Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center border-r border-[var(--border-color)]">
        <div className="text-center px-12">
          <div className="relative w-32 h-32 mx-auto mb-6 flex items-center justify-center overflow-hidden rounded-[2rem]">
            <div className="relative w-full h-full">
              <Image 
                src="/logo-jorana.png" 
                alt="JORANA IA Logo" 
                fill 
                className="object-cover object-top scale-[1.8] origin-top mix-blend-multiply dark:mix-blend-screen dark:invert dark:hue-rotate-180 dark:brightness-[1.5] dark:contrast-[1.2]" 
                priority
              />
            </div>
          </div>
          <p className="text-xl text-[var(--text-primary)] mb-2 font-medium transition-colors">Sistema de Revisión Inteligente</p>
          <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto transition-colors">
            Evaluación automatizada de avances de tesis con inteligencia artificial.
            Retroalimentación accionable para estudiantes y herramientas de gestión para revisores.
          </p>
          <div className="mt-12 grid grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-2xl font-bold text-[var(--text-primary)] transition-colors">IA</div>
              <div className="text-xs text-[var(--text-muted)] mt-1 transition-colors">Análisis GPT-4o</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-[var(--text-primary)] transition-colors">100%</div>
              <div className="text-xs text-[var(--text-muted)] mt-1 transition-colors">Trazabilidad</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-[var(--text-primary)] transition-colors">PDF</div>
              <div className="text-xs text-[var(--text-muted)] mt-1 transition-colors">Reportes</div>
            </div>
          </div>
        </div>
      </div>

      {/* Panel derecho - formulario */}
      <div className="flex-1 flex items-center justify-center px-5 sm:px-8 py-12 transition-colors duration-200">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 text-center flex flex-col items-center">
            <div className="relative w-24 h-24 mx-auto mb-2 overflow-hidden rounded-2xl">
              <div className="relative w-full h-full">
                <Image 
                  src="/logo-jorana.png" 
                  alt="JORANA IA" 
                  fill 
                  className="object-cover object-top scale-[1.8] origin-top mix-blend-multiply dark:mix-blend-screen dark:invert dark:hue-rotate-180 dark:brightness-[1.5] dark:contrast-[1.2]"
                  priority
                />
              </div>
            </div>
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
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 pr-12 rounded-lg border border-[var(--border-color)] bg-[var(--bg)] text-[var(--text-primary)] text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all placeholder:text-[var(--text-muted)]"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
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


        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import Cookies from 'js-cookie';
import {
  LayoutDashboard, FileText, Upload, Users, BookTemplate,
  BarChart3, Settings, LogOut, Brain, Shield, BookOpen,
  Bell, ChevronLeft, Menu, X, FileOutput, Wand2, Microscope, Mail,
} from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import ChatbotWidget from '@/components/ChatbotWidget';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, color: 'text-blue-500', roles: ['ADMIN', 'COORDINATOR', 'ADVISOR', 'STUDENT'] },
  { href: '/dashboard/advances', label: 'Avances', icon: FileText, color: 'text-indigo-500', roles: ['ADMIN', 'COORDINATOR', 'ADVISOR', 'STUDENT'] },
  { href: '/dashboard/upload', label: 'Subir Avance', icon: Upload, color: 'text-emerald-500', roles: ['ADMIN', 'COORDINATOR', 'STUDENT'] },
  { href: '/dashboard/templates', label: 'Doc. Patrón', icon: BookTemplate, color: 'text-cyan-500', roles: ['ADMIN', 'COORDINATOR'] },
  { href: '/dashboard/users', label: 'Usuarios', icon: Users, color: 'text-orange-500', roles: ['ADMIN', 'COORDINATOR'] },
  { href: '/dashboard/statistics', label: 'Estadísticas', icon: BarChart3, color: 'text-purple-500', roles: ['ADMIN', 'COORDINATOR', 'ADVISOR'] },
  { href: '/dashboard/fine-tuning', label: 'Fine-tuning IA', icon: Brain, color: 'text-fuchsia-500', roles: ['ADMIN'] },
  { href: '/dashboard/plagiarism', label: 'Plagio', icon: Shield, color: 'text-rose-500', roles: ['ADMIN', 'COORDINATOR', 'ADVISOR'] },
  { href: '/dashboard/references', label: 'Referencias', icon: BookOpen, color: 'text-teal-500', roles: ['ADMIN', 'COORDINATOR', 'ADVISOR'] },
  { href: '/dashboard/report', label: 'Generar Informe', icon: FileOutput, color: 'text-sky-500', roles: ['ADMIN', 'COORDINATOR', 'ADVISOR', 'STUDENT'] },
  { href: '/dashboard/thesis-generator', label: 'Generar Tesis IA', icon: Wand2, color: 'text-violet-500', roles: ['ADMIN', 'COORDINATOR', 'ADVISOR', 'STUDENT'] },
  { href: '/dashboard/article-reviewer', label: 'Revisor de Artículos', icon: Microscope, color: 'text-pink-500', roles: ['ADMIN', 'COORDINATOR', 'ADVISOR', 'STUDENT'] },
  { href: '/dashboard/email-sender', label: 'Envío Automatizado', icon: Mail, color: 'text-amber-500', roles: ['ADMIN', 'COORDINATOR'] },
  { href: '/dashboard/settings', label: 'Configuración', icon: Settings, color: 'text-slate-400', roles: ['ADMIN'] },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userData = Cookies.get('kimy_user');
    if (userData) {
      try { setUser(JSON.parse(userData)); } catch {}
    } else {
      window.location.href = '/login';
    }
  }, []);

  const handleLogout = () => {
    Cookies.remove('kimy_token');
    Cookies.remove('kimy_user');
    window.location.href = '/login';
  };

  // Close sidebar on mobile when navigating
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const filteredItems = NAV_ITEMS.filter(
    (item) => !user || item.roles.includes(user.role),
  );

  if (!user) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg)] transition-colors duration-200">
      {/* Sidebar Backdrop for Mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 md:hidden transition-opacity duration-300"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 md:relative md:flex flex-col bg-[var(--sidebar-bg)] border-r border-[var(--sidebar-border)] transition-all duration-300 flex-shrink-0 shadow-2xl md:shadow-none ${
          mobileOpen ? 'translate-x-0 w-60' : '-translate-x-full md:translate-x-0'
        } ${collapsed ? 'md:w-16' : 'md:w-60'}`}
      >
        {/* Logo */}
        <div className={`h-16 flex items-center border-b border-[var(--sidebar-border)] flex-shrink-0 transition-colors ${collapsed && !mobileOpen ? 'justify-center px-0 flex-col' : 'justify-between px-4'}`}>
          <div className="flex items-center justify-center relative mix-blend-multiply dark:mix-blend-screen overflow-hidden rounded-xl">
            <div className={`relative flex-shrink-0 transition-all duration-300 ${collapsed && !mobileOpen ? 'w-10 h-10 mt-1' : 'w-12 h-12'}`}>
              <Image 
                src="/logo-jorana.png" 
                alt="JORANA IA" 
                fill 
                className="object-cover object-top scale-[1.8] origin-top dark:invert dark:hue-rotate-180 dark:brightness-[1.5] dark:contrast-[1.2]"
                priority
              />
            </div>
          </div>
          <div className="flex items-center gap-1">
            {/* Close button on mobile */}
            <button
              onClick={() => setMobileOpen(false)}
              className="p-1.5 rounded-md hover:bg-[var(--sidebar-hover-bg)] text-[var(--sidebar-text)] md:hidden transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            {/* Collapse button on desktop */}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden md:inline-flex p-1.5 rounded-md hover:bg-[var(--sidebar-hover-bg)] text-[var(--sidebar-text)] transition-colors"
            >
              {collapsed ? <Menu className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-2 space-y-0.5 overflow-y-auto">
          {filteredItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex items-center gap-3 px-3 py-2.5 mx-2 rounded-xl text-sm font-medium transition-all duration-300 group overflow-hidden ${
                  isActive
                    ? 'bg-gradient-to-r from-primary-500/10 to-transparent text-primary-600 dark:text-primary-300 shadow-sm shadow-primary-500/5'
                    : 'text-[var(--sidebar-text)] hover:bg-[var(--sidebar-hover-bg)] hover:text-[var(--sidebar-text-hover)]'
                }`}
                title={collapsed && !mobileOpen ? item.label : undefined}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary-500 rounded-r-full shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div>
                )}
                <item.icon className={`w-4.5 h-4.5 flex-shrink-0 transition-transform duration-300 group-hover:scale-110 ${isActive ? item.color : `${item.color} opacity-70 group-hover:opacity-100 dark:opacity-80`}`} />
                {(!collapsed || mobileOpen) && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="border-t border-[var(--sidebar-border)] p-3 flex-shrink-0 transition-colors">
          <div className={`flex items-center ${collapsed && !mobileOpen ? 'justify-center' : 'gap-3'}`}>
            <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-semibold text-primary-600 dark:text-primary-300">
                {user.name?.charAt(0) || 'U'}
              </span>
            </div>
            {(!collapsed || mobileOpen) && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-[var(--sidebar-text-hover)] truncate transition-colors">{user.name}</p>
                <p className="text-[10px] text-[var(--sidebar-text)] transition-colors">{user.role}</p>
              </div>
            )}
            {(!collapsed || mobileOpen) && (
              <button onClick={handleLogout} className="p-1.5 rounded-md hover:bg-[var(--sidebar-hover-bg)] text-[var(--sidebar-text)] hover:text-red-500 dark:hover:text-red-400 transition-colors">
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Topbar */}
        <header className="h-14 bg-[var(--topbar-bg)] border-b border-[var(--topbar-border)] flex items-center justify-between px-4 sm:px-6 flex-shrink-0 transition-colors duration-200">
          <div className="flex items-center gap-3">
            {/* Hamburger on mobile */}
            <button
              onClick={() => setMobileOpen(true)}
              className="p-2 -ml-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 md:hidden text-gray-600 dark:text-gray-400 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">
              {filteredItems.find((i) => pathname.startsWith(i.href))?.label || 'JORANA IA'}
            </h2>
          </div>
          <div className="flex items-center gap-1">
            {/* Theme toggle */}
            <ThemeToggle />
            {/* Notifications */}
            <Link
              href="/dashboard/notifications"
              className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
            >
              <Bell className="w-4.5 h-4.5 text-gray-500 dark:text-gray-400" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-primary-500 rounded-full"></span>
            </Link>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden bg-[var(--bg)] transition-colors duration-200">
          {children}
        </div>
      </main>

      {/* Chatbot Widget – floating on every dashboard page */}
      <ChatbotWidget />
    </div>
  );
}

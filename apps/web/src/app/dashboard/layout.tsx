'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Cookies from 'js-cookie';
import {
  LayoutDashboard, FileText, Upload, Users, BookTemplate,
  BarChart3, Settings, LogOut, Brain, Shield, BookOpen,
  Bell, ChevronLeft, Menu, X,
} from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'COORDINATOR', 'ADVISOR', 'STUDENT'] },
  { href: '/dashboard/advances', label: 'Avances', icon: FileText, roles: ['ADMIN', 'COORDINATOR', 'ADVISOR', 'STUDENT'] },
  { href: '/dashboard/upload', label: 'Subir Avance', icon: Upload, roles: ['ADMIN', 'COORDINATOR', 'STUDENT'] },
  { href: '/dashboard/templates', label: 'Doc. Patrón', icon: BookTemplate, roles: ['ADMIN', 'COORDINATOR'] },
  { href: '/dashboard/users', label: 'Usuarios', icon: Users, roles: ['ADMIN', 'COORDINATOR'] },
  { href: '/dashboard/statistics', label: 'Estadísticas', icon: BarChart3, roles: ['ADMIN', 'COORDINATOR', 'ADVISOR'] },
  { href: '/dashboard/fine-tuning', label: 'Fine-tuning IA', icon: Brain, roles: ['ADMIN'] },
  { href: '/dashboard/plagiarism', label: 'Plagio', icon: Shield, roles: ['ADMIN', 'COORDINATOR', 'ADVISOR'] },
  { href: '/dashboard/references', label: 'Referencias', icon: BookOpen, roles: ['ADMIN', 'COORDINATOR', 'ADVISOR'] },
  { href: '/dashboard/settings', label: 'Configuración', icon: Settings, roles: ['ADMIN'] },
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
        className={`fixed inset-y-0 left-0 z-50 md:relative md:flex flex-col bg-[var(--sidebar-bg)] transition-all duration-300 flex-shrink-0 ${
          mobileOpen ? 'translate-x-0 w-60' : '-translate-x-full md:translate-x-0'
        } ${collapsed ? 'md:w-16' : 'md:w-60'}`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/5 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center flex-shrink-0 shadow-sm">
              <span className="text-sm font-bold text-white">J</span>
            </div>
            {(!collapsed || mobileOpen) && (
              <span className="text-base font-semibold text-white animate-fade-in">JORANA IA</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {/* Close button on mobile */}
            <button
              onClick={() => setMobileOpen(false)}
              className="p-1.5 rounded-md hover:bg-white/5 text-gray-400 md:hidden transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            {/* Collapse button on desktop */}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden md:inline-flex p-1.5 rounded-md hover:bg-white/5 text-gray-400 transition-colors"
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
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 group ${
                  isActive
                    ? 'bg-primary-500/15 text-primary-300'
                    : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                }`}
                title={collapsed && !mobileOpen ? item.label : undefined}
              >
                <item.icon className={`w-4.5 h-4.5 flex-shrink-0 ${isActive ? 'text-primary-400' : 'text-gray-500 group-hover:text-gray-300'}`} />
                {(!collapsed || mobileOpen) && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="border-t border-white/5 p-3 flex-shrink-0">
          <div className={`flex items-center ${collapsed && !mobileOpen ? 'justify-center' : 'gap-3'}`}>
            <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-semibold text-primary-300">
                {user.name?.charAt(0) || 'U'}
              </span>
            </div>
            {(!collapsed || mobileOpen) && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-200 truncate">{user.name}</p>
                <p className="text-[10px] text-gray-500">{user.role}</p>
              </div>
            )}
            {(!collapsed || mobileOpen) && (
              <button onClick={handleLogout} className="p-1.5 rounded-md hover:bg-white/5 text-gray-500 hover:text-red-400 transition-colors">
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
    </div>
  );
}

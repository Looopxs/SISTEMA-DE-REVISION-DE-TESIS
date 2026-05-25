'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from './ThemeProvider';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors group"
      title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
    >
      {/* Sun icon - visible en dark mode */}
      <Sun
        className={`w-4.5 h-4.5 text-yellow-500 transition-all duration-300 absolute inset-2 ${
          theme === 'dark'
            ? 'opacity-100 scale-100 rotate-0'
            : 'opacity-0 scale-50 rotate-90'
        }`}
      />
      {/* Moon icon - visible en light mode */}
      <Moon
        className={`w-4.5 h-4.5 text-gray-500 dark:text-gray-400 transition-all duration-300 ${
          theme === 'dark'
            ? 'opacity-0 scale-50 -rotate-90'
            : 'opacity-100 scale-100 rotate-0'
        }`}
      />
    </button>
  );
}

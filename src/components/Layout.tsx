import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { LayoutGrid, FileText, DollarSign, Users, Moon, Sun, UserMinus, Umbrella, Shield } from 'lucide-react';
import { getCurrentUser } from '../services/users';

function Layout() {
  const location = useLocation();
  const isActive = (path: string) => location.pathname.startsWith(path);
  const [isAdmin, setIsAdmin] = useState(false);

  // Verificar se o usuário é admin
  useEffect(() => {
    const checkAdmin = async () => {
      const user = await getCurrentUser();
      setIsAdmin(user?.role === 'admin');
    };
    checkAdmin();
  }, []);

  // Gerenciar tema
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-64 bg-surface border-r border-border/10">
        <div className="flex flex-col h-full">
          {/* Logo e Theme Toggle */}
          <div className="p-6 flex justify-between items-center">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-sky-400 to-blue-500 dark:from-sky-300 dark:to-blue-400 bg-clip-text text-transparent">
              LIMPAX
            </h1>
            <button
              onClick={() => setIsDark(!isDark)}
              className="p-2 text-text-secondary hover:text-text transition-colors rounded-lg hover:bg-surface-hover"
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 space-y-1">
            <NavLink
              to="/dashboard"
              className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                isActive('/dashboard')
                  ? 'bg-primary/10 text-primary'
                  : 'text-text-secondary hover:bg-surface-hover hover:text-text'
              }`}
            >
              <LayoutGrid size={20} className="mr-3" />
              Dashboard
            </NavLink>

            <NavLink
              to="/contracts"
              className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                isActive('/contracts')
                  ? 'bg-primary/10 text-primary'
                  : 'text-text-secondary hover:bg-surface-hover hover:text-text'
              }`}
            >
              <FileText size={20} className="mr-3" />
              Contratos
            </NavLink>

            <NavLink
              to="/finances"
              className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                isActive('/finances')
                  ? 'bg-primary/10 text-primary'
                  : 'text-text-secondary hover:bg-surface-hover hover:text-text'
              }`}
            >
              <DollarSign size={20} className="mr-3" />
              Finanças
            </NavLink>

            <div className="py-2">
              <div className="text-xs font-medium text-text-secondary uppercase tracking-wider px-3 mb-2">
                Funcionários
              </div>
              
              <NavLink
                to="/employees"
                className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                  isActive('/employees')
                    ? 'bg-primary/10 text-primary'
                    : 'text-text-secondary hover:bg-surface-hover hover:text-text'
                }`}
              >
                <Users size={20} className="mr-3" />
                Cadastro
              </NavLink>

              <NavLink
                to="/employee-dismissals"
                className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                  isActive('/employee-dismissals')
                    ? 'bg-primary/10 text-primary'
                    : 'text-text-secondary hover:bg-surface-hover hover:text-text'
                }`}
              >
                <UserMinus size={20} className="mr-3" />
                Baixas
              </NavLink>

              <NavLink
                to="/employee-vacations"
                className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                  isActive('/employee-vacations')
                    ? 'bg-primary/10 text-primary'
                    : 'text-text-secondary hover:bg-surface-hover hover:text-text'
                }`}
              >
                <Umbrella size={20} className="mr-3" />
                Férias
              </NavLink>
            </div>

            {/* Seção de Administração - Só aparece para admins */}
            {isAdmin && (
              <div className="py-2">
                <div className="text-xs font-medium text-text-secondary uppercase tracking-wider px-3 mb-2">
                  Administração
                </div>
                
                <NavLink
                  to="/users"
                  className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                    isActive('/users')
                      ? 'bg-primary/10 text-primary'
                      : 'text-text-secondary hover:bg-surface-hover hover:text-text'
                  }`}
                >
                  <Shield size={20} className="mr-3" />
                  Usuários
                </NavLink>
              </div>
            )}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="pl-64">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default Layout;

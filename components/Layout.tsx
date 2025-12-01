import React, { useState } from 'react';
import { User } from '../types';
import { LayoutDashboard, FileText, Settings, LogOut, Code, Shield, Activity, Users, Menu, X, ArrowLeft } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  currentView: string;
  setView: (view: string) => void;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, user, currentView, setView, onLogout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleNavClick = (viewName: string) => {
    setView(viewName);
    setIsMobileMenuOpen(false); // Fecha o menu automaticamente ao clicar no mobile
  };

  return (
    <div className="min-h-screen flex bg-slate-50 relative">
      
      {/* Mobile Overlay (Fundo escuro quando menu está aberto) */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white flex flex-col transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0 md:static md:h-screen
      `}>
        <div className="p-6 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white text-lg font-bold">N</div>
                Notar
            </h1>
            <div className="mt-6 px-3 py-2 bg-slate-800 rounded-lg">
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Logado como</p>
                <p className="text-sm font-medium truncate w-40">{user.name}</p>
                <p className="text-xs text-slate-400 capitalize">{user.role === 'business' ? 'Empresário' : user.role === 'admin' ? 'Super Admin' : 'Contador'}</p>
            </div>
          </div>
          
          {/* Botão VOLTAR (Apenas Mobile) */}
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden text-slate-400 hover:text-white p-1"
            title="Voltar / Fechar Menu"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto">
          <button 
            onClick={() => handleNavClick('dashboard')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${currentView === 'dashboard' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            {user.role === 'admin' ? <Shield size={20} /> : <LayoutDashboard size={20} />}
            <span>{user.role === 'admin' ? 'Admin Painel' : 'Dashboard'}</span>
          </button>
          
          {user.role === 'admin' && (
            <>
                 <button 
                    onClick={() => handleNavClick('admin_clients')}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${currentView === 'admin_clients' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                 >
                    <Users size={20} />
                    <span>Gestão Clientes</span>
                 </button>
                 <button 
                    onClick={() => handleNavClick('admin_audit')}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${currentView === 'admin_audit' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                 >
                    <Activity size={20} />
                    <span>Auditoria</span>
                 </button>
            </>
          )}

          <button 
             onClick={() => handleNavClick('architecture')}
             className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${currentView === 'architecture' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <Code size={20} />
            <span>Arquitetura & API</span>
          </button>

          <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
            <Settings size={20} />
            <span>Configurações</span>
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={onLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut size={20} />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 shrink-0">
            <div className="flex items-center gap-3">
                {/* Botão Menu Hambúrguer (Apenas Mobile) */}
                <button 
                    onClick={() => setIsMobileMenuOpen(true)}
                    className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                    <Menu size={24} />
                </button>
                
                <h2 className="text-lg font-semibold text-slate-700 capitalize truncate">
                    {currentView === 'dashboard' ? (user.role === 'admin' ? 'Controle de Aprovações' : 'Visão Geral') : 
                    currentView === 'admin_clients' ? 'Gestão de Tenants' :
                    currentView === 'admin_audit' ? 'Logs e Auditoria' :
                    'Arquitetura do Sistema'}
                </h2>
            </div>
            
            <div className="flex items-center space-x-4">
                <span className="text-xs md:text-sm text-slate-500 hidden md:inline">v2.1.0 (Produção)</span>
            </div>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
import React, { useState } from 'react';
import Layout from './components/Layout';
import ClientDashboard from './pages/ClientDashboard';
import AccountingDashboard from './pages/AccountingDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ArchitectureDocs from './pages/ArchitectureDocs';
import { mockBackend } from './services/mockBackend';
import { User } from './types';
import { Briefcase, Calculator, Shield, User as UserIcon, Lock, Mail, ArrowRight, CheckCircle, AlertTriangle } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  
  // Login Form State
  const [email, setEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  // Register Form State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regRole, setRegRole] = useState<'business' | 'accounting'>('business');
  const [regSuccess, setRegSuccess] = useState(false);

  // Core login logic separated from event handling
  const executeLogin = async (loginEmail: string) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const loggedUser = await mockBackend.login(loginEmail);
      setUser(loggedUser);
    } catch (error: any) {
      setErrorMsg(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Form Submission Handler
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await executeLogin(email);
  };

  const handleRegister = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setErrorMsg('');
      try {
          await mockBackend.register({
              name: regName,
              email: regEmail,
              role: regRole,
              subRole: regRole === 'accounting' ? 'manager' : 'owner',
              companyName: regRole === 'business' ? 'Nova Empresa LTDA' : undefined
          });
          setRegSuccess(true);
      } catch (error: any) {
          setErrorMsg(error.message);
      } finally {
          setLoading(false);
      }
  };

  const handleLogout = () => {
    setUser(null);
    setView('dashboard');
    setEmail('');
    setErrorMsg('');
    setRegSuccess(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="max-w-4xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[500px]">
          
          {/* Left Side: Brand */}
          <div className="w-full md:w-5/12 bg-slate-900 p-8 flex flex-col justify-between text-white relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                 <div className="absolute top-10 left-10 w-32 h-32 bg-blue-500 rounded-full blur-3xl"></div>
                 <div className="absolute bottom-10 right-10 w-40 h-40 bg-purple-500 rounded-full blur-3xl"></div>
            </div>
            
            <div className="z-10">
               <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-2xl font-bold mb-4 shadow-lg shadow-blue-900/50">N</div>
               <h1 className="text-3xl font-bold">Notar</h1>
               <p className="text-slate-400 mt-2">Gestão inteligente e automatizada de notas fiscais para contadores modernos.</p>
            </div>
            
            <div className="z-10 space-y-4">
                <div className="flex items-center gap-3 bg-white/5 p-3 rounded-lg border border-white/10">
                    <Shield className="text-blue-400" size={20} />
                    <div>
                        <p className="font-semibold text-sm">Segurança Enterprise</p>
                        <p className="text-xs text-slate-400">Dados criptografados e controle de acesso.</p>
                    </div>
                </div>
                <div className="text-xs text-slate-500 mt-4">v2.2.1 (Produção)</div>
            </div>
          </div>

          {/* Right Side: Auth Form */}
          <div className="w-full md:w-7/12 p-8 md:p-12 bg-white flex flex-col justify-center">
            
            {regSuccess ? (
                <div className="text-center space-y-4 animate-fade-in-up">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800">Cadastro Realizado!</h2>
                    <p className="text-slate-600">
                        Sua conta foi criada e está <strong>pendente de aprovação</strong>.
                        <br/>
                        {regRole === 'accounting' 
                            ? 'O Administrador do SaaS irá analisar seu perfil.' 
                            : 'O Contador responsável irá liberar seu acesso.'}
                    </p>
                    <button 
                        onClick={() => { setRegSuccess(false); setAuthMode('login'); }}
                        className="mt-6 px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition"
                    >
                        Voltar para Login
                    </button>
                </div>
            ) : (
                <>
                    <div className="flex gap-6 mb-8 border-b border-slate-100">
                        <button 
                            className={`pb-2 text-sm font-semibold transition-colors ${authMode === 'login' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400'}`}
                            onClick={() => { setAuthMode('login'); setErrorMsg(''); }}
                        >
                            Entrar na conta
                        </button>
                        <button 
                            className={`pb-2 text-sm font-semibold transition-colors ${authMode === 'register' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400'}`}
                            onClick={() => { setAuthMode('register'); setErrorMsg(''); }}
                        >
                            Criar nova conta
                        </button>
                    </div>

                    {authMode === 'login' ? (
                        <form onSubmit={handleLoginSubmit} className="space-y-5">
                            <h2 className="text-2xl font-bold text-slate-800">Bem-vindo de volta</h2>
                            
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">E-mail corporativo</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input 
                                        type="email" 
                                        required
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        placeholder="seu@email.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>
                            
                            {errorMsg && (
                                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
                                    <AlertTriangle size={16} />
                                    {errorMsg}
                                </div>
                            )}

                            <button 
                                type="submit" 
                                disabled={loading}
                                className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
                            >
                                {loading ? 'Entrando...' : 'Acessar Painel'} <ArrowRight size={18} />
                            </button>

                            <div className="mt-8 pt-6 border-t border-slate-100">
                                <p className="text-xs text-slate-400 mb-3 text-center uppercase tracking-wider">Acesso Rápido (Demo)</p>
                                <div className="grid grid-cols-3 gap-2">
                                    <button type="button" onClick={() => executeLogin('dono@empresa.com')} className="text-xs p-2 bg-slate-50 hover:bg-slate-100 rounded text-slate-600 hover:text-blue-600 transition">Empresário</button>
                                    <button type="button" onClick={() => executeLogin('gestor@contabil.com')} className="text-xs p-2 bg-slate-50 hover:bg-slate-100 rounded text-slate-600 hover:text-blue-600 transition">Contador</button>
                                    <button type="button" onClick={() => executeLogin('root@notar.com')} className="text-xs p-2 bg-slate-50 hover:bg-slate-100 rounded text-slate-600 hover:text-blue-600 transition">Admin SaaS</button>
                                </div>
                            </div>
                        </form>
                    ) : (
                        <form onSubmit={handleRegister} className="space-y-4">
                            <h2 className="text-2xl font-bold text-slate-800">Comece agora</h2>
                            
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Nome Completo</label>
                                <input 
                                    type="text" 
                                    required
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="João Silva"
                                    value={regName}
                                    onChange={(e) => setRegName(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">E-mail Profissional</label>
                                <input 
                                    type="email" 
                                    required
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="joao@empresa.com"
                                    value={regEmail}
                                    onChange={(e) => setRegEmail(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Eu sou...</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setRegRole('business')}
                                        className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${regRole === 'business' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
                                    >
                                        <Briefcase size={20} />
                                        <span className="text-sm font-semibold">Empresário</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setRegRole('accounting')}
                                        className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${regRole === 'accounting' ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
                                    >
                                        <Calculator size={20} />
                                        <span className="text-sm font-semibold">Contador</span>
                                    </button>
                                </div>
                            </div>

                            {errorMsg && (
                                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">
                                    {errorMsg}
                                </div>
                            )}

                            <button 
                                type="submit" 
                                disabled={loading}
                                className="w-full py-3 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                            >
                                {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Criar Conta'}
                            </button>
                        </form>
                    )}
                </>
            )}
            
          </div>
        </div>
      </div>
    );
  }

  return (
    <Layout user={user} currentView={view} setView={setView} onLogout={handleLogout}>
      {view === 'architecture' ? (
        <ArchitectureDocs />
      ) : user.role === 'business' ? (
        <ClientDashboard user={user} />
      ) : user.role === 'accounting' ? (
        <AccountingDashboard user={user} />
      ) : (
        <AdminDashboard user={user} currentView={view} />
      )}
    </Layout>
  );
};

export default App;
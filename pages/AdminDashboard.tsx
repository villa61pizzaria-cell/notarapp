import React, { useEffect, useState } from 'react';
import { User, Tenant, SystemLog } from '../types';
import { mockBackend } from '../services/mockBackend';
import { Shield, CheckCircle, XCircle, UserCheck, Users, Activity, HardDrive, Edit2, X, Save } from 'lucide-react';

interface AdminDashboardProps {
  user: User;
  currentView?: string;
}

const PLAN_DETAILS = {
  starter: { label: 'Starter (01-50 empresas)', price: 'R$ 319,90' },
  enterprise: { label: 'Enterprise (51-150 empresas)', price: 'R$ 459,90' },
  pro: { label: 'Pro (151-300 empresas)', price: 'R$ 519,90' },
};

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, currentView = 'dashboard' }) => {
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit State
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);

  const fetchPending = async () => {
      setLoading(true);
      const users = await mockBackend.getPendingUsers(user.role, user.id);
      setPendingUsers(users);
      setLoading(false);
  };

  const fetchAdminData = async () => {
      setLoading(true);
      const data = await mockBackend.getAdminData();
      setTenants(data.tenants);
      setLogs(data.logs);
      setLoading(false);
  };

  useEffect(() => {
    if (currentView === 'admin_clients' || currentView === 'admin_audit') {
        fetchAdminData();
    } else {
        fetchPending();
    }
  }, [currentView]);

  const handleStatusChange = async (targetId: string, status: 'active' | 'blocked') => {
      await mockBackend.updateUserStatus(targetId, status);
      fetchPending();
  };

  const handleEditTenant = (tenant: Tenant) => {
      setEditingTenant({ ...tenant });
  };

  const handleSaveTenant = async () => {
      if (editingTenant) {
          await mockBackend.updateTenant(editingTenant.id, {
              plan: editingTenant.plan,
              status: editingTenant.status
          });
          setEditingTenant(null);
          fetchAdminData();
      }
  };

  if (currentView === 'admin_clients') {
      return (
          <div className="space-y-6">
              <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Users className="text-blue-600" /> Gestão de Tenants (Clientes)
                    </h1>
                    <p className="text-slate-500">Escritórios de contabilidade e planos ativos.</p>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <table className="w-full text-left">
                      <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-semibold">
                          <tr>
                              <th className="px-6 py-4">Nome da Empresa</th>
                              <th className="px-6 py-4">Plano Atual</th>
                              <th className="px-6 py-4">Status</th>
                              <th className="px-6 py-4">Usuários</th>
                              <th className="px-6 py-4">Armazenamento</th>
                              <th className="px-6 py-4 text-right">Ações</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                          {tenants.map(t => (
                              <tr key={t.id} className="hover:bg-slate-50">
                                  <td className="px-6 py-4 font-medium text-slate-900">{t.name}</td>
                                  <td className="px-6 py-4">
                                      <div className="flex flex-col">
                                          <span className={`px-2 py-1 rounded text-xs font-bold uppercase w-fit
                                              ${t.plan === 'enterprise' ? 'bg-purple-100 text-purple-700' : 
                                                t.plan === 'pro' ? 'bg-indigo-100 text-indigo-700' : 'bg-blue-100 text-blue-700'}`}>
                                              {t.plan}
                                          </span>
                                          <span className="text-[10px] text-slate-500 mt-1">
                                              {PLAN_DETAILS[t.plan]?.price}
                                          </span>
                                      </div>
                                  </td>
                                  <td className="px-6 py-4">
                                      {t.status === 'active' 
                                          ? <span className="text-green-600 font-bold text-xs flex items-center gap-1"><CheckCircle size={12}/> Ativo</span>
                                          : <span className="text-red-500 font-bold text-xs flex items-center gap-1"><XCircle size={12}/> {t.status}</span>
                                      }
                                  </td>
                                  <td className="px-6 py-4 text-slate-600">{t.usersCount}</td>
                                  <td className="px-6 py-4 text-slate-600 flex items-center gap-2">
                                      <HardDrive size={14} /> {t.storageUsedGB} GB
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                      <button 
                                        onClick={() => handleEditTenant(t)}
                                        className="text-slate-400 hover:text-blue-600 font-medium text-sm flex items-center justify-end gap-1 ml-auto"
                                      >
                                          <Edit2 size={16} /> Editar
                                      </button>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>

              {/* Edit Modal */}
              {editingTenant && (
                  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-fade-in-up">
                          <div className="flex justify-between items-center mb-6">
                              <h3 className="text-xl font-bold text-slate-800">Editar Tenant</h3>
                              <button onClick={() => setEditingTenant(null)} className="text-slate-400 hover:text-slate-600">
                                  <X size={20} />
                              </button>
                          </div>

                          <div className="space-y-4">
                              <div>
                                  <label className="block text-sm font-medium text-slate-600 mb-1">Empresa</label>
                                  <input 
                                    disabled 
                                    value={editingTenant.name} 
                                    className="w-full p-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed"
                                  />
                              </div>

                              <div>
                                  <label className="block text-sm font-bold text-slate-700 mb-1">Status</label>
                                  <select 
                                      value={editingTenant.status}
                                      onChange={(e) => setEditingTenant({...editingTenant, status: e.target.value as any})}
                                      className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                  >
                                      <option value="active">Ativo</option>
                                      <option value="inactive">Inativo</option>
                                      <option value="delinquent">Inadimplente</option>
                                  </select>
                              </div>

                              <div>
                                  <label className="block text-sm font-bold text-slate-700 mb-1">Plano de Assinatura</label>
                                  <div className="space-y-2">
                                      {(Object.keys(PLAN_DETAILS) as Array<keyof typeof PLAN_DETAILS>).map((planKey) => (
                                          <label 
                                            key={planKey}
                                            className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all
                                                ${editingTenant.plan === planKey ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-slate-200 hover:border-slate-300'}`}
                                          >
                                              <div className="flex items-center gap-3">
                                                  <input 
                                                      type="radio" 
                                                      name="plan"
                                                      checked={editingTenant.plan === planKey}
                                                      onChange={() => setEditingTenant({...editingTenant, plan: planKey})}
                                                      className="text-blue-600 focus:ring-blue-500"
                                                  />
                                                  <div className="text-sm">
                                                      <p className="font-semibold text-slate-800">{PLAN_DETAILS[planKey].label}</p>
                                                  </div>
                                              </div>
                                              <span className="text-sm font-bold text-slate-600">{PLAN_DETAILS[planKey].price}</span>
                                          </label>
                                      ))}
                                  </div>
                              </div>
                          </div>

                          <div className="mt-8 flex gap-3">
                              <button 
                                onClick={() => setEditingTenant(null)}
                                className="flex-1 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                              >
                                  Cancelar
                              </button>
                              <button 
                                onClick={handleSaveTenant}
                                className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold flex items-center justify-center gap-2"
                              >
                                  <Save size={18} /> Salvar Alterações
                              </button>
                          </div>
                      </div>
                  </div>
              )}
          </div>
      );
  }

  if (currentView === 'admin_audit') {
      return (
          <div className="space-y-6">
               <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Activity className="text-orange-600" /> Logs de Auditoria
                    </h1>
                    <p className="text-slate-500">Histórico de eventos, erros e segurança do sistema.</p>
                </div>
              </div>

              <div className="bg-slate-900 rounded-xl shadow-lg overflow-hidden border border-slate-700">
                  <div className="bg-slate-800 px-6 py-3 border-b border-slate-700 flex justify-between">
                      <span className="text-slate-300 text-xs font-mono uppercase">System Terminal Output</span>
                      <div className="flex gap-2">
                          <div className="w-3 h-3 rounded-full bg-red-500"></div>
                          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                          <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      </div>
                  </div>
                  <div className="p-6 font-mono text-sm max-h-[600px] overflow-y-auto">
                      {logs.map(log => (
                          <div key={log.id} className="mb-2 border-l-2 border-slate-700 pl-3 py-1 hover:bg-slate-800/50 transition">
                              <div className="flex gap-3 text-xs mb-1">
                                  <span className="text-slate-500">{new Date(log.timestamp).toLocaleString()}</span>
                                  <span className={`font-bold uppercase
                                      ${log.level === 'info' ? 'text-blue-400' : log.level === 'warn' ? 'text-yellow-400' : 'text-red-500'}`}>
                                      [{log.level}]
                                  </span>
                                  <span className="text-slate-400">[{log.module}]</span>
                              </div>
                              <p className="text-slate-300">{log.message}</p>
                          </div>
                      ))}
                      <div className="mt-4 animate-pulse text-green-500">_</div>
                  </div>
              </div>
          </div>
      );
  }

  return (
    <div className="space-y-6">
      
      <div className="flex items-end justify-between">
         <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <Shield className="text-purple-600" /> Admin Global
            </h1>
            <p className="text-slate-500">Painel de aprovação de novos escritórios de contabilidade.</p>
         </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                      <UserCheck size={20} className="text-blue-600" /> Solicitações de Cadastro
                  </h3>
                  <p className="text-sm text-slate-500">Contadores aguardando liberação para usar a plataforma.</p>
              </div>
              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">
                  {pendingUsers.length} Pendentes
              </span>
          </div>

          {loading ? (
              <div className="p-8 text-center text-slate-400">Carregando...</div>
          ) : pendingUsers.length === 0 ? (
              <div className="p-12 text-center text-slate-400 flex flex-col items-center">
                  <CheckCircle size={48} className="text-green-200 mb-4" />
                  <p>Nenhuma solicitação pendente no momento.</p>
              </div>
          ) : (
              <table className="w-full text-left">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-semibold">
                      <tr>
                          <th className="px-6 py-4">Nome</th>
                          <th className="px-6 py-4">Email</th>
                          <th className="px-6 py-4">Cargo Solicitado</th>
                          <th className="px-6 py-4 text-right">Ações</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                      {pendingUsers.map(u => (
                          <tr key={u.id} className="hover:bg-slate-50">
                              <td className="px-6 py-4 font-medium text-slate-900">{u.name}</td>
                              <td className="px-6 py-4 text-slate-600">{u.email}</td>
                              <td className="px-6 py-4">
                                  <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-bold">
                                      {u.role === 'accounting' ? 'Contabilidade' : u.role}
                                  </span>
                              </td>
                              <td className="px-6 py-4 text-right flex justify-end gap-2">
                                  <button 
                                    onClick={() => handleStatusChange(u.id, 'active')}
                                    className="px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 flex items-center gap-1"
                                  >
                                      <CheckCircle size={14} /> Aprovar
                                  </button>
                                  <button 
                                    onClick={() => handleStatusChange(u.id, 'blocked')}
                                    className="px-3 py-1.5 bg-red-100 text-red-600 text-sm rounded hover:bg-red-200 flex items-center gap-1"
                                  >
                                      <XCircle size={14} /> Recusar
                                  </button>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          )}
      </div>
    </div>
  );
};

export default AdminDashboard;
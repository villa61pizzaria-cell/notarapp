import React, { useEffect, useState } from 'react';
import { User, ReceiptData } from '../types';
import { mockBackend } from '../services/mockBackend';
import { Search, CheckCircle, FileText, Square, CheckSquare, AlertCircle, Trash2, Users, UserPlus, XCircle, UserCheck } from 'lucide-react';
import ReceiptConfirmationModal from '../components/ReceiptConfirmationModal';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

interface AccountingDashboardProps {
  user: User;
}

const AccountingDashboard: React.FC<AccountingDashboardProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'receipts' | 'team'>('receipts');
  
  // Receipts State
  const [receipts, setReceipts] = useState<ReceiptData[]>([]);
  const [filteredReceipts, setFilteredReceipts] = useState<ReceiptData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [volumeData, setVolumeData] = useState<any[]>([]);
  
  // Team/Users State
  const [activeUsers, setActiveUsers] = useState<User[]>([]);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null);
  
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const fetchData = async () => {
      const data = await mockBackend.getReceipts('accounting');
      setReceipts(data);
      setFilteredReceipts(data);
      processVolumeData(data);

      const allUsers = await mockBackend.getTeamMembers();
      setActiveUsers(allUsers.filter(u => u.status === 'active' && u.role !== 'admin'));
      
      const pending = await mockBackend.getPendingUsers('accounting', user.id);
      setPendingUsers(pending);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const processVolumeData = (data: ReceiptData[]) => {
      const days: Record<string, number> = {};
      const now = new Date();
      for (let i = 29; i >= 0; i--) {
          const d = new Date(now);
          d.setDate(d.getDate() - i);
          const key = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
          days[key] = 0;
      }
      data.forEach(r => {
          const d = new Date(r.createdAt);
          const key = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
          if (days[key] !== undefined) { days[key] += 1; }
      });
      setVolumeData(Object.keys(days).map(key => ({ date: key, count: days[key] })));
  };

  useEffect(() => {
    let result = receipts;
    if (filterStatus !== 'all') {
      result = result.filter(r => r.status === filterStatus);
    }
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(r => 
        (r.merchantName?.toLowerCase().includes(lower)) || 
        (r.userCompanyName?.toLowerCase().includes(lower))
      );
    }
    setFilteredReceipts(result);
  }, [searchTerm, filterStatus, receipts]);

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredReceipts.length) { setSelectedIds(new Set()); } 
    else { setSelectedIds(new Set(filteredReceipts.map(r => r.id))); }
  };

  const toggleSelectOne = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const handleBulkApprove = async () => {
      if (!user.permissions?.includes('approve_receipts')) {
          alert("Você não tem permissão para aprovar notas.");
          return;
      }
      for (let id of selectedIds) {
          await mockBackend.updateReceipt(id, { status: 'processed' });
      }
      fetchData();
      setSelectedIds(new Set());
  };

  const handleDelete = async (id: string) => {
      if (confirm('Tem certeza que deseja excluir este lançamento?')) {
          await mockBackend.deleteReceipt(id);
          fetchData();
      }
  };

  const updateStatus = async (id: string, status: 'processed' | 'rejected') => {
      await mockBackend.updateReceipt(id, { status });
      fetchData();
  };
  
  const handleViewDetails = (receipt: ReceiptData) => {
      setSelectedReceipt(receipt);
      setIsModalOpen(true);
  };

  const handleSaveDetails = async (updatedData: Partial<ReceiptData>) => {
      if (selectedReceipt) {
          await mockBackend.updateReceipt(selectedReceipt.id, updatedData);
          fetchData();
          setIsModalOpen(false);
          setSelectedReceipt(null);
      }
  };

  // User Management Handlers
  const handleUserApproval = async (id: string, action: 'active' | 'blocked') => {
      await mockBackend.updateUserStatus(id, action);
      fetchData();
  };

  // Metrics
  const pendingCount = receipts.filter(r => r.status === 'confirmed').length;
  const processedCount = receipts.filter(r => r.status === 'processed').length;
  const canDelete = user.permissions?.includes('delete_receipts');

  return (
    <div className="space-y-6">
      
      <div className="flex justify-between items-end">
        <div>
           <h1 className="text-2xl font-bold text-slate-900">Torre de Controle</h1>
           <p className="text-slate-500">
               Logado como: <span className="font-semibold text-slate-800">{user.name}</span>
           </p>
        </div>
        
        {/* Tab Switcher */}
        <div className="bg-white p-1 rounded-lg border border-slate-200 flex gap-1">
            <button 
                onClick={() => setActiveTab('receipts')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'receipts' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
            >
                <FileText size={16} /> Lançamentos
            </button>
            <button 
                onClick={() => setActiveTab('team')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'team' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
            >
                <Users size={16} /> Equipe & Acessos
                {pendingUsers.length > 0 && (
                    <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{pendingUsers.length}</span>
                )}
            </button>
        </div>
      </div>

      {activeTab === 'receipts' ? (
        <>
            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-slate-500 text-xs font-bold uppercase">Pendências</p>
                        <h3 className="text-3xl font-bold text-slate-900 mt-1">{pendingCount}</h3>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center">
                        <AlertCircle size={20} />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-slate-500 text-xs font-bold uppercase">Processadas</p>
                        <h3 className="text-3xl font-bold text-slate-900 mt-1">{processedCount}</h3>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center">
                        <CheckCircle size={20} />
                    </div>
                </div>

                <div className="md:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
                    <p className="text-slate-500 text-xs font-bold uppercase mb-2">Volume de Entrada (30 Dias)</p>
                    <div className="h-16 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={volumeData}>
                                <defs>
                                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorCount)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col">
                <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50/50 rounded-t-xl">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Filtrar por empresa..." 
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg bg-white"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        {selectedIds.size > 0 && (
                            <button onClick={handleBulkApprove} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2 text-sm font-medium">
                                <CheckCircle size={16} /> Aprovar ({selectedIds.size})
                            </button>
                        )}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-xs">
                            <tr>
                                <th className="px-4 py-3 w-10 text-center">
                                    <button onClick={toggleSelectAll}>
                                        {selectedIds.size > 0 && selectedIds.size === filteredReceipts.length ? <CheckSquare size={18} className="text-blue-600"/> : <Square size={18}/>}
                                    </button>
                                </th>
                                <th className="px-6 py-3">Data</th>
                                <th className="px-6 py-3">Cliente</th>
                                <th className="px-6 py-3">Fornecedor</th>
                                <th className="px-6 py-3">Valor</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredReceipts.map((receipt) => (
                                <tr key={receipt.id} className="hover:bg-slate-50">
                                    <td className="px-4 py-3 text-center">
                                        <button onClick={() => toggleSelectOne(receipt.id)}>
                                            {selectedIds.has(receipt.id) ? <CheckSquare size={18} className="text-blue-600"/> : <Square size={18}/>}
                                        </button>
                                    </td>
                                    <td className="px-6 py-3">{new Date(receipt.createdAt).toLocaleDateString()}</td>
                                    <td className="px-6 py-3 font-medium text-slate-900">{receipt.userCompanyName}</td>
                                    <td className="px-6 py-3">{receipt.merchantName}</td>
                                    <td className="px-6 py-3 font-mono">R$ {receipt.totalAmount?.toFixed(2)}</td>
                                    <td className="px-6 py-3">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                                            ${receipt.status === 'processed' ? 'bg-green-50 text-green-700 border-green-200' : 
                                            receipt.status === 'confirmed' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
                                            {receipt.status === 'processed' ? 'Processado' : 'Novo'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 text-right flex justify-end gap-2">
                                        {receipt.status !== 'processed' && user.permissions?.includes('approve_receipts') && (
                                            <button onClick={() => updateStatus(receipt.id, 'processed')} className="p-1.5 text-green-600 hover:bg-green-100 rounded">
                                                <CheckCircle size={16} />
                                            </button>
                                        )}
                                        <button onClick={() => handleViewDetails(receipt)} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded">
                                            <FileText size={16} />
                                        </button>
                                        
                                        {canDelete && (
                                            <button onClick={() => handleDelete(receipt.id)} className="p-1.5 text-red-500 hover:bg-red-100 rounded" title="Excluir">
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
      ) : (
        <div className="space-y-6">
            
            {/* Pending Requests Section */}
            {pendingUsers.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-yellow-200 overflow-hidden">
                    <div className="p-4 bg-yellow-50 border-b border-yellow-100 flex items-center gap-2">
                        <UserCheck className="text-yellow-600" size={20} />
                        <h3 className="font-bold text-yellow-800">Solicitações Pendentes</h3>
                    </div>
                    <table className="w-full text-left text-sm">
                        <tbody className="divide-y divide-slate-100">
                            {pendingUsers.map(u => (
                                <tr key={u.id}>
                                    <td className="px-6 py-4 font-medium">{u.name}</td>
                                    <td className="px-6 py-4 text-slate-500">{u.email}</td>
                                    <td className="px-6 py-4">
                                        <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-bold uppercase">{u.role === 'business' ? 'Cliente' : 'Assistente'}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                                        <button 
                                            onClick={() => handleUserApproval(u.id, 'active')}
                                            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs font-bold"
                                        >
                                            Aprovar
                                        </button>
                                        <button 
                                            onClick={() => handleUserApproval(u.id, 'blocked')}
                                            className="px-3 py-1 bg-slate-200 text-slate-600 rounded hover:bg-slate-300 text-xs font-bold"
                                        >
                                            Recusar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Active Users Section */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">Usuários Ativos</h2>
                        <p className="text-slate-500 text-sm">Empresas clientes e assistentes vinculados.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {activeUsers.map(member => (
                        <div key={member.id} className="border border-slate-200 rounded-xl p-4 hover:shadow-md transition bg-slate-50">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold
                                        ${member.role === 'accounting' ? 'bg-purple-600' : 'bg-blue-600'}`}>
                                        {member.name[0]}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900">{member.name}</h3>
                                        <p className="text-xs text-slate-500">{member.email}</p>
                                    </div>
                                </div>
                                <button className="text-slate-400 hover:text-red-500">
                                    <XCircle size={18} />
                                </button>
                            </div>
                            <div className="mt-4 pt-3 border-t border-slate-200 flex justify-between items-center">
                                <span className={`text-xs px-2 py-1 rounded font-semibold uppercase
                                    ${member.role === 'accounting' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                    {member.role === 'accounting' ? 'Assistente' : 'Cliente'}
                                </span>
                                <span className="text-xs text-slate-400 font-mono">ID: {member.id}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      )}

      {isModalOpen && selectedReceipt && (
        <ReceiptConfirmationModal
            data={selectedReceipt}
            imagePreview={selectedReceipt.imageUrl}
            onConfirm={handleSaveDetails}
            onCancel={() => { setIsModalOpen(false); setSelectedReceipt(null); }}
        />
      )}
    </div>
  );
};

export default AccountingDashboard;
import React, { useEffect, useState } from 'react';
import { User, ReceiptData } from '../types';
import { mockBackend } from '../services/mockBackend';
import { 
  ComposedChart, Line, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid, Area, PieChart, Pie, Cell 
} from 'recharts';
import WhatsAppSimulator from '../components/WhatsAppSimulator';
import ReceiptConfirmationModal from '../components/ReceiptConfirmationModal';
import SmartChecklist from '../components/SmartChecklist';
import { FileText, TrendingUp, TrendingDown, RefreshCcw, DollarSign, PieChart as PieChartIcon, Calendar, Lock, Trash2 } from 'lucide-react';

interface ClientDashboardProps {
  user: User;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Alimentação': '#3b82f6',
  'Combustível': '#f59e0b',
  'Material de Escritório': '#10b981',
  'Serviços': '#8b5cf6',
  'Outros': '#94a3b8'
};

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];

const ClientDashboard: React.FC<ClientDashboardProps> = ({ user }) => {
  const [receipts, setReceipts] = useState<ReceiptData[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tempImage, setTempImage] = useState<string>('');
  const [tempData, setTempData] = useState<Partial<ReceiptData>>({});
  
  const [financialData, setFinancialData] = useState<any[]>([]);
  const [pieData, setPieData] = useState<any[]>([]);
  const [kpiData, setKpiData] = useState({ totalSpent: 0, monthlyChange: 0, totalNotes: 0, avgTicket: 0 });

  const hasFinancialAccess = user.permissions?.includes('view_financials');

  const fetchData = async () => {
    const data = await mockBackend.getReceipts('business', user.id);
    setReceipts(data);
    if (hasFinancialAccess) {
        processChartData(data);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user.id]);

  const processChartData = (data: ReceiptData[]) => {
      const now = new Date();
      const currentMonth = now.getMonth();
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;

      const groupedByMonth: Record<string, { name: string, total: number, count: number }> = {};
      let totalCurrentMonth = 0;
      let totalLastMonth = 0;

      data.forEach(r => {
          const d = new Date(r.createdAt);
          const monthKey = d.toLocaleDateString('pt-BR', { month: 'short' });
          if (!groupedByMonth[monthKey]) { groupedByMonth[monthKey] = { name: monthKey, total: 0, count: 0 }; }
          groupedByMonth[monthKey].total += (r.totalAmount || 0);
          groupedByMonth[monthKey].count += 1;

          if (d.getMonth() === currentMonth && d.getFullYear() === now.getFullYear()) { totalCurrentMonth += (r.totalAmount || 0); }
          if (d.getMonth() === lastMonth && d.getFullYear() === now.getFullYear()) { totalLastMonth += (r.totalAmount || 0); }
      });

      setFinancialData(Object.values(groupedByMonth).reverse());

      const groupedByCategory: Record<string, number> = {};
      data.forEach(r => {
          const cat = r.category || 'Outros';
          groupedByCategory[cat] = (groupedByCategory[cat] || 0) + (r.totalAmount || 0);
      });
      setPieData(Object.keys(groupedByCategory).map(key => ({ name: key, value: groupedByCategory[key] })));

      const percentChange = totalLastMonth > 0 ? ((totalCurrentMonth - totalLastMonth) / totalLastMonth) * 100 : 0;
      setKpiData({
          totalSpent: totalCurrentMonth,
          monthlyChange: percentChange,
          totalNotes: data.length,
          avgTicket: data.length > 0 ? (data.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0) / data.length) : 0
      });
  };


  const handleImageSelected = (file: File, base64: string, preliminaryData: Partial<ReceiptData>) => {
      setTempImage(`data:${file.type};base64,${base64}`);
      setTempData(preliminaryData);
      setIsModalOpen(true);
  };

  const handleConfirmReceipt = async (finalData: Partial<ReceiptData>) => {
      setIsModalOpen(false);
      const newReceipt = await mockBackend.addReceipt({
          ...finalData,
          userId: user.id,
          userCompanyName: user.companyName,
          status: 'confirmed',
          imageUrl: tempImage
      });
      const event = new CustomEvent('receipt-confirmed', { detail: { receipt: newReceipt } });
      window.dispatchEvent(event);
      fetchData();
  };

  const handleDelete = async (id: string) => {
      if (window.confirm('Tem certeza que deseja excluir este envio?')) {
          await mockBackend.deleteReceipt(id);
          fetchData();
      }
  };

  return (
    <>
      <div className="space-y-6">
        
        {/* Permission Check for Financials */}
        {hasFinancialAccess ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase">Total Mês Atual</p>
                            <h3 className="text-2xl font-bold text-slate-900 mt-1">R$ {kpiData.totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
                        </div>
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><DollarSign size={20} /></div>
                    </div>
                    <div className="mt-4 flex items-center text-xs">
                        <span className={`flex items-center font-bold ${kpiData.monthlyChange >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                            {kpiData.monthlyChange >= 0 ? <TrendingUp size={14} className="mr-1"/> : <TrendingDown size={14} className="mr-1"/>}
                            {Math.abs(kpiData.monthlyChange).toFixed(1)}%
                        </span>
                        <span className="text-slate-400 ml-2">vs mês anterior</span>
                    </div>
                </div>
                <SmartChecklist userId={user.id} />
            </div>
        ) : (
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex items-center gap-3">
                <Lock className="text-blue-500" />
                <div>
                    <h3 className="font-bold text-blue-900">Modo Funcionário</h3>
                    <p className="text-blue-800 text-sm">Você tem acesso apenas para envio de notas. Dados financeiros estão ocultos.</p>
                </div>
            </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
                {hasFinancialAccess ? (
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                        <h3 className="font-bold text-slate-800 mb-6">Fluxo de Despesas</h3>
                        <div className="h-80 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={financialData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="total" fill="#3b82f6" barSize={20} radius={[4, 4, 0, 0]} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                ) : (
                    <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl h-80 flex items-center justify-center text-slate-400 flex-col">
                        <Lock size={40} className="mb-2" />
                        <p>Gráficos disponíveis apenas para gestores</p>
                    </div>
                )}
                
                {/* Recent Receipts List - Visible to everyone */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                     <h3 className="font-bold text-slate-800 mb-4">Envios Recentes</h3>
                     <div className="space-y-3">
                        {receipts.slice(0, 5).map(receipt => (
                            <div key={receipt.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors px-2 -mx-2 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold`} 
                                        style={{ backgroundColor: CATEGORY_COLORS[receipt.category || 'Outros'] || '#94a3b8' }}>
                                        {(receipt.merchantName || 'N')[0]}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-800 truncate w-32 md:w-48">{receipt.merchantName || 'Sem nome'}</p>
                                        <p className="text-xs text-slate-400">{new Date(receipt.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`text-[10px] px-2 py-1 rounded-full ${receipt.status === 'processed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                        {receipt.status === 'processed' ? 'OK' : 'Pendente'}
                                    </span>
                                    <button 
                                        onClick={() => handleDelete(receipt.id)}
                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                        title="Excluir envio"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {receipts.length === 0 && (
                            <p className="text-center text-sm text-slate-400 py-4">Nenhum envio recente.</p>
                        )}
                     </div>
                </div>
            </div>

            <div className="lg:col-span-1">
                <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-100 sticky top-6">
                    <div className="p-4 bg-slate-50/50 rounded-t-xl border-b border-slate-100">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2"><FileText size={18} className="text-blue-500"/> Enviar Nota</h3>
                    </div>
                    <div className="p-4">
                        <WhatsAppSimulator currentUser={user} onReceiptProcessed={fetchData} onImageSelected={handleImageSelected} />
                    </div>
                </div>
            </div>
        </div>
      </div>

      {isModalOpen && (
        <ReceiptConfirmationModal 
          data={tempData} imagePreview={tempImage} 
          onConfirm={handleConfirmReceipt} onCancel={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
};

export default ClientDashboard;
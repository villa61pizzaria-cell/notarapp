import React, { useEffect, useState } from 'react';
import { mockBackend } from '../services/mockBackend';
import { ChecklistStats } from '../types';
import { AlertCircle, CheckCircle2, Clock, CalendarDays } from 'lucide-react';

interface Props {
  userId: string;
}

const SmartChecklist: React.FC<Props> = ({ userId }) => {
  const [stats, setStats] = useState<ChecklistStats | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      const data = await mockBackend.getChecklistStats(userId);
      setStats(data);
    };
    loadStats();
  }, [userId]);

  if (!stats) return <div className="animate-pulse h-24 bg-slate-100 rounded-xl"></div>;

  const getStatusColor = () => {
    switch (stats.status) {
      case 'on_track': return 'bg-green-50 border-green-200 text-green-700';
      case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-700';
      case 'behind': return 'bg-red-50 border-red-200 text-red-700';
    }
  };

  const getStatusIcon = () => {
    switch (stats.status) {
      case 'on_track': return <CheckCircle2 className="text-green-500" />;
      case 'warning': return <Clock className="text-yellow-500" />;
      case 'behind': return <AlertCircle className="text-red-500" />;
    }
  };

  const percentComplete = Math.min((stats.totalDocsSent / stats.totalDocsExpected) * 100, 100);

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <CalendarDays size={20} className="text-blue-500"/>
            Checklist Mensal
        </h3>
        <span className="text-xs font-semibold bg-slate-100 text-slate-500 px-2 py-1 rounded">
            {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
           <span className="text-slate-500">Notas enviadas</span>
           <span className="font-bold text-slate-700">{stats.totalDocsSent} / {stats.totalDocsExpected}</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2.5">
          <div 
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" 
            style={{ width: `${percentComplete}%` }}
          ></div>
        </div>
      </div>

      {/* Alert Box */}
      <div className={`p-4 rounded-lg border flex items-start gap-3 ${getStatusColor()}`}>
        <div className="mt-0.5">{getStatusIcon()}</div>
        <div>
           <p className="font-semibold text-sm">
             {stats.status === 'on_track' && "Tudo certo com seus envios!"}
             {stats.status === 'warning' && "Atenção: Nenhum envio recente."}
             {stats.status === 'behind' && "Crítico: Envio de notas atrasado."}
           </p>
           <p className="text-xs mt-1 opacity-90">
             {stats.daysSinceLastUpload === 0 
                ? "Última nota enviada hoje." 
                : `Última nota enviada há ${stats.daysSinceLastUpload} dias.`}
           </p>
        </div>
      </div>
    </div>
  );
};

export default SmartChecklist;
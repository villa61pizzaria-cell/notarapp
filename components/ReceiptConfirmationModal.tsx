import React, { useState, useEffect } from 'react';
import { ReceiptData, Installment } from '../types';
import { Check, X, Edit2, Calendar, DollarSign, Tag, Hash, MessageSquare, Plus, Trash2, AlertTriangle, Layers, Building, Save } from 'lucide-react';

interface Props {
  data: Partial<ReceiptData>;
  imagePreview: string;
  onConfirm: (finalData: Partial<ReceiptData>) => void;
  onCancel: () => void;
}

const DEFAULT_CATEGORIES = [
  'Alimentação',
  'Combustível',
  'Material de Escritório',
  'Serviços',
  'Outros',
  'Hospedagem',
  'Transporte',
  'Manutenção',
  'Impostos',
  'Marketing'
];

const ReceiptConfirmationModal: React.FC<Props> = ({ data, imagePreview, onConfirm, onCancel }) => {
  const [formData, setFormData] = useState({
    merchantName: data.merchantName || '',
    cnpj: data.summary?.cnpj || data.ocr?.cnpjDetected || data.cnpj || '',
    totalAmount: data.totalAmount || 0,
    date: data.date || new Date().toISOString().split('T')[0],
    category: data.category || 'Outros',
    notes: data.notes || ''
  });

  const [installments, setInstallments] = useState<Installment[]>(data.installments || []);

  // Category Management State
  const [availableCategories, setAvailableCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Initialize categories: ensure the current data.category is in the list
  useEffect(() => {
    if (data.category && !DEFAULT_CATEGORIES.includes(data.category)) {
        setAvailableCategories(prev => [...prev, data.category!]);
    }
  }, [data.category]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Special handler for category dropdown to detect "ADD_NEW"
    if (name === 'category' && value === 'ADD_NEW_CATEGORY_OPTION') {
        setIsAddingCategory(true);
        return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: name === 'totalAmount' ? parseFloat(value) : value
    }));
  };

  const handleSaveNewCategory = () => {
      if (newCategoryName.trim()) {
          const newCat = newCategoryName.trim();
          setAvailableCategories(prev => [...prev, newCat]);
          setFormData(prev => ({ ...prev, category: newCat }));
          setIsAddingCategory(false);
          setNewCategoryName('');
      } else {
          setIsAddingCategory(false); // Cancel if empty
      }
  };

  // Installment Management
  const addInstallment = () => {
    setInstallments([...installments, { number: `${installments.length + 1}`, date: '', amount: 0 }]);
  };

  const removeInstallment = (index: number) => {
    setInstallments(installments.filter((_, i) => i !== index));
  };

  const updateInstallment = (index: number, field: keyof Installment, value: any) => {
    const newInstallments = [...installments];
    newInstallments[index] = { 
        ...newInstallments[index], 
        [field]: field === 'amount' ? parseFloat(value) : value 
    };
    setInstallments(newInstallments);
  };

  const installmentsTotal = installments.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const isTotalMismatch = installments.length > 0 && Math.abs(installmentsTotal - formData.totalAmount) > 0.05;

  const handleConfirm = () => {
    onConfirm({
      ...data,
      merchantName: formData.merchantName,
      cnpj: formData.cnpj,
      totalAmount: formData.totalAmount,
      date: formData.date,
      category: formData.category,
      notes: formData.notes,
      installments: installments,
      summary: {
        ...data.summary,
        total: formData.totalAmount,
        date: formData.date,
        category: formData.category,
        cnpj: formData.cnpj
      }
    });
  };

  const isPdf = imagePreview.startsWith('data:application/pdf');

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden flex flex-col md:flex-row shadow-2xl animate-fade-in-up">
        
        {/* Image/PDF Preview Side */}
        <div className="w-full md:w-1/2 bg-slate-900 p-6 flex items-center justify-center relative flex-col">
          {isPdf ? (
             <embed 
               src={imagePreview} 
               type="application/pdf"
               className="w-full h-[40vh] md:h-[80vh] rounded shadow-lg border border-slate-700"
             />
          ) : (
             <img 
                src={imagePreview} 
                alt="Receipt Preview" 
                className="max-h-[40vh] md:max-h-[80vh] w-auto rounded shadow-lg border border-slate-700 object-contain" 
             />
          )}
          
          <div className="absolute top-4 left-4 bg-black/60 text-white px-3 py-1 rounded-full text-xs font-mono">
            Confiança OCR: {Math.round((data.confidenceScore || 0) * 100)}%
          </div>
        </div>

        {/* Form Side */}
        <div className="w-full md:w-1/2 p-6 flex flex-col justify-between overflow-y-auto bg-white">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Confirme os dados</h2>
              <p className="text-slate-500 text-sm">Verifique se o OCR leu sua nota corretamente.</p>
            </div>

            <div className="space-y-4">
              
              {/* Merchant Input */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                  <Building size={14} /> Estabelecimento
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="merchantName"
                    value={formData.merchantName}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-900"
                  />
                  <Edit2 size={16} className="absolute right-3 top-2.5 text-slate-400" />
                </div>
              </div>

              {/* CNPJ Input */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                  <Hash size={14} /> CNPJ do Fornecedor
                </label>
                <input
                  type="text"
                  name="cnpj"
                  value={formData.cnpj}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all text-slate-900 font-mono text-sm"
                  placeholder="00.000.000/0000-00"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                    <Calendar size={14} /> Data Emissão
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-slate-900"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                    <DollarSign size={14} /> Valor Total
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-500 font-semibold">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      name="totalAmount"
                      value={formData.totalAmount}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 font-bold text-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* Installments Section */}
              <div className="border rounded-xl p-4 bg-slate-50 border-slate-200">
                  <div className="flex justify-between items-center mb-3">
                      <label className="text-xs font-bold text-slate-600 uppercase flex items-center gap-1">
                          <Layers size={14} /> Fatura / Parcelamento
                      </label>
                      <button onClick={addInstallment} className="text-blue-600 hover:text-blue-700 text-xs font-semibold flex items-center gap-1">
                          <Plus size={14} /> Adicionar
                      </button>
                  </div>
                  
                  {installments.length === 0 ? (
                      <p className="text-sm text-slate-400 italic text-center py-2">Nenhum parcelamento detectado.</p>
                  ) : (
                      <div className="space-y-2">
                          {installments.map((inst, idx) => (
                              <div key={idx} className="flex gap-2 items-center">
                                  <input 
                                    className="w-12 p-1 text-center text-xs border rounded"
                                    placeholder="#"
                                    value={inst.number}
                                    onChange={(e) => updateInstallment(idx, 'number', e.target.value)}
                                  />
                                  <input 
                                    type="date"
                                    className="flex-1 p-1 text-xs border rounded"
                                    value={inst.date}
                                    onChange={(e) => updateInstallment(idx, 'date', e.target.value)}
                                  />
                                  <input 
                                    type="number"
                                    className="w-20 p-1 text-right text-xs border rounded"
                                    placeholder="Valor"
                                    value={inst.amount}
                                    onChange={(e) => updateInstallment(idx, 'amount', e.target.value)}
                                  />
                                  <button onClick={() => removeInstallment(idx)} className="text-red-400 hover:text-red-600">
                                      <Trash2 size={14} />
                                  </button>
                              </div>
                          ))}
                          
                          {isTotalMismatch && (
                              <div className="flex items-center gap-2 text-xs text-orange-600 bg-orange-50 p-2 rounded mt-2">
                                  <AlertTriangle size={14} />
                                  <span>Soma das parcelas (R$ {installmentsTotal.toFixed(2)}) difere do total.</span>
                              </div>
                          )}
                      </div>
                  )}
              </div>

              {/* Category Selector with ADD Capability */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                  <Tag size={14} /> Categoria
                </label>
                
                {isAddingCategory ? (
                   <div className="flex items-center gap-2">
                       <input 
                           type="text" 
                           autoFocus
                           className="flex-1 px-4 py-2 bg-white border-2 border-blue-500 rounded-lg focus:outline-none text-slate-900"
                           placeholder="Digite o nome da categoria..."
                           value={newCategoryName}
                           onChange={(e) => setNewCategoryName(e.target.value)}
                           onKeyDown={(e) => e.key === 'Enter' && handleSaveNewCategory()}
                       />
                       <button 
                            onClick={handleSaveNewCategory}
                            className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                            title="Salvar Categoria"
                       >
                           <Check size={20} />
                       </button>
                       <button 
                            onClick={() => { setIsAddingCategory(false); setNewCategoryName(''); }}
                            className="p-2 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300"
                            title="Cancelar"
                       >
                           <X size={20} />
                       </button>
                   </div>
                ) : (
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-slate-900 appearance-none"
                    >
                      {availableCategories.map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                      ))}
                      <option disabled>──────────</option>
                      <option value="ADD_NEW_CATEGORY_OPTION" className="font-bold text-blue-600">+ Criar nova categoria...</option>
                    </select>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                  <MessageSquare size={14} /> Observação
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-slate-900 text-sm resize-none"
                  placeholder="Detalhes opcionais..."
                />
              </div>

            </div>
          </div>

          <div className="mt-6 flex gap-3 pt-4 border-t border-slate-100">
            <button
              onClick={onCancel}
              className="flex-1 py-3 px-4 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-medium flex items-center justify-center gap-2"
            >
              <X size={20} /> Cancelar
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
            >
              <Check size={20} /> Confirmar Nota
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiptConfirmationModal;
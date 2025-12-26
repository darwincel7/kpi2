import React, { useState } from 'react';
import { TARGETS } from '../constants';
import { Target as TargetType, BonusRule } from '../types';
import { getBonusRules, saveBonusRules } from '../services/kpiService';
import { Save, RefreshCw, AlertTriangle, Check, Shield, FileText, Plus, X, Edit2, Trash2, Power } from 'lucide-react';

const SettingsAudit: React.FC = () => {
  // Local state to simulate changing constants
  const [targets, setTargets] = useState<TargetType>({...TARGETS});
  // Load initial rules from service
  const [rules, setRules] = useState<BonusRule[]>(getBonusRules());
  const [hasChanges, setHasChanges] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // New/Edit Rule Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [newRule, setNewRule] = useState<Partial<BonusRule>>({
      name: '',
      metric: 'amount',
      threshold: 0,
      amount: 0,
      period: 'monthly',
      isActive: true
  });

  const handleTargetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTargets(prev => ({
        ...prev,
        [name]: parseFloat(value) || 0
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
      // Save rules to service
      saveBonusRules(rules);
      
      setShowSuccess(true);
      setHasChanges(false);
      setTimeout(() => setShowSuccess(false), 3000);
  };

  // Open Modal for Create
  const openCreateModal = () => {
      setEditingRuleId(null);
      setNewRule({ name: '', metric: 'amount', threshold: 0, amount: 0, period: 'monthly', isActive: true });
      setIsModalOpen(true);
  };

  // Open Modal for Edit
  const openEditModal = (rule: BonusRule) => {
      setEditingRuleId(rule.id);
      setNewRule({ ...rule });
      setIsModalOpen(true);
  };

  // Handle Create or Update Rule
  const handleSaveRule = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newRule.name || !newRule.threshold || !newRule.amount) return;

      let updatedRules = [...rules];

      if (editingRuleId) {
          // Update existing
          updatedRules = updatedRules.map(r => r.id === editingRuleId ? { ...r, ...newRule } as BonusRule : r);
      } else {
          // Create new
          const rule: BonusRule = {
              id: `b${Date.now()}`,
              name: newRule.name!,
              metric: newRule.metric as any,
              threshold: Number(newRule.threshold),
              amount: Number(newRule.amount),
              period: 'monthly',
              isActive: true
          };
          updatedRules.push(rule);
      }

      setRules(updatedRules);
      setIsModalOpen(false);
      setHasChanges(true); // Indicate that list has changed
  };

  // Handle Delete
  const handleDeleteRule = (id: string) => {
      if (confirm('¿Estás segura de eliminar esta regla?')) {
          setRules(prev => prev.filter(r => r.id !== id));
          setHasChanges(true);
      }
  };

  // Handle Toggle Active
  const handleToggleRule = (id: string) => {
      setRules(prev => prev.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r));
      setHasChanges(true);
  };

  const mockLogs = [
      { id: 1, action: 'Actualización Meta Ventas', user: 'Laura Gerente', date: 'Hace 2 horas', details: 'Cambio de 400,000 a 450,000' },
      { id: 2, action: 'Registro Eliminado', user: 'Laura Gerente', date: 'Ayer, 4:30 PM', details: 'Corrección manual entrada #4492' },
      { id: 3, action: 'Inicio de Sesión', user: 'Ana Vendedora', date: 'Hoy, 8:01 AM', details: 'IP: 192.168.1.45' },
      { id: 4, action: 'Cambio Regla Bono', user: 'Sistema', date: '01 Oct 2023', details: 'Reset mensual automático' },
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center">
                <Shield className="mr-2 text-slate-800" /> Configuración & Auditoría
            </h1>
            <p className="text-slate-500">Define las reglas del juego y monitorea la actividad.</p>
          </div>
          {hasChanges && (
             <button 
                onClick={handleSave}
                className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center animate-pulse"
             >
                <Save size={18} className="mr-2" /> Guardar Todo
             </button>
          )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Target Configuration */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative">
              <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-bold text-slate-800 flex items-center">
                      <RefreshCw size={18} className="mr-2 text-blue-500" /> Metas Mensuales (KPIs)
                  </h2>
              </div>
              
              <div className="space-y-6">
                  <div className="bg-blue-50 p-4 rounded-xl text-sm text-blue-800 mb-4">
                      <strong>Nota:</strong> Estas metas están enfocadas en el mes completo (día 1 al 30). El sistema calculará automáticamente la proporción diaria requerida.
                  </div>

                  <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1">Meta Venta Mensual (RD$)</label>
                      <input 
                        type="number" 
                        name="monthlySalesAmount"
                        value={targets.monthlySalesAmount} 
                        onChange={handleTargetChange}
                        className="w-full border border-slate-300 bg-white rounded-lg px-4 py-3 font-bold text-slate-800 focus:ring-2 focus:ring-blue-100 outline-none shadow-sm" 
                      />
                  </div>

                  <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1">Meta Equipos Vendidos (Unidades Mensuales)</label>
                      <input 
                        type="number" 
                        name="monthlyDevices"
                        value={targets.monthlyDevices} 
                        onChange={handleTargetChange}
                        className="w-full border border-slate-300 bg-white rounded-lg px-4 py-3 font-bold text-slate-800 focus:ring-2 focus:ring-blue-100 outline-none shadow-sm" 
                      />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                          <label className="block text-sm font-medium text-slate-600 mb-1">Conversión Meta (%)</label>
                          <input 
                            type="number" 
                            name="dailyConversion"
                            value={targets.dailyConversion} 
                            onChange={handleTargetChange}
                            className="w-full border border-slate-300 bg-white rounded-lg px-4 py-3 font-bold text-slate-800 focus:ring-2 focus:ring-blue-100 outline-none shadow-sm" 
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-slate-600 mb-1">Seguimientos Diarios (#)</label>
                          <input 
                            type="number" 
                            name="dailyFollowUps"
                            value={targets.dailyFollowUps} 
                            onChange={handleTargetChange}
                            className="w-full border border-slate-300 bg-white rounded-lg px-4 py-3 font-bold text-slate-800 focus:ring-2 focus:ring-blue-100 outline-none shadow-sm" 
                          />
                      </div>
                  </div>

                  <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-100 flex items-start">
                      <AlertTriangle className="text-yellow-600 mr-3 mt-0.5 flex-shrink-0" size={18} />
                      <p className="text-sm text-yellow-800">
                          Cambiar estas metas recalculará los puntajes (Scores) de los días pasados si se selecciona "Recálculo Histórico". Por defecto, solo aplica a hoy en adelante.
                      </p>
                  </div>
              </div>
          </div>

          {/* Bonus Rules & Logs */}
          <div className="space-y-8">
              {/* Active Bonuses */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-slate-800">Reglas de Bonos</h2>
                    <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-500">{rules.length} reglas</span>
                  </div>
                  
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                      {rules.map(rule => (
                          <div key={rule.id} className={`flex justify-between items-center p-3 border rounded-lg transition-all ${rule.isActive ? 'border-slate-100 bg-white' : 'border-slate-100 bg-slate-50 opacity-75'}`}>
                              <div className="flex-1">
                                  <div className="flex items-center">
                                    <p className={`font-bold text-sm ${rule.isActive ? 'text-slate-700' : 'text-slate-400 line-through'}`}>{rule.name}</p>
                                    {!rule.isActive && <span className="ml-2 text-[10px] uppercase bg-slate-200 text-slate-500 px-1 rounded font-bold">Inactivo</span>}
                                  </div>
                                  <p className="text-xs text-slate-400">Meta: {rule.threshold.toLocaleString()} • {rule.metric === 'devices' ? 'equipos' : rule.metric}</p>
                              </div>
                              
                              <div className="flex items-center space-x-3">
                                  {rule.isActive && (
                                    <span className="font-bold text-green-600 bg-green-50 px-2 py-1 rounded text-sm whitespace-nowrap">
                                        RD$ {rule.amount.toLocaleString()}
                                    </span>
                                  )}
                                  
                                  {/* Actions */}
                                  <div className="flex items-center bg-slate-50 rounded-lg p-1 border border-slate-200">
                                      <button 
                                        onClick={() => handleToggleRule(rule.id)}
                                        title={rule.isActive ? "Desactivar" : "Activar"}
                                        className={`p-1.5 rounded-md transition-colors ${rule.isActive ? 'text-green-500 hover:bg-green-100' : 'text-slate-400 hover:bg-slate-200'}`}
                                      >
                                          <Power size={14} />
                                      </button>
                                      <button 
                                        onClick={() => openEditModal(rule)}
                                        title="Editar"
                                        className="p-1.5 text-blue-500 hover:bg-blue-100 rounded-md transition-colors"
                                      >
                                          <Edit2 size={14} />
                                      </button>
                                      <button 
                                        onClick={() => handleDeleteRule(rule.id)}
                                        title="Eliminar"
                                        className="p-1.5 text-red-400 hover:bg-red-100 hover:text-red-600 rounded-md transition-colors"
                                      >
                                          <Trash2 size={14} />
                                      </button>
                                  </div>
                              </div>
                          </div>
                      ))}
                      <button 
                        onClick={openCreateModal}
                        className="w-full mt-2 py-3 text-sm text-blue-600 font-bold hover:bg-blue-50 rounded-xl transition-colors border border-dashed border-blue-200 flex items-center justify-center hover:border-blue-400"
                      >
                          <Plus size={16} className="mr-1" /> Agregar nueva regla
                      </button>
                  </div>
              </div>

              {/* Audit Log */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                  <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                      <FileText size={18} className="mr-2 text-slate-400" /> Log de Auditoría
                  </h2>
                  <div className="space-y-4">
                      {mockLogs.map(log => (
                          <div key={log.id} className="flex space-x-3 pb-4 border-b border-slate-50 last:border-0 last:pb-0">
                              <div className="mt-1">
                                  <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                              </div>
                              <div>
                                  <p className="text-sm font-bold text-slate-700">{log.action}</p>
                                  <p className="text-xs text-slate-500">{log.details}</p>
                                  <div className="flex items-center mt-1 space-x-2">
                                      <span className="text-[10px] bg-slate-100 px-1.5 rounded text-slate-500">{log.user}</span>
                                      <span className="text-[10px] text-slate-400">{log.date}</span>
                                  </div>
                              </div>
                          </div>
                      ))}
                  </div>
                  <button className="w-full text-center text-xs text-slate-400 mt-4 hover:text-slate-600">Ver historial completo</button>
              </div>
          </div>
      </div>

      {/* Add/Edit Rule Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black bg-opacity-40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md z-10 animate-fade-in">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800 text-lg">{editingRuleId ? 'Editar Regla' : 'Nueva Regla de Bono'}</h3>
                    <button onClick={() => setIsModalOpen(false)}><X className="text-slate-400 hover:text-slate-600" /></button>
                </div>
                <form onSubmit={handleSaveRule} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Nombre del Bono</label>
                        <input 
                            type="text" 
                            className="w-full border border-slate-300 bg-white rounded-lg px-4 py-2 text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Ej. Bono Navidad"
                            value={newRule.name}
                            onChange={e => setNewRule({...newRule, name: e.target.value})}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Métrica</label>
                        <select 
                            className="w-full border border-slate-300 bg-white rounded-lg px-4 py-2 text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={newRule.metric}
                            onChange={e => setNewRule({...newRule, metric: e.target.value as any})}
                        >
                            <option value="amount">Monto Vendido</option>
                            <option value="devices">Equipos Vendidos</option>
                            <option value="conversion">Porcentaje Conversión</option>
                            <option value="score">Score General</option>
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Meta a Lograr</label>
                            <input 
                                type="number" 
                                className="w-full border border-slate-300 bg-white rounded-lg px-4 py-2 text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="0"
                                value={newRule.threshold || ''}
                                onChange={e => setNewRule({...newRule, threshold: parseFloat(e.target.value)})}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Pago (RD$)</label>
                            <input 
                                type="number" 
                                className="w-full border border-slate-300 bg-white rounded-lg px-4 py-2 text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="0"
                                value={newRule.amount || ''}
                                onChange={e => setNewRule({...newRule, amount: parseFloat(e.target.value)})}
                                required
                            />
                        </div>
                    </div>
                    <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors mt-2">
                        {editingRuleId ? 'Actualizar Regla' : 'Guardar Nueva Regla'}
                    </button>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default SettingsAudit;
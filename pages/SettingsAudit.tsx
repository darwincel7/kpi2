import React, { useState, useEffect } from 'react';
import { TARGETS } from '../constants';
import { Target as TargetType, BonusRule, User, AuditLog } from '../types';
import { fetchBonusRules, createBonusRule, updateBonusRule, deleteBonusRule, seedDatabase, clearKPIEntries, fetchTargets, saveTargets, fetchAuditLogs, createAuditLog } from '../services/kpiService';
import { supabase } from '../services/supabaseClient';
import { Save, RefreshCw, AlertTriangle, Check, Shield, FileText, Plus, X, Edit2, Trash2, Power, Loader2, Database, UploadCloud, Trash } from 'lucide-react';

interface SettingsAuditProps {
    currentUser: User;
}

const SettingsAudit: React.FC<SettingsAuditProps> = ({ currentUser }) => {
  const [targets, setTargets] = useState<TargetType>({...TARGETS});
  const [rules, setRules] = useState<BonusRule[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingTargets, setSavingTargets] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [clearing, setClearing] = useState(false);
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

  const loadData = async () => {
    // Keep loading only on first fetch
    if(auditLogs.length === 0) setLoading(true);

    const [fetchedRules, fetchedTargets, fetchedLogs] = await Promise.all([
        fetchBonusRules(),
        fetchTargets(),
        fetchAuditLogs()
    ]);
    setRules(fetchedRules);
    setTargets(fetchedTargets);
    setAuditLogs(fetchedLogs);
    setLoading(false);
  };

  useEffect(() => {
    loadData();

    // Subscribe to Audit Logs
    const channel = supabase
      .channel('audit_changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'audit_logs' },
        (payload) => {
            const newLog = {
                id: payload.new.id,
                action: payload.new.action,
                user: payload.new.user_name,
                details: payload.new.details,
                date: new Date(payload.new.created_at).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute:'2-digit' })
            };
            setAuditLogs(prev => [newLog, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleTargetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTargets(prev => ({
        ...prev,
        [name]: parseFloat(value) || 0
    }));
  };

  const handleSaveTargets = async () => {
      setSavingTargets(true);
      try {
          await saveTargets(targets);
          await createAuditLog('Configuración Actualizada', currentUser.name, 'Actualización de metas globales (KPIs)');
          // No need to reload, real-time will catch log. But targets need local update or reload if other admin changed it.
          // For now we assume this user changed it.
          alert('Metas actualizadas correctamente. Todos los scores se recalcularán automáticamente.');
      } catch (error) {
          alert('Error al guardar las metas.');
      } finally {
          setSavingTargets(false);
      }
  };

  const handleSeedData = async () => {
    if(!confirm("¿Estás seguro? Esto insertará datos de prueba. Si ya existen datos, se duplicarán (usa 'Limpiar' primero para reiniciar).")) return;
    
    setSeeding(true);
    try {
      await seedDatabase();
      await createAuditLog('Carga Datos Mock', currentUser.name, 'Se insertaron datos de prueba en la BD');
      alert("¡Datos cargados exitosamente! Ve al Dashboard para verlos.");
    } catch (error) {
      alert("Error al cargar datos. Revisa la consola.");
    } finally {
      setSeeding(false);
    }
  };

  const handleClearData = async () => {
    if(!confirm("⚠️ ¡PELIGRO! Esto borrará TODO el historial de KPIs de la base de datos. ¿Continuar?")) return;
    
    setClearing(true);
    try {
      await clearKPIEntries();
      await createAuditLog('Limpieza de Datos', currentUser.name, 'Se eliminó todo el historial de KPIs');
      alert("Base de datos de KPIs limpiada correctamente.");
    } catch (error) {
      alert("Error al limpiar datos. Revisa la consola.");
    } finally {
      setClearing(false);
    }
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
  const handleSaveRule = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newRule.name || !newRule.threshold || !newRule.amount) return;
      setLoading(true);

      try {
          if (editingRuleId) {
              await updateBonusRule({ ...newRule, id: editingRuleId } as BonusRule);
              await createAuditLog('Bono Editado', currentUser.name, `Actualización regla: ${newRule.name}`);
          } else {
              await createBonusRule(newRule as BonusRule);
              await createAuditLog('Bono Creado', currentUser.name, `Nueva regla: ${newRule.name}`);
          }
          await loadData(); // Reload both to be safe
          setIsModalOpen(false);
          setShowSuccess(true);
          setTimeout(() => setShowSuccess(false), 3000);
      } catch (e) {
          alert('Error al guardar la regla');
      } finally {
          setLoading(false);
      }
  };

  // Handle Delete
  const handleDeleteRule = async (id: string, name: string) => {
      if (confirm('¿Estás segura de eliminar esta regla?')) {
          setLoading(true);
          await deleteBonusRule(id);
          await createAuditLog('Bono Eliminado', currentUser.name, `Regla eliminada: ${name}`);
          await loadData();
          setLoading(false);
      }
  };

  // Handle Toggle Active
  const handleToggleRule = async (rule: BonusRule) => {
      setLoading(true);
      const newStatus = !rule.isActive;
      await updateBonusRule({ ...rule, isActive: newStatus });
      await createAuditLog(newStatus ? 'Bono Activado' : 'Bono Desactivado', currentUser.name, `Regla: ${rule.name}`);
      await loadData();
      setLoading(false);
  };

  if (loading && rules.length === 0) return <div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin text-blue-600" /></div>;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center">
                <Shield className="mr-2 text-slate-800" /> Configuración & Auditoría
            </h1>
            <p className="text-slate-500">Define las reglas del juego y monitorea la actividad.</p>
          </div>
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
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Meta Equipos/Mes</label>
                        <input 
                            type="number" 
                            name="monthlyDevices"
                            value={targets.monthlyDevices} 
                            onChange={handleTargetChange}
                            className="w-full border border-slate-300 bg-white rounded-lg px-4 py-3 font-bold text-slate-800 focus:ring-2 focus:ring-blue-100 outline-none shadow-sm" 
                        />
                    </div>
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
                        <label className="block text-sm font-medium text-slate-600 mb-1">Seguimientos/Día</label>
                        <input 
                            type="number" 
                            name="dailyFollowUps"
                            value={targets.dailyFollowUps} 
                            onChange={handleTargetChange}
                            className="w-full border border-slate-300 bg-white rounded-lg px-4 py-3 font-bold text-slate-800 focus:ring-2 focus:ring-blue-100 outline-none shadow-sm" 
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Max Errores</label>
                        <input 
                            type="number" 
                            name="maxErrors"
                            value={targets.maxErrors} 
                            onChange={handleTargetChange}
                            className="w-full border border-slate-300 bg-white rounded-lg px-4 py-3 font-bold text-slate-800 focus:ring-2 focus:ring-blue-100 outline-none shadow-sm" 
                        />
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-slate-100">
                    <button 
                        onClick={handleSaveTargets}
                        disabled={savingTargets}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl flex items-center justify-center transition-colors disabled:opacity-70"
                    >
                        {savingTargets ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" size={20} />}
                        Guardar Configuración Global
                    </button>
                    <p className="text-center text-xs text-slate-400 mt-2">
                        Los cambios afectarán inmediatamente a todos los usuarios.
                    </p>
                  </div>
              </div>

              {/* Data Management Section */}
              <div className="mt-8 pt-6 border-t border-slate-100">
                <h2 className="text-lg font-bold text-slate-800 flex items-center mb-4">
                    <Database size={18} className="mr-2 text-purple-500" /> Gestión de Datos
                </h2>
                <div className="bg-purple-50 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                   <div className="flex-1">
                     <p className="font-bold text-purple-900">Datos de Prueba</p>
                     <p className="text-xs text-purple-700">Gestiona la información de demostración para el Dashboard.</p>
                   </div>
                   <div className="flex items-center space-x-2 w-full sm:w-auto">
                     <button 
                       onClick={handleClearData}
                       disabled={clearing || seeding}
                       className="flex-1 sm:flex-none bg-white text-red-500 border border-red-200 hover:bg-red-50 text-sm font-bold px-4 py-2 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50"
                     >
                       {clearing ? <Loader2 className="animate-spin mr-2" size={16}/> : <Trash className="mr-2" size={16}/>}
                       Limpiar
                     </button>
                     <button 
                       onClick={handleSeedData}
                       disabled={seeding || clearing}
                       className="flex-1 sm:flex-none bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold px-4 py-2 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50"
                     >
                       {seeding ? <Loader2 className="animate-spin mr-2" size={16}/> : <UploadCloud className="mr-2" size={16}/>}
                       Cargar Mock
                     </button>
                   </div>
                </div>
              </div>
          </div>

          {/* Bonus Rules & Logs */}
          <div className="space-y-8">
              {/* Active Bonuses */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-slate-800">Reglas de Bonos (Cloud DB)</h2>
                    <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-500">{rules.length} reglas</span>
                  </div>
                  
                  {loading && <div className="text-center py-4 text-blue-600 text-sm">Sincronizando...</div>}

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
                                        onClick={() => handleToggleRule(rule)}
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
                                        onClick={() => handleDeleteRule(rule.id, rule.name)}
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
                      <FileText size={18} className="mr-2 text-slate-400" /> Log de Auditoría (En Vivo)
                  </h2>
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                      {auditLogs.length === 0 ? (
                          <p className="text-center text-slate-400 text-sm py-4">No hay actividad registrada aún.</p>
                      ) : (
                          auditLogs.map(log => (
                              <div key={log.id} className="flex space-x-3 pb-4 border-b border-slate-50 last:border-0 last:pb-0 animate-fade-in">
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
                          ))
                      )}
                  </div>
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
                    <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors mt-2 disabled:opacity-50">
                        {loading ? 'Guardando...' : (editingRuleId ? 'Actualizar Regla' : 'Guardar Nueva Regla')}
                    </button>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default SettingsAudit;
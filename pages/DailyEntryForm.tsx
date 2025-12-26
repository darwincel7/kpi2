import React, { useState, useEffect, useMemo } from 'react';
import { User, KPIEntry, Target } from '../types';
import { Save, CheckCircle, Smartphone, FileText, Calendar, TrendingUp, AlertCircle, RefreshCw } from 'lucide-react';
import { createEntry, updateEntry, createAuditLog, fetchTargets, fetchEntriesByUser, calculateScore } from '../services/kpiService';
import { TARGETS as DEFAULT_TARGETS } from '../constants';

interface DailyEntryFormProps {
  user: User;
  onComplete: () => void;
}

const DailyEntryForm: React.FC<DailyEntryFormProps> = ({ user, onComplete }) => {
  // Date handling
  const getTodayStr = () => {
      const now = new Date();
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  };

  const [entryDate, setEntryDate] = useState(getTodayStr());
  const [targets, setTargets] = useState<Target>(DEFAULT_TARGETS);
  const [loadingCheck, setLoadingCheck] = useState(false);
  
  // Edit Mode State
  const [existingEntryId, setExistingEntryId] = useState<string | null>(null);

  const initialFormState = {
    clientsAttended: 0,
    quotesSent: 0,
    followUps: 0,
    salesClosed: 0,
    amountSold: 0,
    devicesSold: 0,
    exchanges: 0,
    errors: 0,
    punctualityScore: 5,
    qualityScore: 5,
    notes: ''
  };

  const [formData, setFormData] = useState<Partial<KPIEntry>>(initialFormState);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Load Targets and Check for existing entry on Date/User change
  useEffect(() => {
    const init = async () => {
        setLoadingCheck(true);
        const [fetchedTargets, userEntries] = await Promise.all([
            fetchTargets(),
            fetchEntriesByUser(user.id)
        ]);
        setTargets(fetchedTargets);

        // Check if entry exists for this date
        const existing = userEntries.find(e => e.date === entryDate);
        if (existing) {
            setExistingEntryId(existing.id);
            setFormData({
                clientsAttended: existing.clientsAttended,
                quotesSent: existing.quotesSent,
                followUps: existing.followUps,
                salesClosed: existing.salesClosed,
                amountSold: existing.amountSold,
                devicesSold: existing.devicesSold,
                exchanges: existing.exchanges,
                errors: existing.errors,
                punctualityScore: existing.punctualityScore,
                qualityScore: existing.qualityScore,
                notes: existing.notes || ''
            });
        } else {
            setExistingEntryId(null);
            setFormData(initialFormState);
        }
        setLoadingCheck(false);
    };
    init();
  }, [user.id, entryDate]);

  // Real-time Score Calculation
  const projectedScore = useMemo(() => {
      const tempEntry = {
        ...formData,
        id: 'temp',
        userId: user.id,
        date: entryDate,
        // Ensure defaults for calculation
        clientsAttended: formData.clientsAttended || 0,
        quotesSent: formData.quotesSent || 0,
        followUps: formData.followUps || 0,
        salesClosed: formData.salesClosed || 0,
        amountSold: formData.amountSold || 0,
        devicesSold: formData.devicesSold || 0,
        exchanges: formData.exchanges || 0,
        errors: formData.errors || 0,
        punctualityScore: formData.punctualityScore || 5,
        qualityScore: formData.qualityScore || 5,
      } as KPIEntry;

      return calculateScore(tempEntry, targets);
  }, [formData, targets, user.id, entryDate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'notes' ? value : (parseFloat(value) || 0)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const entryData: KPIEntry = {
        id: existingEntryId || '', // If editing, ID is preserved logic-side, but updateEntry uses ID param
        userId: user.id,
        date: entryDate,
        clientsAttended: formData.clientsAttended!,
        quotesSent: formData.quotesSent!,
        followUps: formData.followUps!,
        salesClosed: formData.salesClosed!,
        amountSold: formData.amountSold!,
        devicesSold: formData.devicesSold!,
        exchanges: formData.exchanges!,
        errors: formData.errors!,
        punctualityScore: formData.punctualityScore!,
        qualityScore: formData.qualityScore!,
        notes: formData.notes || ''
      };

      if (existingEntryId) {
          await updateEntry(existingEntryId, entryData);
          await createAuditLog('Reporte Actualizado', user.name, `Actualización fecha: ${entryDate}. Score: ${projectedScore.totalScore}`);
      } else {
          await createEntry(entryData);
          await createAuditLog('Reporte Diario', user.name, `Ventas: ${entryData.salesClosed}, Monto: ${entryData.amountSold}, Fecha: ${entryData.date}`);
      }
      
      setSuccess(true);
      setSubmitting(false);
      setTimeout(onComplete, 1500);
    } catch (error) {
      console.error(error);
      setSubmitting(false);
      alert('Hubo un error al guardar los datos. Por favor revisa la conexión.');
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-fade-in bg-white rounded-3xl shadow-xl">
        <div className="bg-green-100 p-6 rounded-full text-green-600 mb-6">
          <CheckCircle size={64} />
        </div>
        <h2 className="text-3xl font-bold text-slate-900 mb-2">¡{existingEntryId ? 'Actualización Exitosa' : 'Registro Exitoso'}!</h2>
        <p className="text-slate-600">Las métricas de {user.name} han sido guardadas.</p>
      </div>
    );
  }

  // Common input classes for consistency
  const inputClass = "w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 font-bold text-lg focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all placeholder:text-slate-300";
  const labelClass = "block text-sm font-semibold text-slate-600 mb-2 uppercase tracking-wide";

  return (
    <div className="max-w-4xl mx-auto pb-12 animate-fade-in relative">
      
      {/* Sticky Score Preview */}
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm -mx-4 px-6 py-3 mb-6 flex items-center justify-between transition-all">
          <div className="flex items-center space-x-4">
              <div className={`flex flex-col items-center px-3 py-1 rounded-lg ${projectedScore.totalScore >= 80 ? 'bg-green-100 text-green-700' : projectedScore.totalScore >= 60 ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                  <span className="text-[10px] uppercase font-bold tracking-wider">Score Proyectado</span>
                  <span className="text-2xl font-black leading-none">{projectedScore.totalScore}</span>
              </div>
              <div className="hidden sm:flex space-x-4 text-sm font-medium text-slate-500">
                  <span className={projectedScore.salesScore >= 25 ? 'text-green-600 font-bold' : ''}>Ventas: {Math.round(projectedScore.salesScore)}pts</span>
                  <span className={projectedScore.conversionScore >= 15 ? 'text-green-600 font-bold' : ''}>Conv: {Math.round(projectedScore.conversionScore)}pts</span>
                  <span className={projectedScore.devicesScore >= 8 ? 'text-green-600 font-bold' : ''}>Equipos: {Math.round(projectedScore.devicesScore)}pts</span>
              </div>
          </div>
          <div>
              {existingEntryId && (
                  <span className="flex items-center text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-full border border-orange-100">
                      <RefreshCw size={12} className="mr-1 animate-spin-slow" /> Modo Edición
                  </span>
              )}
          </div>
      </div>

      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 px-2">
        <div>
           <h1 className="text-3xl font-extrabold text-slate-900">{existingEntryId ? 'Editar Reporte' : 'Registro Diario'}</h1>
           <p className="text-slate-600 mt-2 text-lg">
             Colaboradora: <span className="font-bold text-blue-600">{user.name}</span>
           </p>
        </div>
        
        <div className={`bg-white p-2 rounded-xl border shadow-sm transition-colors ${existingEntryId ? 'border-orange-200 bg-orange-50' : 'border-slate-200'}`}>
            <label className="block text-xs font-bold text-slate-400 mb-1 ml-1 uppercase">Fecha del Reporte</label>
            <div className="relative">
                <Calendar className="absolute left-3 top-2.5 text-slate-500" size={18} />
                <input 
                    type="date" 
                    value={entryDate}
                    max={getTodayStr()}
                    onChange={(e) => setEntryDate(e.target.value)}
                    className="pl-10 pr-3 py-2 bg-transparent rounded-lg text-slate-800 font-medium focus:ring-0 outline-none w-full cursor-pointer"
                />
            </div>
        </div>
      </div>

      {loadingCheck ? (
          <div className="flex justify-center py-20">
              <RefreshCw className="animate-spin text-blue-500" size={48} />
          </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-8 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 md:p-10 rounded-3xl shadow-lg border border-white/50">
            
            {/* Alert if editing */}
            {existingEntryId && (
                <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl flex items-start text-orange-800 text-sm">
                    <AlertCircle className="mr-2 flex-shrink-0 mt-0.5" size={18} />
                    <div>
                        <strong>Atención:</strong> Ya existe un reporte para esta fecha. Los cambios que realices aquí sobrescribirán los datos anteriores.
                    </div>
                </div>
            )}

            {/* Section 1: Volume */}
            <div className="bg-white/60 p-6 rounded-2xl border border-white/60 shadow-sm backdrop-blur-sm">
            <h3 className="text-lg font-bold text-blue-700 mb-6 border-b border-blue-100 pb-2 flex items-center">
                <span className="bg-blue-100 text-blue-600 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">1</span>
                Volumen & Atención
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                <label className={labelClass}>Clientes Atendidos</label>
                <input type="number" name="clientsAttended" min="0" required value={formData.clientsAttended} onChange={handleChange} className={inputClass} placeholder="0" />
                </div>
                <div>
                <label className={labelClass}>Cotizaciones Enviadas</label>
                <input type="number" name="quotesSent" min="0" required value={formData.quotesSent} onChange={handleChange} className={inputClass} placeholder="0" />
                </div>
                <div>
                <label className={labelClass}>Seguimientos</label>
                <input type="number" name="followUps" min="0" required value={formData.followUps} onChange={handleChange} className={inputClass} placeholder="0" />
                </div>
                <div>
                <label className={labelClass}>Cambiazos</label>
                <input type="number" name="exchanges" min="0" required value={formData.exchanges} onChange={handleChange} className={inputClass} placeholder="0" />
                </div>
            </div>
            </div>

            {/* Section 2: Sales */}
            <div className="bg-white/60 p-6 rounded-2xl border border-white/60 shadow-sm backdrop-blur-sm">
            <h3 className="text-lg font-bold text-green-700 mb-6 border-b border-green-100 pb-2 flex items-center">
                <span className="bg-green-100 text-green-600 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">2</span>
                Resultados de Venta
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="md:col-span-2">
                <label className={labelClass}>Equipos Vendidos (Unidades)</label>
                <div className="relative">
                    <Smartphone className="absolute left-4 top-3.5 text-slate-400" size={20} />
                    <input type="number" name="devicesSold" min="0" required value={formData.devicesSold} onChange={handleChange} className={`${inputClass} pl-12 border-blue-200 focus:border-blue-500`} placeholder="0" />
                </div>
                </div>
                <div>
                <label className={labelClass}>Ventas Cerradas (Facturas)</label>
                <input type="number" name="salesClosed" min="0" required value={formData.salesClosed} onChange={handleChange} className={`${inputClass} border-green-200 focus:border-green-500 focus:ring-green-100`} placeholder="0" />
                </div>
                <div>
                <label className={labelClass}>Monto Total (RD$)</label>
                <div className="relative">
                    <span className="absolute left-4 top-3.5 text-slate-400 font-bold text-lg">RD$</span>
                    <input type="number" name="amountSold" min="0" step="100" required value={formData.amountSold} onChange={handleChange} className={`${inputClass} pl-16 border-green-200 focus:border-green-500 focus:ring-green-100 text-green-800`} placeholder="0.00" />
                </div>
                </div>
            </div>
            </div>

            {/* Section 3: Quality */}
            <div className="bg-white/60 p-6 rounded-2xl border border-white/60 shadow-sm backdrop-blur-sm">
            <h3 className="text-lg font-bold text-purple-700 mb-6 border-b border-purple-100 pb-2 flex items-center">
                <span className="bg-purple-100 text-purple-600 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">3</span>
                Calidad & Disciplina
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                <label className={labelClass}>Errores Operativos</label>
                <input type="number" name="errors" min="0" required value={formData.errors} onChange={handleChange} className={`${inputClass} border-red-200 focus:border-red-500 focus:ring-red-100 text-red-700`} placeholder="0" />
                </div>
                <div>
                <label className={labelClass}>Puntualidad (1-5)</label>
                <select name="punctualityScore" value={formData.punctualityScore} onChange={handleChange} className={inputClass}>
                    {[1,2,3,4,5].map(v => <option key={v} value={v}>{v}</option>)}
                </select>
                </div>
                <div>
                <label className={labelClass}>Autoevaluación Calidad</label>
                <select name="qualityScore" value={formData.qualityScore} onChange={handleChange} className={inputClass}>
                    {[1,2,3,4,5].map(v => <option key={v} value={v}>{v}</option>)}
                </select>
                </div>
            </div>
            </div>

            {/* Section 4: Notes */}
            <div className="bg-white/60 p-6 rounded-2xl border border-white/60 shadow-sm backdrop-blur-sm">
            <h3 className="text-lg font-bold text-slate-700 mb-6 border-b border-slate-200 pb-2 flex items-center">
                <span className="bg-slate-200 text-slate-600 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">4</span>
                Observaciones
            </h3>
            <div>
                <label className={labelClass}>Notas del día (Opcional)</label>
                <div className="relative">
                <FileText className="absolute left-4 top-4 text-slate-400" size={20} />
                <textarea 
                    name="notes" 
                    value={formData.notes} 
                    onChange={handleChange} 
                    className={`${inputClass} pl-12 h-24 resize-none text-base font-normal`} 
                    placeholder="Ej: Sistema lento por la mañana, lluvia intensa afectó tráfico..." 
                />
                </div>
            </div>
            </div>

            <div className="pt-4">
            <button 
                type="submit" 
                disabled={submitting}
                className={`w-full py-5 rounded-2xl text-white font-bold text-xl shadow-xl shadow-blue-200 flex items-center justify-center space-x-3 transition-all transform hover:scale-[1.02] active:scale-[0.98] ${
                submitting ? 'bg-slate-400 cursor-not-allowed' : 
                existingEntryId ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600' :
                'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                }`}
            >
                {submitting ? (
                <span>Procesando...</span>
                ) : (
                <>
                    <Save size={24} />
                    <span>{existingEntryId ? 'Actualizar Reporte Existente' : 'Guardar Registro Diario'}</span>
                </>
                )}
            </button>
            </div>
        </form>
      )}
    </div>
  );
};

export default DailyEntryForm;
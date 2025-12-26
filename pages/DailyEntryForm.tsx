import React, { useState } from 'react';
import { User, KPIEntry } from '../types';
import { Save, CheckCircle, Smartphone } from 'lucide-react';
import { addEntry } from '../services/kpiService';

interface DailyEntryFormProps {
  user: User;
  onComplete: () => void;
}

const DailyEntryForm: React.FC<DailyEntryFormProps> = ({ user, onComplete }) => {
  const [formData, setFormData] = useState<Partial<KPIEntry>>({
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
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    setTimeout(() => {
      const newEntry: KPIEntry = {
        id: crypto.randomUUID(),
        userId: user.id,
        date: new Date().toISOString().split('T')[0],
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
        notes: ''
      };

      addEntry(newEntry);
      setSuccess(true);
      setSubmitting(false);
      setTimeout(onComplete, 1500);
    }, 800);
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-fade-in bg-white rounded-3xl shadow-xl">
        <div className="bg-green-100 p-6 rounded-full text-green-600 mb-6">
          <CheckCircle size={64} />
        </div>
        <h2 className="text-3xl font-bold text-slate-900 mb-2">¡Registro Exitoso!</h2>
        <p className="text-slate-600">Tus métricas de hoy han sido guardadas correctamente.</p>
      </div>
    );
  }

  // Common input classes for consistency
  const inputClass = "w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 font-bold text-lg focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all placeholder:text-slate-300";
  const labelClass = "block text-sm font-semibold text-slate-600 mb-2 uppercase tracking-wide";

  return (
    <div className="max-w-3xl mx-auto pb-12">
      <div className="mb-8 text-center md:text-left">
        <h1 className="text-3xl font-extrabold text-slate-900">Registro Diario</h1>
        <p className="text-slate-600 mt-2 text-lg">Hola {user.name.split(' ')[0]}, registra tus resultados de hoy.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 md:p-10 rounded-3xl shadow-lg border border-white/50">
        
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

        <div className="pt-4">
          <button 
            type="submit" 
            disabled={submitting}
            className={`w-full py-5 rounded-2xl text-white font-bold text-xl shadow-xl shadow-blue-200 flex items-center justify-center space-x-3 transition-all transform hover:scale-[1.02] active:scale-[0.98] ${
              submitting ? 'bg-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
            }`}
          >
            {submitting ? (
              <span>Procesando...</span>
            ) : (
              <>
                <Save size={24} />
                <span>Guardar Registro Diario</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DailyEntryForm;
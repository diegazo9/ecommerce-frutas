import { useState } from 'react';

export const AdminSettings = () => {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    storeName: 'VibranFrut',
    contactEmail: 'EcommerceVerduras@gmail.com',
    whatsapp: '+54 11 1234-5678',
    freeShippingThreshold: 15000,
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simular guardado
    setTimeout(() => {
      setLoading(false);
      alert('Configuración guardada correctamente.');
    }, 1000);
  };

  return (
    <div className="p-6 max-w-3xl">
      <h2 className="text-2xl font-black text-slate-800 mb-6">Configuración General</h2>

      <form onSubmit={handleSave} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 space-y-6">
        
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Nombre de la Tienda</label>
          <input 
            type="text" 
            className="w-full p-3 border rounded-xl"
            value={settings.storeName}
            onChange={e => setSettings({...settings, storeName: e.target.value})}
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Email de Contacto</label>
          <input 
            type="email" 
            className="w-full p-3 border rounded-xl"
            value={settings.contactEmail}
            onChange={e => setSettings({...settings, contactEmail: e.target.value})}
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">WhatsApp (Pedidos)</label>
          <input 
            type="text" 
            className="w-full p-3 border rounded-xl"
            value={settings.whatsapp}
            onChange={e => setSettings({...settings, whatsapp: e.target.value})}
          />
        </div>

        <div className="pt-4 border-t border-slate-100">
          <label className="block text-sm font-bold text-slate-700 mb-2">Monto Mínimo Envío Gratis ($)</label>
          <input 
            type="number" 
            className="w-full p-3 border rounded-xl"
            value={settings.freeShippingThreshold}
            onChange={e => setSettings({...settings, freeShippingThreshold: Number(e.target.value)})}
          />
        </div>

        <div className="pt-6">
          <button 
            type="submit" 
            disabled={loading}
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-8 rounded-xl transition-colors"
          >
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>

      </form>
    </div>
  );
};

import { useEffect, useState, useMemo } from 'react';
import { getOrderFinances, getOrders } from '../services/api';
import type { FinanceSettlement, Order } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Loader2, 
  DollarSign, 
  Percent, 
  Wallet, 
  Calendar, 
  Search, 
  Info, 
  CheckCircle2, 
  Building2, 
  Sparkles
} from 'lucide-react';

const MP_COMMISSION_PLANS = [
  { id: 'immediate', label: 'En el momento (6.39% + IVA)', rate: 0.0773, desc: 'Dinero disponible al instante' },
  { id: '10days', label: 'A 10 días (4.29% + IVA)', rate: 0.0519, desc: 'Dinero liberado en 10 días' },
  { id: '18days', label: 'A 18 días (3.39% + IVA)', rate: 0.0410, desc: 'Dinero liberado en 18 días' },
  { id: '35days', label: 'A 35 días (1.79% + IVA)', rate: 0.0217, desc: 'Comisión más baja' },
];

export const AdminFinance = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settlements, setSettlements] = useState<FinanceSettlement[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string>('immediate');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'PENDING'>('PAID');
  const [selectedSettlement, setSelectedSettlement] = useState<FinanceSettlement | null>(null);

  const activePlan = MP_COMMISSION_PLANS.find(p => p.id === selectedPlan) || MP_COMMISSION_PLANS[0];

  useEffect(() => {
    fetchFinanceData();
  }, [token]);

  const fetchFinanceData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Intentar primero con el endpoint dedicado
      try {
        const data = await getOrderFinances();
        if (data && data.settlements) {
          setSettlements(data.settlements);
          return;
        }
      } catch (endpointErr) {
        console.warn('Endpoint /finances no disponible, calculando desde historial de órdenes:', endpointErr);
      }

      // Fallback transparente: calcular a partir de las órdenes registradas
      if (token) {
        const ordersData = await getOrders(token);
        const calculatedSettlements: FinanceSettlement[] = (ordersData || []).map((order: Order) => {
          const gross = Number(order.total);
          const isPaid = ['PAGADO', 'ENTREGADO', 'EN_PREPARACION'].includes(order.status);
          const feeAmount = Number((gross * activePlan.rate).toFixed(2));
          const netAmount = Number((gross - feeAmount).toFixed(2));

          return {
            orderId: order.id,
            mpPaymentId: order.id ? `MP-${order.id}` : null,
            date: order.createdAt,
            customerName: order.user?.name || 'Cliente',
            customerEmail: order.user?.email || '',
            status: order.status,
            isPaid,
            grossAmount: gross,
            feeAmount,
            netAmount,
            feeDetail: activePlan.label,
            paymentMethod: 'Mercado Pago'
          };
        });
        setSettlements(calculatedSettlements);
      }
    } catch (err: any) {
      console.error('Error al cargar datos financieros:', err);
      setError(err.message || 'Error al obtener liquidaciones');
    } finally {
      setLoading(false);
    }
  };

  // Recalcular según el plan seleccionado por el administrador
  const recalculatedSettlements = useMemo(() => {
    return settlements.map(item => {
      const fee = Number((item.grossAmount * activePlan.rate).toFixed(2));
      const net = Number((item.grossAmount - fee).toFixed(2));
      return {
        ...item,
        feeAmount: fee,
        netAmount: net,
        feeDetail: activePlan.label
      };
    });
  }, [settlements, activePlan]);

  const filteredSettlements = useMemo(() => {
    return recalculatedSettlements.filter(item => {
      const matchesSearch = 
        String(item.orderId).includes(searchTerm) ||
        (item.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.customerEmail || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = 
        statusFilter === 'ALL' ||
        (statusFilter === 'PAID' && item.isPaid) ||
        (statusFilter === 'PENDING' && !item.isPaid);

      return matchesSearch && matchesStatus;
    });
  }, [recalculatedSettlements, searchTerm, statusFilter]);

  // Métricas financieras calculadas
  const paidSettlements = recalculatedSettlements.filter(s => s.isPaid);
  const totalGross = paidSettlements.reduce((sum, s) => sum + s.grossAmount, 0);
  const totalFees = paidSettlements.reduce((sum, s) => sum + s.feeAmount, 0);
  const totalNet = paidSettlements.reduce((sum, s) => sum + s.netAmount, 0);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-600 mb-4" />
        <p className="text-slate-600 font-bold">Calculando liquidaciones y comisiones de Mercado Pago...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
            <span className="p-2.5 bg-emerald-100 text-emerald-700 rounded-2xl">
              <Wallet className="w-7 h-7" />
            </span>
            Finanzas y Liquidaciones
          </h1>
          <p className="text-slate-500 mt-1 font-medium">
            Control de cobros brutos, comisiones de Mercado Pago y dinero neto acreditado
          </p>
        </div>

        {/* Plan Selector */}
        <div className="bg-white p-2 rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400 pl-2 hidden sm:inline">Tu plan en MP:</span>
          <select 
            value={selectedPlan}
            onChange={(e) => setSelectedPlan(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 rounded-xl px-3 py-2 outline-none focus:border-emerald-500 cursor-pointer"
          >
            {MP_COMMISSION_PLANS.map(plan => (
              <option key={plan.id} value={plan.id}>
                {plan.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-amber-50 text-amber-800 p-4 rounded-2xl mb-6 text-sm font-semibold border border-amber-200 flex items-center gap-3">
          <Info className="w-5 h-5 text-amber-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Financial Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        
        {/* Total Bruto */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400">Total Facturado (Bruto)</span>
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-3xl font-black text-slate-800 tracking-tight">
            ${totalGross.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </h3>
          <p className="text-xs font-medium text-slate-400 mt-2">
            Monto total abonado por los clientes ({paidSettlements.length} cobros)
          </p>
        </div>

        {/* Comisión Mercado Pago */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black uppercase tracking-wider text-rose-500">Comisión Mercado Pago</span>
            <div className="p-2.5 bg-rose-50 text-rose-600 rounded-2xl">
              <Percent className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-3xl font-black text-rose-600 tracking-tight">
            -${totalFees.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </h3>
          <div className="flex items-center gap-2 mt-2">
            <span className="inline-block px-2 py-0.5 bg-rose-50 text-rose-700 rounded-md text-[11px] font-bold">
              ~{(activePlan.rate * 100).toFixed(2)}% con IVA
            </span>
            <span className="text-xs text-slate-400 font-medium">{activePlan.desc}</span>
          </div>
        </div>

        {/* Dinero Neto Acreditado */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-6 rounded-3xl shadow-lg text-white relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-200">Dinero Neto Acreditado</span>
            <div className="p-2.5 bg-white/20 text-white rounded-2xl backdrop-blur-md">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-3xl font-black text-white tracking-tight">
            ${totalNet.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </h3>
          <p className="text-xs font-medium text-emerald-100 mt-2 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
            <span>Fondos limpios para tu cuenta bancaria / MP</span>
          </p>
        </div>

      </div>

      {/* Plan Info Banner */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            <strong>Información de Liquidación:</strong> Las comisiones se calculan considerando el IVA del 21% sobre la tarifa de Mercado Pago Argentina según el plan seleccionado.
          </span>
        </div>
        <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap bg-white px-3 py-1 rounded-full border border-slate-200 shadow-2xs">
          Pasarela Oficial: Mercado Pago Argentina 🇦🇷
        </span>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por ID de pedido o cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:border-emerald-500 focus:bg-white transition-all font-medium"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">Filtrar:</span>
          <button
            onClick={() => setStatusFilter('PAID')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
              statusFilter === 'PAID'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Acreditados / Pagados ({paidSettlements.length})
          </button>
          <button
            onClick={() => setStatusFilter('PENDING')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
              statusFilter === 'PENDING'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Pendientes
          </button>
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
              statusFilter === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos
          </button>
        </div>
      </div>

      {/* Settlements Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-xs uppercase tracking-wider">
                <th className="py-4 px-6">ID Pedido / Cobro</th>
                <th className="py-4 px-6">Fecha</th>
                <th className="py-4 px-6">Cliente</th>
                <th className="py-4 px-6">Estado</th>
                <th className="py-4 px-6 text-right">Monto Bruto</th>
                <th className="py-4 px-6 text-right">Comisión MP</th>
                <th className="py-4 px-6 text-right">Neto Acreditado</th>
                <th className="py-4 px-6 text-center">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm font-medium">
              {filteredSettlements.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-bold">
                    No se encontraron transacciones en esta vista.
                  </td>
                </tr>
              ) : (
                filteredSettlements.map((item) => (
                  <tr key={item.orderId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6 font-bold text-slate-800">
                      <span>Pedido #{item.orderId}</span>
                      <span className="block text-[11px] font-medium text-slate-400">{item.paymentMethod}</span>
                    </td>

                    <td className="py-4 px-6 text-slate-500 text-xs">
                      <span className="flex items-center gap-1 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(item.date).toLocaleDateString('es-AR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                    </td>

                    <td className="py-4 px-6">
                      <p className="font-bold text-slate-800 text-xs">{item.customerName}</p>
                      {item.customerEmail && (
                        <p className="text-[11px] text-slate-400 truncate max-w-[150px]">{item.customerEmail}</p>
                      )}
                    </td>

                    <td className="py-4 px-6">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider ${
                        item.isPaid
                          ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                          : item.status === 'PENDIENTE'
                          ? 'bg-amber-100 text-amber-700 border border-amber-200'
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        {item.status}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-right font-bold text-slate-800">
                      ${item.grossAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </td>

                    <td className="py-4 px-6 text-right font-bold text-rose-500">
                      -{item.isPaid ? `$${item.feeAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}` : '$0.00'}
                      <span className="block text-[10px] text-slate-400 font-medium">
                        {(activePlan.rate * 100).toFixed(1)}%
                      </span>
                    </td>

                    <td className="py-4 px-6 text-right font-black text-emerald-700">
                      {item.isPaid ? `$${item.netAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}` : '-'}
                    </td>

                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={() => setSelectedSettlement(item)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-3 py-1.5 rounded-xl transition-colors"
                      >
                        Ver Desglose
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Settlement Detail Modal */}
      {selectedSettlement && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl relative">
            <h3 className="text-xl font-black text-slate-800 mb-2">
              Liquidación Pedido #{selectedSettlement.orderId}
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Cobro registrado el {new Date(selectedSettlement.date).toLocaleString('es-AR')}
            </p>

            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-6 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Monto Cobrado (Bruto):</span>
                <span className="font-bold text-slate-800">
                  ${selectedSettlement.grossAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex justify-between items-center text-rose-600">
                <span>Comisión Mercado Pago (~{(activePlan.rate * 100).toFixed(2)}%):</span>
                <span className="font-bold">
                  -${selectedSettlement.feeAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-base font-black">
                <span className="text-emerald-800">Monto Neto en tu Cuenta:</span>
                <span className="text-emerald-700">
                  ${selectedSettlement.netAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div className="text-xs text-slate-500 space-y-1 mb-6">
              <p>• <strong>Cliente:</strong> {selectedSettlement.customerName} ({selectedSettlement.customerEmail || 'Sin email'})</p>
              <p>• <strong>Estado:</strong> {selectedSettlement.status}</p>
              <p>• <strong>Tarifa Aplicada:</strong> {activePlan.label}</p>
            </div>

            <button
              onClick={() => setSelectedSettlement(null)}
              className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

import { useState } from 'react';
import type { Order } from '../services/api';
import { Printer, X, FileText, Receipt, Clock, MapPin, Calendar, Banknote, ShieldCheck } from 'lucide-react';

interface OrderPrintModalProps {
  order?: Order | null;
  orders?: Order[];
  onClose: () => void;
}

export const OrderPrintModal = ({ order, orders, onClose }: OrderPrintModalProps) => {
  const [printFormat, setPrintFormat] = useState<'a4' | 'ticket'>('a4');

  // Si se pasa un array de órdenes o una única orden
  const ordersToPrint: Order[] = orders && orders.length > 0 
    ? orders 
    : order ? [order] : [];

  if (ordersToPrint.length === 0) return null;

  const handlePrint = () => {
    window.print();
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PAGADO': return 'PAGADO (Mercado Pago / Online)';
      case 'PAGO_EN_EFECTIVO': return 'COBRO EN EFECTIVO AL ENTREGAR';
      case 'PENDIENTE_MODO': return 'PENDIENTE MODO / TRANSFERENCIA';
      case 'EN_PREPARACION': return 'EN PREPARACIÓN';
      case 'EN_CAMINO': return 'EN CAMINO';
      case 'ENTREGADO': return 'ENTREGADO';
      case 'CANCELADO': return 'CANCELADO';
      default: return status;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/75 backdrop-blur-sm animate-in fade-in">
      <div 
        className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden print:max-w-none print:w-full print:max-h-none print:shadow-none print:rounded-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* BARRA SUPERIOR DE CONTROL (OCULTA AL IMPRIMIR) */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 no-print">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500 rounded-xl text-white">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base">
                {ordersToPrint.length === 1 
                  ? `Imprimir Pedido #${ordersToPrint[0].id}` 
                  : `Imprimir ${ordersToPrint.length} Pedidos en Lote`}
              </h3>
              <p className="text-xs text-slate-400">
                Selecciona el formato y genera la orden de preparación o remito
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Selector de Formato: Hoja A4 vs Ticket Térmico */}
            <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700">
              <button
                type="button"
                onClick={() => setPrintFormat('a4')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  printFormat === 'a4' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Hoja A4 / Remito</span>
              </button>
              <button
                type="button"
                onClick={() => setPrintFormat('ticket')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  printFormat === 'ticket' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Ticket (80mm)</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handlePrint}
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ÁREA IMPRIMIBLE */}
        <div className="overflow-y-auto p-6 sm:p-8 space-y-8 bg-slate-50 print:bg-white print:p-0 print:space-y-0 print:overflow-visible printable-area">
          {ordersToPrint.map((ord, orderIndex) => {
            const isCash = ord.status === 'PAGO_EN_EFECTIVO';
            const isPaid = ord.status === 'PAGADO';
            const isModo = ord.status === 'PENDIENTE_MODO';

            if (printFormat === 'ticket') {
              // =================== FORMATO TICKET TÉRMICO (80mm) ===================
              return (
                <div
                  key={ord.id}
                  className="max-w-[320px] mx-auto bg-white p-4 font-mono text-[11px] leading-tight border border-slate-300 shadow-sm print:border-none print:shadow-none print:max-w-full"
                  style={{ pageBreakAfter: orderIndex < ordersToPrint.length - 1 ? 'always' : 'auto' }}
                >
                  <div className="text-center pb-2 border-b border-dashed border-slate-400 mb-2">
                    <h2 className="font-black text-sm tracking-widest uppercase">🌿 VIBRANFRUT 🌿</h2>
                    <p className="text-[10px]">Frutas & Verduras de Campo</p>
                    <p className="text-[9px] text-slate-500">Comprobante de Entrega</p>
                    <p className="font-bold mt-1 text-xs">PEDIDO #{ord.id}</p>
                    <p className="text-[9px]">{new Date(ord.createdAt).toLocaleString('es-AR')}</p>
                  </div>

                  <div className="mb-2 pb-2 border-b border-dashed border-slate-400 space-y-1">
                    <p><span className="font-bold">CLIENTE:</span> {ord.user?.name || 'Cliente'}</p>
                    <p><span className="font-bold">EMAIL:</span> {ord.user?.email || '-'}</p>
                    {ord.deliveryAddress && (
                      <p><span className="font-bold">DIRECCIÓN:</span> {ord.deliveryAddress}</p>
                    )}
                    <p><span className="font-bold">ZONA:</span> {ord.shippingZone?.name || 'Retiro en Local'}</p>
                    {ord.deliveryTimeRange && (
                      <p><span className="font-bold">HORARIO:</span> {ord.deliveryTimeRange}</p>
                    )}
                  </div>

                  {/* Estado de Pago */}
                  <div className={`p-1.5 mb-2 text-center font-bold text-[10px] rounded ${
                    isCash ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                    isPaid ? 'bg-emerald-100 text-emerald-900' : 'bg-slate-100 text-slate-800'
                  }`}>
                    {isCash ? `⚠️ COBRAR: $${Number(ord.total).toFixed(2)} EN EFECTIVO` :
                     isPaid ? '✅ YA PAGADO (NO COBRAR)' : getStatusText(ord.status)}
                  </div>

                  {/* Lista de Ítems */}
                  <div className="mb-2 pb-2 border-b border-dashed border-slate-400">
                    <p className="font-bold mb-1 border-b border-slate-200 pb-0.5">DETALLE DE PRODUCTOS:</p>
                    {ord.items && ord.items.map((it: any, i: number) => (
                      <div key={i} className="flex justify-between py-0.5">
                        <span className="truncate pr-1">
                          {Number(it.quantity)} {it.product?.unit || 'u'} x {it.product?.name}
                        </span>
                        <span className="font-bold shrink-0">
                          ${(Number(it.price) * Number(it.quantity)).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Totales */}
                  <div className="space-y-0.5 pb-2 mb-2 border-b border-dashed border-slate-400">
                    {ord.shippingZone && Number(ord.shippingZone.price) > 0 && (
                      <div className="flex justify-between text-[10px]">
                        <span>Envío ({ord.shippingZone.name}):</span>
                        <span>${Number(ord.shippingZone.price).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-xs font-black pt-1">
                      <span>TOTAL A PAGAR:</span>
                      <span>${Number(ord.total).toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Firma */}
                  <div className="text-center pt-3 pb-1 text-[9px] text-slate-600">
                    <div className="w-40 border-b border-slate-400 mx-auto mb-1"></div>
                    <p>Firma y Aclaración de Recibido</p>
                    <p className="mt-3">¡Gracias por tu compra en Vibranfrut!</p>
                  </div>
                </div>
              );
            }

            // =================== FORMATO HOJA A4 / REMITO COMERCIAL ===================
            return (
              <div
                key={ord.id}
                className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-sm print:border-none print:shadow-none print:p-6 print:rounded-none"
                style={{ pageBreakAfter: orderIndex < ordersToPrint.length - 1 ? 'always' : 'auto' }}
              >
                {/* ENCABEZADO COMERCIAL */}
                <div className="flex flex-col sm:flex-row justify-between items-start pb-6 border-b-2 border-slate-800 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-2xl shadow-md">
                      🌿
                    </div>
                    <div>
                      <h1 className="text-2xl font-black text-slate-900 tracking-tight">VIBRANFRUT</h1>
                      <p className="text-xs font-bold text-emerald-700 uppercase tracking-widest">
                        Frutas y Verduras Seleccionadas
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Tienda Online · Envíos en el Día
                      </p>
                    </div>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="inline-block bg-slate-900 text-white font-black text-xs px-3 py-1 rounded-lg uppercase tracking-wider mb-1">
                      REMITO DE ENTREGA
                    </span>
                    <h2 className="text-xl font-black text-slate-900">
                      ORDEN #{ord.id}
                    </h2>
                    <p className="text-xs text-slate-500">
                      Fecha de Emisión: {new Date(ord.createdAt).toLocaleDateString('es-AR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>

                {/* DATOS DEL CLIENTE Y DEL ENVÍO */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
                  {/* Caja Cliente */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Datos del Cliente
                    </p>
                    <p className="font-black text-slate-800 text-sm mb-1">{ord.user?.name || 'Cliente'}</p>
                    <p className="text-xs text-slate-600">Email: {ord.user?.email || '-'}</p>
                    {ord.user?.phone && (
                      <p className="text-xs text-slate-600">Teléfono: {ord.user.phone}</p>
                    )}
                  </div>

                  {/* Caja Envío */}
                  <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100">
                    <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-2">
                      Información de Entrega
                    </p>
                    <p className="text-xs text-slate-700 font-bold flex items-start gap-1 mb-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{ord.deliveryAddress || 'Retiro en Local'}</span>
                    </p>
                    <p className="text-xs text-slate-600">
                      Zona: <span className="font-bold">{ord.shippingZone?.name || 'Local'}</span>
                    </p>
                    <div className="flex items-center gap-3 mt-1.5 pt-1.5 border-t border-emerald-100 text-xs text-slate-600">
                      <span className="flex items-center gap-1 font-semibold">
                        <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                        {ord.deliveryDate ? new Date(ord.deliveryDate).toLocaleDateString() : 'Cosecha del día'}
                      </span>
                      {ord.deliveryTimeRange && (
                        <span className="flex items-center gap-1 font-semibold">
                          <Clock className="w-3.5 h-3.5 text-emerald-600" />
                          {ord.deliveryTimeRange}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* ESTADO DE PAGO DESTACADO */}
                <div className={`p-4 rounded-2xl mb-6 flex items-center justify-between border ${
                  isCash 
                    ? 'bg-amber-50 border-amber-200 text-amber-900' 
                    : isPaid 
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                      : 'bg-slate-100 border-slate-200 text-slate-800'
                }`}>
                  <div className="flex items-center gap-2.5">
                    {isCash ? (
                      <Banknote className="w-6 h-6 text-amber-600" />
                    ) : isPaid ? (
                      <ShieldCheck className="w-6 h-6 text-emerald-600" />
                    ) : (
                      <Clock className="w-6 h-6 text-slate-500" />
                    )}
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider opacity-75">
                        Condición de Cobro
                      </p>
                      <p className="text-sm font-black">
                        {isCash ? '💵 PAGO EN EFECTIVO CONTRA ENTREGA' :
                         isPaid ? '✅ PAGO APROBADO (MERCADO PAGO / TARJETA)' :
                         isModo ? '📱 PENDIENTE DE TRANSFERENCIA / MODO' : getStatusText(ord.status)}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase opacity-75">Monto a Percibir</p>
                    <p className="text-xl font-black">
                      {isCash ? `$${Number(ord.total).toFixed(2)}` : '$0.00 (Ya abonado)'}
                    </p>
                  </div>
                </div>

                {/* TABLA DE PRODUCTOS */}
                <div className="overflow-hidden border border-slate-200 rounded-2xl mb-6">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-black">
                        <th className="py-3 px-4">#</th>
                        <th className="py-3 px-4">Producto / Variedad</th>
                        <th className="py-3 px-4 text-center">Cantidad</th>
                        <th className="py-3 px-4 text-right">Precio Unit.</th>
                        <th className="py-3 px-4 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {ord.items && ord.items.map((it: any, idx: number) => {
                        const qty = Number(it.quantity);
                        const unitPrice = Number(it.price);
                        const itemSubtotal = qty * unitPrice;
                        return (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="py-3 px-4 font-bold text-slate-400">{idx + 1}</td>
                            <td className="py-3 px-4">
                              <span className="font-bold text-slate-800 text-sm">{it.product?.name || 'Producto'}</span>
                              {it.product?.category?.name && (
                                <span className="block text-[10px] text-slate-400">🌿 {it.product.category.name}</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-center font-bold text-slate-700">
                              {qty === 0.5 ? '1/2' : qty} {it.product?.unit || 'u'}
                            </td>
                            <td className="py-3 px-4 text-right text-slate-600 font-medium">
                              ${unitPrice.toFixed(2)}
                            </td>
                            <td className="py-3 px-4 text-right font-black text-slate-800">
                              ${itemSubtotal.toFixed(2)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* TOTALES */}
                <div className="flex justify-end mb-8">
                  <div className="w-full sm:w-72 space-y-2 text-xs">
                    <div className="flex justify-between text-slate-500">
                      <span>Subtotal Productos:</span>
                      <span className="font-bold">
                        ${(Number(ord.total) - (ord.shippingZone ? Number(ord.shippingZone.price) : 0)).toFixed(2)}
                      </span>
                    </div>

                    {ord.shippingZone && Number(ord.shippingZone.price) > 0 && (
                      <div className="flex justify-between text-slate-500">
                        <span>Costo de Envío ({ord.shippingZone.name}):</span>
                        <span className="font-bold">${Number(ord.shippingZone.price).toFixed(2)}</span>
                      </div>
                    )}

                    <div className="flex justify-between pt-2 border-t-2 border-slate-800 text-base font-black text-slate-900">
                      <span>TOTAL GENERAL:</span>
                      <span className="text-emerald-700">${Number(ord.total).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* PIE DE FIRMA Y CONFORMIDAD */}
                <div className="pt-8 border-t border-slate-200 grid grid-cols-2 gap-8 text-xs text-slate-500">
                  <div>
                    <div className="w-48 border-b border-slate-400 mb-1"></div>
                    <p className="font-bold text-slate-700">Firma del Repartidor / Armador</p>
                    <p className="text-[10px] text-slate-400">Vibranfrut Logística</p>
                  </div>
                  <div className="text-right">
                    <div className="w-48 border-b border-slate-400 ml-auto mb-1"></div>
                    <p className="font-bold text-slate-700">Firma y Aclaración del Cliente</p>
                    <p className="text-[10px] text-slate-400">Conformidad de mercadería recibida</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

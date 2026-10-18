import { useEffect, useState, useMemo } from 'react';
import { getOrders, updateOrderStatus, notifyRouteDispatched, notifyOrderDispatched, getOrderPdfUrl } from '../services/api';
import type { Order } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { DeliveryRouteMap } from '../components/DeliveryRouteMap';
import {
  DEFAULT_DEPOT,
  geocodeAddress,
  optimizeDeliveryRoute,
  calculateRouteMetrics,
  buildGoogleMapsRouteUrl
} from '../utils/geocoding';
import type { RouteStop, Coordinates } from '../utils/geocoding';
import {
  Truck,
  RotateCw,
  Sparkles,
  MapPin,
  Calendar,
  Clock,
  Printer,
  Navigation,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  MessageCircle,
  ExternalLink,
  Layers,
  Check,
  AlertCircle,
  Send,
  FileText,
  Mail,
  Loader2
} from 'lucide-react';

export const AdminDeliveryRoutes = () => {
  const { token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [geocodingProgress, setGeocodingProgress] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [selectedDate, setSelectedDate] = useState<string>('ALL');
  const [selectedZone, setSelectedZone] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'PENDING' | 'DELIVERED' | 'ALL'>('PENDING');

  // Depósito / Origen
  const [depot] = useState<{ name: string; address: string; coordinates: Coordinates }>(() => {
    const saved = localStorage.getItem('vibranfrut_depot_info');
    return saved ? JSON.parse(saved) : DEFAULT_DEPOT;
  });

  // Paradas de la ruta geocodificadas y ordenadas
  const [routeStops, setRouteStops] = useState<RouteStop[]>([]);
  const [selectedStopId, setSelectedStopId] = useState<number | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Cargar órdenes al inicio
  useEffect(() => {
    fetchOrders();
  }, [token]);

  const fetchOrders = async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);
      const data = await getOrders(token);
      setOrders(data);
    } catch (err: any) {
      console.error('Error al obtener órdenes:', err);
      setError(err.message || 'Error al obtener órdenes para la ruta');
    } finally {
      setLoading(false);
    }
  };

  // Extraer fechas únicas disponibles para el selector
  const availableDates = useMemo(() => {
    const dates = new Set<string>();
    orders.forEach(o => {
      if (o.deliveryDate) {
        dates.add(new Date(o.deliveryDate).toISOString().split('T')[0]);
      } else if (o.createdAt) {
        dates.add(new Date(o.createdAt).toISOString().split('T')[0]);
      }
    });
    return Array.from(dates).sort().reverse();
  }, [orders]);

  // Extraer zonas únicas disponibles
  const availableZones = useMemo(() => {
    const zones = new Map<number, string>();
    orders.forEach(o => {
      if (o.shippingZone) {
        zones.set(o.shippingZone.id, o.shippingZone.name);
      }
    });
    return Array.from(zones.entries());
  }, [orders]);

  // Filtrar órdenes que tienen dirección de envío
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // Excluir retiros en local o pedidos sin dirección
      if (!order.deliveryAddress || order.deliveryAddress.toLowerCase().includes('retiro en local')) {
        return false;
      }

      // Filtro de estado
      if (statusFilter === 'PENDING') {
        if (order.status === 'ENTREGADO' || order.status === 'CANCELADO') return false;
      } else if (statusFilter === 'DELIVERED') {
        if (order.status !== 'ENTREGADO') return false;
      }

      // Filtro de fecha
      if (selectedDate !== 'ALL') {
        const orderDate = order.deliveryDate 
          ? new Date(order.deliveryDate).toISOString().split('T')[0]
          : new Date(order.createdAt).toISOString().split('T')[0];
        if (orderDate !== selectedDate) return false;
      }

      // Filtro de zona
      if (selectedZone !== 'ALL') {
        if (order.shippingZoneId !== Number(selectedZone)) return false;
      }

      return true;
    });
  }, [orders, statusFilter, selectedDate, selectedZone]);

  // Geocodificar las órdenes filtradas y construir las paradas
  useEffect(() => {
    let isCancelled = false;

    const processOrdersToStops = async () => {
      if (filteredOrders.length === 0) {
        setRouteStops([]);
        return;
      }

      setGeocodingProgress(true);

      const resolvedStops: RouteStop[] = [];

      for (const order of filteredOrders) {
        const addr = order.deliveryAddress || '';
        const zone = order.shippingZone?.name || '';
        const { coords, isApproximate } = await geocodeAddress(addr, zone);

        if (isCancelled) return;

        resolvedStops.push({
          id: order.id,
          orderId: order.id,
          customerName: order.user?.name || 'Cliente',
          customerEmail: order.user?.email || '',
          address: addr,
          zoneName: zone || 'Envío estándar',
          timeRange: order.deliveryTimeRange || 'Horario Flexible',
          deliveryDate: order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : undefined,
          total: Number(order.total),
          status: order.status,
          paymentMethod: order.status === 'PAGO_EN_EFECTIVO' ? 'Efectivo contra entrega' : 'Pagado Online',
          coordinates: coords,
          isApproximate,
          notes: order.items?.map((it: any) => `${it.quantity}x ${it.product?.name || 'Producto'}`).join(', ')
        });
      }

      if (!isCancelled) {
        setRouteStops(resolvedStops);
        setGeocodingProgress(false);
      }
    };

    processOrdersToStops();

    return () => {
      isCancelled = true;
    };
  }, [filteredOrders]);

  // Optimizar ruta con Algoritmo TSP Nearest Neighbor
  const handleOptimizeRoute = () => {
    if (routeStops.length <= 1) return;
    const optimized = optimizeDeliveryRoute(depot.coordinates, routeStops);
    setRouteStops(optimized);
  };

  // Mover parada hacia arriba
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    setRouteStops(prev => {
      const copy = [...prev];
      const temp = copy[index - 1];
      copy[index - 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  };

  // Mover parada hacia abajo
  const handleMoveDown = (index: number) => {
    if (index >= routeStops.length - 1) return;
    setRouteStops(prev => {
      const copy = [...prev];
      const temp = copy[index + 1];
      copy[index + 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  };

  // Cambiar estado a ENTREGADO
  const handleMarkDelivered = async (orderId: number) => {
    if (!token) return;
    try {
      await updateOrderStatus(orderId, 'ENTREGADO', token);
      // Actualizar localmente
      setRouteStops(prev => prev.map(s => s.orderId === orderId ? { ...s, status: 'ENTREGADO' } : s));
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'ENTREGADO' } : o));
    } catch (err) {
      console.error('Error al actualizar a entregado:', err);
      alert('No se pudo actualizar el estado de la orden');
    }
  };

  // Estados de despacho y notificación por correo
  const [isDispatchingRoute, setIsDispatchingRoute] = useState(false);
  const [notifyingStopId, setNotifyingStopId] = useState<number | null>(null);
  const [dispatchMessage, setDispatchMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Despachar ruta completa y avisar a todos los clientes por email
  const handleDispatchEntireRoute = async () => {
    if (!token) return;
    const pendingStops = routeStops.filter(s => s.status !== 'ENTREGADO' && s.status !== 'CANCELADO');
    if (pendingStops.length === 0) {
      alert('No hay pedidos pendientes en esta ruta para despachar.');
      return;
    }

    const confirmMsg = `¿Deseas despachar esta ruta y enviar un correo electrónico a los ${pendingStops.length} clientes avisando que su pedido está en camino?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      setIsDispatchingRoute(true);
      setDispatchMessage(null);
      const orderIds = pendingStops.map(s => s.orderId);
      const res = await notifyRouteDispatched(orderIds, token);
      
      // Actualizar estado local a EN_CAMINO
      setRouteStops(prev => prev.map(s => orderIds.includes(s.orderId) ? { ...s, status: 'EN_CAMINO' } : s));
      setOrders(prev => prev.map(o => orderIds.includes(o.id) ? { ...o, status: 'EN_CAMINO' } : o));

      setDispatchMessage({
        type: 'success',
        text: res.message || `¡Ruta despachada! Se enviaron avisos de salida por email a ${res.sentCount} clientes.`
      });
      setTimeout(() => setDispatchMessage(null), 8000);
    } catch (err: any) {
      setDispatchMessage({
        type: 'error',
        text: err.message || 'Error al enviar avisos de ruta por email'
      });
    } finally {
      setIsDispatchingRoute(false);
    }
  };

  // Enviar aviso individual por email a un cliente
  const handleNotifySingleStop = async (orderId: number) => {
    if (!token) return;
    try {
      setNotifyingStopId(orderId);
      const res = await notifyOrderDispatched(orderId, token);
      setRouteStops(prev => prev.map(s => s.orderId === orderId ? { ...s, status: 'EN_CAMINO' } : s));
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'EN_CAMINO' } : o));
      alert(res.message || `Aviso de pedido en camino enviado al cliente del Pedido #${orderId}`);
    } catch (err: any) {
      alert('Error al enviar correo: ' + err.message);
    } finally {
      setNotifyingStopId(null);
    }
  };

  // Métricas de la ruta
  const metrics = useMemo(() => {
    return calculateRouteMetrics(depot.coordinates, routeStops);
  }, [depot.coordinates, routeStops]);

  // Total a cobrar en efectivo
  const cashToCollect = useMemo(() => {
    return routeStops
      .filter(s => s.status === 'PAGO_EN_EFECTIVO')
      .reduce((sum, s) => sum + s.total, 0);
  }, [routeStops]);

  // Enlace para Google Maps de la ruta completa
  const googleMapsRouteUrl = useMemo(() => {
    return buildGoogleMapsRouteUrl(depot.address, routeStops);
  }, [depot.address, routeStops]);

  return (
    <div className="space-y-6">
      {/* Título y Acciones Principales */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <Truck className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black text-slate-800">
              Rutas y Hoja de Entrega
            </h1>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Planificador inteligente de repartos según direcciones de clientes y geolocalización
          </p>
        </div>

        {error && (
          <div className="w-full mt-2 p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={fetchOrders}
            className="p-2.5 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            title="Recargar pedidos"
          >
            <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
            <span className="hidden md:inline">Actualizar</span>
          </button>

          <button
            type="button"
            onClick={handleDispatchEntireRoute}
            disabled={isDispatchingRoute || routeStops.length === 0}
            className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-2 transition-all shadow-md shadow-emerald-600/20 cursor-pointer disabled:opacity-50 hover:scale-[1.02]"
            title="Avisar por email a todos los clientes que su pedido está en camino y marcar la ruta como despachada"
          >
            {isDispatchingRoute ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <Send className="w-4 h-4 text-white" />
            )}
            <span>🚚 Despachar y Avisar por Email</span>
          </button>

          <button
            type="button"
            onClick={handleOptimizeRoute}
            disabled={routeStops.length <= 1}
            className="px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-amber-950 text-xs font-black flex items-center gap-2 transition-all shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02]"
            title="Ordenar paradas por menor distancia desde el depósito"
          >
            <Sparkles className="w-4 h-4 text-amber-950" />
            <span>⚡ Optimizar Recorrido</span>
          </button>

          {googleMapsRouteUrl && (
            <a
              href={googleMapsRouteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black flex items-center gap-2 transition-all shadow-xs cursor-pointer hover:scale-[1.02]"
            >
              <Navigation className="w-4 h-4" />
              <span>Abrir en Google Maps</span>
            </a>
          )}

          <button
            type="button"
            onClick={() => setIsPrintModalOpen(true)}
            disabled={routeStops.length === 0}
            className="px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black flex items-center gap-2 transition-all shadow-xs cursor-pointer disabled:opacity-50"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Hoja de Ruta</span>
          </button>
        </div>
      </div>

      {/* Banner de resultado de despacho de ruta */}
      {dispatchMessage && (
        <div className={`p-4 rounded-2xl flex items-center gap-3 animate-in fade-in shadow-xs ${
          dispatchMessage.type === 'success'
            ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
            : 'bg-rose-50 border border-rose-200 text-rose-800'
        }`}>
          {dispatchMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span className="font-bold text-xs">{dispatchMessage.text}</span>
        </div>
      )}

      {/* Métricas y Resumen de la Ruta */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-2xs">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Paradas en Ruta
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{routeStops.length}</span>
            <span className="text-xs text-slate-500 font-bold">pedidos</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-2xs">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Recaudación Efectivo
          </p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-emerald-700">${cashToCollect.toFixed(2)}</span>
            <span className="text-[11px] text-amber-600 font-black">contra entrega</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-2xs">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Distancia Estimada
          </p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-blue-700">{metrics.totalDistanceKm}</span>
            <span className="text-xs text-slate-500 font-bold">km de recorrido</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-2xs">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Tiempo Estimado
          </p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-purple-700">
              {Math.floor(metrics.estimatedMinutes / 60)}h {metrics.estimatedMinutes % 60}m
            </span>
            <span className="text-[11px] text-slate-400 font-medium">con descargas</span>
          </div>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Filtro Fecha */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-2xl border border-slate-200">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent font-bold text-slate-700 outline-none cursor-pointer"
            >
              <option value="ALL">Todas las fechas</option>
              {availableDates.map(d => (
                <option key={d} value={d}>
                  📅 {d}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro Zona */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-2xl border border-slate-200">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              className="bg-transparent font-bold text-slate-700 outline-none cursor-pointer"
            >
              <option value="ALL">Todas las zonas</option>
              {availableZones.map(([id, name]) => (
                <option key={id} value={id}>
                  📍 {name}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro Estado */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => setStatusFilter('PENDING')}
              className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer ${
                statusFilter === 'PENDING' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Pendientes
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('DELIVERED')}
              className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer ${
                statusFilter === 'DELIVERED' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Entregados
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer ${
                statusFilter === 'ALL' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Todos
            </button>
          </div>
        </div>

        {/* Punto de salida / depósito actual */}
        <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
          <span>Punto de partida:</span>
          <span className="font-bold text-slate-800">🏪 {depot.name}</span>
        </div>
      </div>

      {/* MAPA INTERACTIVO DE LA RUTA */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-2">
          <h3 className="font-black text-slate-800 text-sm flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-600" />
            <span>Mapa del Circuito de Reparto</span>
          </h3>
          {geocodingProgress && (
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full animate-pulse border border-emerald-200">
              📍 Ubicando direcciones en el mapa...
            </span>
          )}
        </div>

        <DeliveryRouteMap
          depotCoords={depot.coordinates}
          depotName={depot.name}
          stops={routeStops}
          selectedStopId={selectedStopId}
          onSelectStop={(stop) => setSelectedStopId(stop.id)}
          onMarkDelivered={handleMarkDelivered}
        />
      </div>

      {/* LISTADO SECUENCIAL DE PARADAS */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-black text-slate-900 text-base">
              Secuencia de Entregas ({routeStops.length} paradas)
            </h3>
            <p className="text-xs text-slate-400">
              Usa las flechas para reordenar las paradas o haz click en "Optimizar Recorrido"
            </p>
          </div>

          <span className="text-xs text-slate-400 font-semibold hidden sm:inline">
            💡 Consejo: Haz click en GPS para navegar con Google Maps
          </span>
        </div>

        {routeStops.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Truck className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="font-bold text-sm">No hay pedidos con entrega a domicilio para los filtros seleccionados.</p>
            <p className="text-xs mt-1">Prueba cambiando la fecha o el estado en los filtros superiores.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {routeStops.map((stop, index) => {
              const stopNumber = index + 1;
              const isDelivered = stop.status === 'ENTREGADO';
              const isSelected = selectedStopId === stop.id;

              return (
                <div
                  key={stop.id}
                  onClick={() => setSelectedStopId(stop.id)}
                  className={`p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all cursor-pointer ${
                    isSelected ? 'bg-emerald-50/50' : 'hover:bg-slate-50'
                  } ${isDelivered ? 'opacity-70 bg-slate-50/50' : ''}`}
                >
                  {/* Número de parada y Datos Principales */}
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <div className={`w-8 h-8 rounded-2xl flex items-center justify-center font-black text-xs text-white shadow-xs ${
                        isDelivered ? 'bg-emerald-600' : 'bg-slate-900'
                      }`}>
                        {isDelivered ? '✓' : stopNumber}
                      </div>

                      {/* Botones para reordenar */}
                      <div className="flex flex-col gap-0.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveUp(index);
                          }}
                          disabled={index === 0}
                          className="p-1 hover:bg-slate-200 rounded text-slate-500 disabled:opacity-20 cursor-pointer"
                          title="Subir en el orden"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveDown(index);
                          }}
                          disabled={index === routeStops.length - 1}
                          className="p-1 hover:bg-slate-200 rounded text-slate-500 disabled:opacity-20 cursor-pointer"
                          title="Bajar en el orden"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-black text-slate-900 text-sm">
                          {stop.customerName}
                        </span>
                        <span className="text-xs font-bold text-slate-400">
                          Pedido #{stop.orderId}
                        </span>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          📍 {stop.zoneName}
                        </span>
                        {stop.isApproximate && (
                          <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-amber-100 text-amber-800">
                            Ubicación aprox.
                          </span>
                        )}
                      </div>

                      <p className="text-xs font-bold text-slate-700 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{stop.address}</span>
                      </p>

                      {stop.notes && (
                        <p className="text-[11px] text-slate-400 line-clamp-1">
                          📦 {stop.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Horario, Monto y Acciones Rápidas */}
                  <div className="flex flex-wrap items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                    <div className="text-left md:text-right">
                      <div className="flex items-center md:justify-end gap-1 text-xs text-slate-500 font-bold mb-0.5">
                        <Clock className="w-3.5 h-3.5 text-purple-600" />
                        <span>{stop.timeRange}</span>
                      </div>
                      <div className="flex items-center md:justify-end gap-1.5">
                        <span className="text-sm font-black text-slate-900">${stop.total.toFixed(2)}</span>
                        {stop.status === 'EN_CAMINO' && (
                          <span className="bg-purple-100 text-purple-800 text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1">
                            🚚 En Camino
                          </span>
                        )}
                        {stop.status === 'PAGO_EN_EFECTIVO' ? (
                          <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded-md">
                            💵 Cobrar Efectivo
                          </span>
                        ) : (
                          <span className="bg-emerald-50 text-emerald-700 text-[10px] font-black px-2 py-0.5 rounded-md">
                            ✅ Ya abonado
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center gap-1.5">
                      {/* Email aviso de salida */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNotifySingleStop(stop.orderId);
                        }}
                        disabled={notifyingStopId === stop.orderId}
                        className="p-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                        title="Enviar correo avisando al cliente que su pedido ya está en camino a su domicilio"
                      >
                        {notifyingStopId === stop.orderId ? (
                          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                        ) : (
                          <Mail className="w-4 h-4 text-blue-600" />
                        )}
                        <span className="hidden sm:inline">Avisar Salida</span>
                      </button>

                      {/* PDF Oficial del pedido */}
                      <a
                        href={getOrderPdfUrl(stop.orderId)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 transition-all"
                        title="Ver o imprimir comprobante oficial en PDF"
                      >
                        <FileText className="w-4 h-4 text-slate-600" />
                        <span className="hidden sm:inline">PDF</span>
                      </a>

                      {/* WhatsApp al cliente */}
                      <a
                        href={`https://wa.me/?text=${encodeURIComponent(
                          `¡Hola ${stop.customerName}! Te avisamos desde Vibranfrut que tu pedido #${stop.orderId} ya está en camino a tu domicilio (${stop.address}). ¡Pronto llegará nuestro repartidor!`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center gap-1 transition-all"
                        title="Enviar mensaje por WhatsApp al cliente"
                      >
                        <MessageCircle className="w-4 h-4 text-emerald-600" />
                        <span className="hidden sm:inline">WhatsApp</span>
                      </a>

                      {/* GPS Google Maps individual */}
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${stop.address}, ${stop.zoneName}, Argentina`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-xs font-bold flex items-center gap-1 transition-all"
                        title="Navegar hasta esta parada con Google Maps"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span className="hidden sm:inline">GPS</span>
                      </a>

                      {/* Botón Entregado */}
                      {!isDelivered ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkDelivered(stop.orderId);
                          }}
                          className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-1.5 shadow-xs transition-all cursor-pointer hover:scale-105"
                          title="Marcar pedido como entregado"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Entregar</span>
                        </button>
                      ) : (
                        <span className="px-2.5 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-black flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Entregado</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL / VISTA DE HOJA DE RUTA IMPRIMIBLE */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Header modal */}
            <div className="p-4 sm:p-6 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-emerald-400" />
                <h3 className="font-black text-lg">Hoja de Ruta de Reparto para Impresión</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir Ahora</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPrintModalOpen(false)}
                  className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>

            {/* Contenido imprimible */}
            <div className="p-6 overflow-y-auto space-y-6 print:p-0 print:overflow-visible">
              <div className="border-b border-slate-200 pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900">VIBRANFRUT - HOJA DE RUTA</h2>
                    <p className="text-xs text-slate-500">
                      Fecha: {new Date().toLocaleDateString()} | Salida: {depot.name} ({depot.address})
                    </p>
                  </div>
                  <div className="text-right text-xs">
                    <p><span className="font-bold">Total Paradas:</span> {routeStops.length}</p>
                    <p><span className="font-bold">Total a Cobrar Efectivo:</span> ${cashToCollect.toFixed(2)}</p>
                    <p><span className="font-bold">Distancia Estimada:</span> {metrics.totalDistanceKm} km</p>
                  </div>
                </div>
              </div>

              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-900 text-slate-700 font-black">
                    <th className="py-2 px-1 text-center">#</th>
                    <th className="py-2 px-2">Pedido</th>
                    <th className="py-2 px-2">Cliente</th>
                    <th className="py-2 px-2">Dirección / Zona</th>
                    <th className="py-2 px-2">Horario</th>
                    <th className="py-2 px-2 text-right">Cobro ($)</th>
                    <th className="py-2 px-2 text-center">Firma / Recibido</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {routeStops.map((stop, i) => (
                    <tr key={stop.id} className="hover:bg-slate-50">
                      <td className="py-3 px-1 text-center font-black">{i + 1}</td>
                      <td className="py-3 px-2 font-bold">#{stop.orderId}</td>
                      <td className="py-3 px-2 font-medium">{stop.customerName}</td>
                      <td className="py-3 px-2">
                        <div className="font-bold text-slate-800">{stop.address}</div>
                        <div className="text-[10px] text-slate-400">{stop.zoneName}</div>
                      </td>
                      <td className="py-3 px-2 text-slate-600">{stop.timeRange}</td>
                      <td className="py-3 px-2 text-right font-black">
                        {stop.status === 'PAGO_EN_EFECTIVO' ? (
                          <span className="text-amber-800 font-black">${stop.total.toFixed(2)} (Efectivo)</span>
                        ) : (
                          <span className="text-slate-400">Ya Pagado</span>
                        )}
                      </td>
                      <td className="py-3 px-2 text-center">
                        <div className="w-20 h-6 border-b border-slate-300 mx-auto"></div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="pt-8 flex justify-between text-xs text-slate-500 border-t border-slate-200">
                <div>
                  <p>Firma del Repartidor: ___________________________</p>
                  <p className="mt-1">Aclaración: ___________________________</p>
                </div>
                <div>
                  <p>Vehículo / Patente: ___________________________</p>
                  <p className="mt-1">Hora de Salida: ________  Hora de Regreso: ________</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import { Router } from 'express';
import { 
  createOrderAndPreference, 
  receiveWebhook, 
  getOrders, 
  updateOrderStatus,
  cancelOrder,
  payCashOrder,
  payOrderWithMercadoPago,
  getOrderFinances,
  downloadOrderPdf,
  notifyOrderDispatched,
  notifyRouteDispatched
} from '../controllers/orderController';
import { authenticateToken, requireAdmin } from '../middlewares/auth';

const router = Router();

// Endpoint para crear orden y preferencia de pago (Protegido)
router.post('/checkout', authenticateToken, createOrderAndPreference);

// Endpoint para recibir notificaciones de Mercado Pago (Público)
router.post('/webhook', receiveWebhook);

// Endpoints de Órdenes y Finanzas
router.get('/finances', authenticateToken, requireAdmin, getOrderFinances);
router.get('/', authenticateToken, getOrders);
router.put('/:id/status', authenticateToken, requireAdmin, updateOrderStatus);

// Descargar comprobante oficial en PDF
router.get('/:id/pdf', authenticateToken, downloadOrderPdf);

// Notificación de salida / ruta por email
router.post('/notify-route', authenticateToken, requireAdmin, notifyRouteDispatched);
router.post('/:id/notify-dispatch', authenticateToken, requireAdmin, notifyOrderDispatched);

// Acciones del cliente sobre su pedido
router.put('/:id/cancel', authenticateToken, cancelOrder);
router.put('/:id/pay-cash', authenticateToken, payCashOrder);
router.post('/:id/pay-mp', authenticateToken, payOrderWithMercadoPago);

export default router;

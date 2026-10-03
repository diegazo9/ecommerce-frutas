import { Router } from 'express';
import { 
  createOrderAndPreference, 
  receiveWebhook, 
  getOrders, 
  updateOrderStatus,
  cancelOrder,
  payCashOrder,
  payOrderWithMercadoPago
} from '../controllers/orderController';
import { authenticateToken, requireAdmin } from '../middlewares/auth';

const router = Router();

// Endpoint para crear orden y preferencia de pago (Protegido)
router.post('/checkout', authenticateToken, createOrderAndPreference);

// Endpoint para recibir notificaciones de Mercado Pago (Público)
router.post('/webhook', receiveWebhook);

// Endpoint para ver historial de órdenes
router.get('/', authenticateToken, getOrders);
router.put('/:id/status', authenticateToken, requireAdmin, updateOrderStatus);

// Acciones del cliente sobre su pedido
router.put('/:id/cancel', authenticateToken, cancelOrder);
router.put('/:id/pay-cash', authenticateToken, payCashOrder);
router.post('/:id/pay-mp', authenticateToken, payOrderWithMercadoPago);

export default router;

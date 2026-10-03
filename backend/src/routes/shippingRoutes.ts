import { Router } from 'express';
import { getShippingZones, createShippingZone, updateShippingZone, deleteShippingZone } from '../controllers/shippingController';
import { authenticateToken, requireAdmin } from '../middlewares/auth';

const router = Router();

// Público
router.get('/', getShippingZones);

// Admin
router.post('/', authenticateToken, requireAdmin, createShippingZone);
router.put('/:id', authenticateToken, requireAdmin, updateShippingZone);
router.delete('/:id', authenticateToken, requireAdmin, deleteShippingZone);

export default router;

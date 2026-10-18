import { Router } from 'express';
import { getEmailConfig, updateEmailConfig, testEmailConnection } from '../controllers/settingsController';
import { authenticateToken, requireAdmin } from '../middlewares/auth';

const router = Router();

// Todas las rutas de configuración de correo requieren ser Administrador
router.get('/email', authenticateToken, requireAdmin, getEmailConfig);
router.put('/email', authenticateToken, requireAdmin, updateEmailConfig);
router.post('/email/test', authenticateToken, requireAdmin, testEmailConnection);

export default router;

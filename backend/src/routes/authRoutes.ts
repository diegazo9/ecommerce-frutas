import { Router } from 'express';
import { login, register, googleLogin, getUsers, updateUserRole, verifyEmail, resendVerificationEmail } from '../controllers/authController';
import { authenticateToken, requireAdmin } from '../middlewares/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleLogin);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerificationEmail);

// Rutas protegidas para Administradores
router.get('/users', authenticateToken, requireAdmin, getUsers);
router.put('/users/:id/role', authenticateToken, requireAdmin, updateUserRole);

export default router;

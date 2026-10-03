import { Router } from 'express';
import { getCategories, createCategory, updateCategory, deleteCategory, getProducts, createProduct, updateProduct, deleteProduct } from '../controllers/productController';
import { authenticateToken, requireAdmin } from '../middlewares/auth';

const router = Router();

// Públicas
router.get('/categories', getCategories);
router.get('/', getProducts);

// Protegidas (Solo Admin)
router.post('/categories', authenticateToken, requireAdmin, createCategory);
router.put('/categories/:id', authenticateToken, requireAdmin, updateCategory);
router.delete('/categories/:id', authenticateToken, requireAdmin, deleteCategory);

router.post('/', authenticateToken, requireAdmin, createProduct);
router.put('/:id', authenticateToken, requireAdmin, updateProduct);
router.delete('/:id', authenticateToken, requireAdmin, deleteProduct);

export default router;

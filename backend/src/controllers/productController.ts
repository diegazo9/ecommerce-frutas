import { Request, Response } from 'express';
import { prisma } from '../prisma';

export const getCategories = async (req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener categorías' });
  }
};

export const createCategory = async (req: Request, res: Response) => {
  try {
    const { name, description, imageUrl } = req.body;
    const category = await prisma.category.create({
      data: { name, description, imageUrl }
    });
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear categoría' });
  }
};

export const updateCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, imageUrl } = req.body;
    const category = await prisma.category.update({
      where: { id: Number(id) },
      data: { name, description, imageUrl }
    });
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar categoría' });
  }
};

export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.category.delete({
      where: { id: Number(id) }
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar categoría' });
  }
};

export const getProducts = async (req: Request, res: Response) => {
  try {
    const { all, includeOutOfStock } = req.query;
    const showAll = all === 'true' || includeOutOfStock === 'true';

    // Por defecto para la tienda web: sólo mostrar productos con stock mayor a cero
    const where = showAll ? {} : { stock: { gt: 0 } };

    const products = await prisma.product.findMany({
      where,
      include: { category: true }
    });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener productos' });
  }
};

const cleanNumber = (val: any): number | null => {
  if (val === undefined || val === null || val === '') return null;
  const num = typeof val === 'string' ? Number(val.replace(',', '.')) : Number(val);
  return isNaN(num) ? null : num;
};

export const createProduct = async (req: Request, res: Response) => {
  try {
    const { 
      name, 
      description, 
      price, 
      stock, 
      unit, 
      categoryId, 
      imageUrl,
      price2kg,
      discount2kg,
      price3kg,
      discount3kg
    } = req.body;
    
    const cleanPrice = cleanNumber(price) || 0;
    const cleanStock = cleanNumber(stock) || 0;

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price: cleanPrice,
        stock: cleanStock,
        unit: unit || 'kg',
        categoryId: Number(categoryId),
        imageUrl,
        price2kg: cleanNumber(price2kg),
        discount2kg: cleanNumber(discount2kg),
        price3kg: cleanNumber(price3kg),
        discount3kg: cleanNumber(discount3kg)
      },
      include: { category: true }
    });
    res.status(201).json(product);
  } catch (error) {
    console.error('Error al crear producto:', error);
    res.status(500).json({ error: 'Error al crear producto' });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { 
      name, 
      description, 
      price, 
      stock, 
      unit, 
      categoryId, 
      imageUrl,
      price2kg,
      discount2kg,
      price3kg,
      discount3kg
    } = req.body;
    
    const cleanPrice = price !== undefined ? cleanNumber(price) : undefined;
    const cleanStock = stock !== undefined ? cleanNumber(stock) : undefined;

    const product = await prisma.product.update({
      where: { id: Number(id) },
      data: {
        name,
        description,
        price: cleanPrice !== undefined && cleanPrice !== null ? cleanPrice : undefined,
        stock: cleanStock !== undefined && cleanStock !== null ? cleanStock : undefined,
        unit,
        categoryId: categoryId ? Number(categoryId) : undefined,
        imageUrl,
        price2kg: price2kg !== undefined ? cleanNumber(price2kg) : undefined,
        discount2kg: discount2kg !== undefined ? cleanNumber(discount2kg) : undefined,
        price3kg: price3kg !== undefined ? cleanNumber(price3kg) : undefined,
        discount3kg: discount3kg !== undefined ? cleanNumber(discount3kg) : undefined
      },
      include: { category: true }
    });
    res.json(product);
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    res.status(500).json({ error: 'Error al actualizar producto' });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.product.delete({
      where: { id: Number(id) }
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar producto' });
  }
};

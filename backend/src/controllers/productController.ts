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
    const products = await prisma.product.findMany({
      include: { category: true }
    });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener productos' });
  }
};

export const createProduct = async (req: Request, res: Response) => {
  try {
    const { name, description, price, stock, unit, categoryId, imageUrl } = req.body;
    const cleanPrice = typeof price === 'string' ? Number(price.replace(',', '.')) : Number(price);
    const cleanStock = typeof stock === 'string' ? Number(stock.replace(',', '.')) : Number(stock);

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price: isNaN(cleanPrice) ? 0 : cleanPrice,
        stock: isNaN(cleanStock) ? 0 : cleanStock,
        unit: unit || 'kg',
        categoryId: Number(categoryId),
        imageUrl
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
    const { name, description, price, stock, unit, categoryId, imageUrl } = req.body;
    
    const cleanPrice = price !== undefined ? (typeof price === 'string' ? Number(price.replace(',', '.')) : Number(price)) : undefined;
    const cleanStock = stock !== undefined ? (typeof stock === 'string' ? Number(stock.replace(',', '.')) : Number(stock)) : undefined;

    const product = await prisma.product.update({
      where: { id: Number(id) },
      data: {
        name,
        description,
        price: cleanPrice !== undefined && !isNaN(cleanPrice) ? cleanPrice : undefined,
        stock: cleanStock !== undefined && !isNaN(cleanStock) ? cleanStock : undefined,
        unit,
        categoryId: categoryId ? Number(categoryId) : undefined,
        imageUrl
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

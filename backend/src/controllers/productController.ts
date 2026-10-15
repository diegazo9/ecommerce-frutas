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

export const bulkImportProducts = async (req: Request, res: Response) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'La lista de productos está vacía o es inválida' });
    }

    // Pre-cargar categorías existentes
    const existingCategories = await prisma.category.findMany();
    const categoryMap = new Map<string, number>();
    existingCategories.forEach(c => categoryMap.set(c.name.trim().toLowerCase(), c.id));

    let createdCount = 0;
    let updatedCount = 0;
    const errors: { row: number; name?: string; error: string }[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const rowNum = i + 1;

      try {
        const name = (item.name || '').replace(/[;,]+$/, '').trim();
        if (!name) {
          errors.push({ row: rowNum, error: 'El nombre del producto es obligatorio' });
          continue;
        }

        const price = cleanNumber(item.price);
        if (price === null || price < 0) {
          errors.push({ row: rowNum, name, error: 'El precio debe ser un número válido mayor o igual a 0' });
          continue;
        }

        const stock = cleanNumber(item.stock) ?? 0;
        const unit = (item.unit || 'kg').replace(/[;,]+$/, '').trim();
        const description = item.description ? String(item.description).replace(/[;,]+$/, '').trim() : null;
        const imageUrl = item.imageUrl ? String(item.imageUrl).replace(/[;,]+$/, '').trim() : null;
        const price2kg = cleanNumber(item.price2kg);
        const discount2kg = cleanNumber(item.discount2kg);
        const price3kg = cleanNumber(item.price3kg);
        const discount3kg = cleanNumber(item.discount3kg);

        // Resolver categoría
        let categoryId: number | null = null;
        if (item.categoryId && !isNaN(Number(item.categoryId))) {
          categoryId = Number(item.categoryId);
        } else if (item.category || item.categoryName) {
          const catName = String(item.category || item.categoryName).trim();
          const lowerCatName = catName.toLowerCase();
          if (categoryMap.has(lowerCatName)) {
            categoryId = categoryMap.get(lowerCatName)!;
          } else if (catName) {
            // Auto crear categoría
            const newCat = await prisma.category.create({
              data: { name: catName }
            });
            categoryMap.set(lowerCatName, newCat.id);
            categoryId = newCat.id;
          }
        }

        if (!categoryId) {
          if (existingCategories.length > 0) {
            categoryId = existingCategories[0].id;
          } else {
            const generalCat = await prisma.category.create({ data: { name: 'General' } });
            categoryMap.set('general', generalCat.id);
            categoryId = generalCat.id;
          }
        }

        // Buscar si ya existe por ID o por nombre
        let existingProduct = null;
        if (item.id && !isNaN(Number(item.id))) {
          existingProduct = await prisma.product.findUnique({ where: { id: Number(item.id) } });
        }
        if (!existingProduct) {
          existingProduct = await prisma.product.findFirst({
            where: { name: { equals: name, mode: 'insensitive' } }
          });
        }

        if (existingProduct) {
          await prisma.product.update({
            where: { id: existingProduct.id },
            data: {
              name,
              description: description !== null ? description : existingProduct.description,
              price,
              stock,
              unit,
              categoryId,
              imageUrl: imageUrl || existingProduct.imageUrl,
              price2kg,
              discount2kg,
              price3kg,
              discount3kg
            }
          });
          updatedCount++;
        } else {
          await prisma.product.create({
            data: {
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
            }
          });
          createdCount++;
        }
      } catch (rowError: any) {
        errors.push({ row: rowNum, name: item.name, error: rowError.message || 'Error al procesar fila' });
      }
    }

    res.json({
      success: true,
      total: items.length,
      created: createdCount,
      updated: updatedCount,
      errors
    });
  } catch (error: any) {
    console.error('Error en bulkImportProducts:', error);
    res.status(500).json({ error: error.message || 'Error interno al importar productos masivamente' });
  }
};


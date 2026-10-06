import { PrismaClient } from '@prisma/client';

process.env.DATABASE_URL = 'postgresql://ecommerce:Faby1503%23@192.168.3.50:5432/ecommerce';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://ecommerce:Faby1503%23@192.168.3.50:5432/ecommerce'
    }
  }
});

async function main() {
  console.log('Connecting to PostgreSQL on Proxmox...');
  
  // 1. Check or Create "Combos y Bolsones" category
  let comboCategory = await prisma.category.findFirst({
    where: {
      name: {
        contains: 'Combo',
        mode: 'insensitive'
      }
    }
  });

  // Reset category sequence to max(id)
  await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('categories', 'id'), COALESCE(max(id), 1)) FROM categories;`);
  await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('products', 'id'), COALESCE(max(id), 1)) FROM products;`);

  if (!comboCategory) {
    console.log('Creating category "Combos y Bolsones"...');
    comboCategory = await prisma.category.create({
      data: {
        name: 'Combos y Bolsones',
        description: 'Packs y bolsones familiares seleccionados con el mejor mix y ahorro.',
        imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80'
      }
    });
    console.log('Category created:', comboCategory);
  } else {
    console.log('Found existing combo category:', comboCategory);
  }

  // 2. Combo products to insert if not present
  const combos = [
    {
      name: 'Bolsón Huerto Familiar (8 kg)',
      description: 'Mix rendidor de temporada: 2kg Manzanas, 2kg Naranjas de Jugo, 1kg Bananas, 1kg Papas, 1kg Zanahorias y 1 atado de Espinaca fresca.',
      price: 1000.00,
      stock: 50.00,
      unit: 'und',
      categoryId: comboCategory.id,
      imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80'
    },
    {
      name: 'Pack Cítricos & Zumos Detox (5 kg)',
      description: 'Pura vitamina C y frescura matutina: 2.5kg Naranjas de jugo extra dulces, 1.5kg Pomelos rosados y 1kg Limones amarillos.',
      price: 1000.00,
      stock: 40.00,
      unit: 'und',
      categoryId: comboCategory.id,
      imageUrl: 'https://images.unsplash.com/photo-1582979512210-99b6a53386f9?w=800&q=80'
    },
    {
      name: 'Combo Ensaladas de Huerta Fresca',
      description: 'Directo de la tierra a tu plato: 2 atados de Espinaca, 2 atados de Rúcula crocante, 1 planta de Lechuga romana y 500g Tomates Cherry dulces.',
      price: 1000.00,
      stock: 35.00,
      unit: 'und',
      categoryId: comboCategory.id,
      imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&q=80'
    }
  ];

  for (const combo of combos) {
    const existing = await prisma.product.findFirst({
      where: { name: combo.name }
    });

    if (!existing) {
      const created = await prisma.product.create({
        data: combo
      });
      console.log(`Created product: ${created.name} (ID: ${created.id})`);
    } else {
      console.log(`Product already exists: ${existing.name} (ID: ${existing.id})`);
    }
  }

  const allCombos = await prisma.product.findMany({
    where: { categoryId: comboCategory.id }
  });
  console.log('\nAll combos in category:', allCombos);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

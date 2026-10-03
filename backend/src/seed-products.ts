import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando carga de datos de prueba...');

  // Limpiar productos y categorías existentes
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();

  // 1. Crear Categorías
  const catFrutas = await prisma.category.create({
    data: {
      name: 'Frutas Frescas',
      description: 'Las mejores frutas de temporada, dulces y jugosas.',
      imageUrl: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=500&q=80',
    }
  });

  const catCitricos = await prisma.category.create({
    data: {
      name: 'Cítricos',
      description: 'Cargados de Vitamina C para tu sistema inmunológico.',
      imageUrl: 'https://images.unsplash.com/photo-1596733430284-f7437764b1a9?w=500&q=80',
    }
  });

  const catVerduras = await prisma.category.create({
    data: {
      name: 'Verduras de Hoja',
      description: 'Verduras frescas y crujientes directas de la huerta.',
      imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&q=80',
    }
  });

  const catHortalizas = await prisma.category.create({
    data: {
      name: 'Hortalizas y Raíces',
      description: 'Ideales para ensaladas, guisos y sopas.',
      imageUrl: 'https://images.unsplash.com/photo-1596199050105-6d5d32222916?w=500&q=80',
    }
  });

  const catExoticas = await prisma.category.create({
    data: {
      name: 'Frutas Exóticas',
      description: 'Sabores tropicales de todo el mundo.',
      imageUrl: 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=500&q=80',
    }
  });

  // 2. Crear Productos
  const productos = [
    // Frutas Frescas
    { name: 'Manzana Roja', description: 'Manzanas Fuji dulces y crujientes.', price: 2.50, stock: 100, unit: 'kg', categoryId: catFrutas.id, imageUrl: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6faa6?w=500&q=80' },
    { name: 'Plátano Cavendish', description: 'Plátanos maduros ideales para licuados.', price: 1.20, stock: 150, unit: 'kg', categoryId: catFrutas.id, imageUrl: 'https://images.unsplash.com/photo-1481349518771-20055b2a7b24?w=500&q=80' },
    { name: 'Pera Conferencia', description: 'Peras jugosas y de piel fina.', price: 3.00, stock: 80, unit: 'kg', categoryId: catFrutas.id, imageUrl: 'https://images.unsplash.com/photo-1514756331096-242fdea7046a?w=500&q=80' },
    { name: 'Uva Blanca Sin Semilla', description: 'Racimo de uvas dulces sin semillas.', price: 4.50, stock: 50, unit: 'kg', categoryId: catFrutas.id, imageUrl: 'https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=500&q=80' },

    // Cítricos
    { name: 'Naranja de Zumo', description: 'Naranjas valencianas súper jugosas.', price: 1.80, stock: 200, unit: 'kg', categoryId: catCitricos.id, imageUrl: 'https://images.unsplash.com/photo-1549888834-3ec93abae044?w=500&q=80' },
    { name: 'Limón Amarillo', description: 'Limones ácidos para aderezos.', price: 2.00, stock: 120, unit: 'kg', categoryId: catCitricos.id, imageUrl: 'https://images.unsplash.com/photo-1523626752472-b55a628f1acc?w=500&q=80' },
    { name: 'Mandarina Clementina', description: 'Mandarinas dulces, fáciles de pelar.', price: 2.20, stock: 90, unit: 'kg', categoryId: catCitricos.id, imageUrl: 'https://images.unsplash.com/photo-1611080632333-662eb7dd22bc?w=500&q=80' },
    { name: 'Pomelo Rosado', description: 'Pomelos con un toque amargo y refrescante.', price: 3.50, stock: 40, unit: 'kg', categoryId: catCitricos.id, imageUrl: 'https://images.unsplash.com/photo-1558500259-3610e75a8968?w=500&q=80' },

    // Verduras de Hoja
    { name: 'Espinaca Fresca', description: 'Atado de espinaca rica en hierro.', price: 1.50, stock: 60, unit: 'und', categoryId: catVerduras.id, imageUrl: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=500&q=80' },
    { name: 'Lechuga Romana', description: 'Crujiente, ideal para ensalada César.', price: 1.00, stock: 80, unit: 'und', categoryId: catVerduras.id, imageUrl: 'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=500&q=80' },
    { name: 'Acelga Orgánica', description: 'Hojas grandes y tallos tiernos.', price: 1.30, stock: 40, unit: 'und', categoryId: catVerduras.id, imageUrl: 'https://images.unsplash.com/photo-1606859345719-74d75f28c5fc?w=500&q=80' },
    { name: 'Rúcula Fresca', description: 'Hojas con un ligero toque picante.', price: 2.00, stock: 50, unit: 'und', categoryId: catVerduras.id, imageUrl: 'https://images.unsplash.com/photo-1515589654462-a9881e276b84?w=500&q=80' },

    // Hortalizas y Raíces
    { name: 'Zanahoria', description: 'Zanahorias dulces con hojas.', price: 1.10, stock: 150, unit: 'kg', categoryId: catHortalizas.id, imageUrl: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=500&q=80' },
    { name: 'Tomate Cherry', description: 'Pequeños, dulces y rojos.', price: 4.00, stock: 60, unit: 'kg', categoryId: catHortalizas.id, imageUrl: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500&q=80' },
    { name: 'Cebolla Morada', description: 'Sabor intenso para ensaladas y ceviche.', price: 1.60, stock: 100, unit: 'kg', categoryId: catHortalizas.id, imageUrl: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=500&q=80' },
    { name: 'Papa Blanca', description: 'Perfecta para purés o freír.', price: 0.90, stock: 300, unit: 'kg', categoryId: catHortalizas.id, imageUrl: 'https://images.unsplash.com/photo-1518977676601-b14fa7e656d7?w=500&q=80' },

    // Frutas Exóticas
    { name: 'Mango Ataulfo', description: 'Mangos dulces, sin fibra y suaves.', price: 5.00, stock: 70, unit: 'kg', categoryId: catExoticas.id, imageUrl: 'https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=500&q=80' },
    { name: 'Piña Golden', description: 'Piña extra dulce y jugosa.', price: 3.50, stock: 40, unit: 'und', categoryId: catExoticas.id, imageUrl: 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=500&q=80' },
    { name: 'Papaya', description: 'Rica en enzimas digestivas.', price: 2.80, stock: 35, unit: 'und', categoryId: catExoticas.id, imageUrl: 'https://images.unsplash.com/photo-1617112848923-cc2234396a8d?w=500&q=80' },
    { name: 'Aguacate Hass', description: 'Cremoso, ideal para guacamole.', price: 6.50, stock: 90, unit: 'kg', categoryId: catExoticas.id, imageUrl: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=500&q=80' },
  ];

  for (const prod of productos) {
    await prisma.product.create({
      data: prod
    });
  }

  console.log('✅ ¡Se han creado 5 Categorías y 20 Productos de prueba con éxito!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

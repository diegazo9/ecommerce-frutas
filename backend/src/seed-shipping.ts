import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.shippingZone.createMany({
    data: [
      { name: 'CABA (Toda la Capital)', description: 'Entregas de Lunes a Sábados. ¡Envío gratis superando los $15.000!', price: 0 },
      { name: 'GBA Norte', description: 'Vicente López, San Isidro, San Fernando. Entregas Martes y Jueves. (Costo fijo: $2.500)', price: 2500 },
      { name: 'GBA Sur', description: 'Avellaneda, Lanús, Lomas de Zamora. Entregas Miércoles y Viernes. (Costo fijo: $3.000)', price: 3000 }
    ]
  });
  console.log('Zonas de envío creadas exitosamente.');
}
main().catch(e => console.error(e)).finally(() => prisma.$disconnect());

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Inicializando administradores autorizados con Google OAuth...\n');

  const designatedAdmins = [
    { email: 'diegazo9@gmail.com', name: 'Diego Reynoso' },
    { email: 'ecommerceverduras@gmail.com', name: 'Ecommerce Verduras' }
  ];

  for (const adm of designatedAdmins) {
    const existing = await prisma.user.findUnique({
      where: { email: adm.email.toLowerCase() }
    });

    if (existing) {
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          role: 'ADMIN',
          passwordHash: null // Sin contraseña: autenticación exclusiva por Google OAuth
        }
      });
      console.log(`✅ Administrador confirmado (Solo Google): ${adm.email}`);
    } else {
      await prisma.user.create({
        data: {
          name: adm.name,
          email: adm.email.toLowerCase(),
          role: 'ADMIN',
          passwordHash: null // Sin contraseña: autenticación exclusiva por Google OAuth
        }
      });
      console.log(`✅ Administrador creado (Solo Google): ${adm.email}`);
    }
  }

  // Eliminar cuentas temporales si existieran
  await prisma.user.deleteMany({
    where: {
      email: { in: ['admin@vibranfrut.com', 'cliente@vibranfrut.com'] }
    }
  });

  console.log('\n✨ Configuración de administradores completada sin contraseñas temporales.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

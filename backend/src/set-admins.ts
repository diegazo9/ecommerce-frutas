import { prisma } from './prisma';

async function setAdmins() {
  const adminEmails = [
    { email: 'ecommerceverduras@gmail.com', name: 'Ecommerce Verduras' },
    { email: 'diegazo9@gmail.com', name: 'Diego Reynoso' }
  ];

  console.log('🔄 Configurando administradores exclusivos de Google OAuth...\n');

  for (const { email, name } of adminEmails) {
    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existing) {
      const updated = await prisma.user.update({
        where: { id: existing.id },
        data: { role: 'ADMIN', passwordHash: null }
      });
      console.log(`✅ Administrador actualizado (Solo Google): ${updated.email}`);
    } else {
      const created = await prisma.user.create({
        data: {
          name,
          email: email.toLowerCase(),
          passwordHash: null,
          role: 'ADMIN'
        }
      });
      console.log(`✅ Administrador creado (Solo Google): ${created.email}`);
    }
  }

  // Eliminar cuentas temporales
  await prisma.user.deleteMany({
    where: {
      email: { in: ['admin@vibranfrut.com', 'cliente@vibranfrut.com'] }
    }
  });

  console.log('✨ Listos. Solo estos dos correos quedan registrados para ingresar con Google.');
}

setAdmins()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

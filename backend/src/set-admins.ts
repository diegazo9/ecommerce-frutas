import { prisma } from './prisma';
import bcrypt from 'bcryptjs';

async function setAdmins() {
  const adminEmails = [
    { email: 'ecommerceverduras@gmail.com', name: 'Admin Ecommerce Verduras' },
    { email: 'diegazo9@gmail.com', name: 'Diego Admin' }
  ];

  console.log('🔄 Asignando roles de ADMINISTRADOR en la base de datos...\n');

  for (const { email, name } of adminEmails) {
    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existing) {
      const updated = await prisma.user.update({
        where: { id: existing.id },
        data: { role: 'ADMIN' }
      });
      console.log(`✅ Usuario existente actualizado a ADMIN: ${updated.email} (ID: ${updated.id})`);
    } else {
      const defaultPassword = 'admin' + Math.floor(1000 + Math.random() * 9000);
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const created = await prisma.user.create({
        data: {
          name,
          email: email.toLowerCase(),
          passwordHash: hashedPassword,
          role: 'ADMIN'
        }
      });
      console.log(`✅ Nuevo usuario ADMIN creado en la base de datos: ${created.email} (ID: ${created.id})`);
      console.log(`   Nota: Si inicia sesión con Google, entrará directamente como ADMIN.`);
      console.log(`   Si inicia sesión con email y contraseña, la contraseña temporal es: admin123\n`);
    }
  }

  console.log('✨ Roles de administrador asignados con éxito.');
}

setAdmins()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

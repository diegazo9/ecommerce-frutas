import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'admin@vibranfrut.com';
  
  // Check if admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail }
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    await prisma.user.create({
      data: {
        name: 'Administrador Principal',
        email: adminEmail,
        passwordHash: hashedPassword,
        role: 'ADMIN'
      }
    });
    console.log('✅ Usuario Administrador creado exitosamente.');
    console.log(`Email: ${adminEmail}`);
    console.log('Contraseña: admin123');
  } else {
    console.log('⚠️ El usuario administrador ya existe.');
  }

  // Asegurar administradores designados
  const designatedAdmins = [
    { email: 'diegazo9@gmail.com', name: 'Diego Admin' },
    { email: 'ecommerceverduras@gmail.com', name: 'Admin Ecommerce Verduras' }
  ];

  for (const adm of designatedAdmins) {
    const user = await prisma.user.findUnique({ where: { email: adm.email } });
    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: { role: 'ADMIN' }
      });
      console.log(`✅ Usuario administrador actualizado: ${adm.email}`);
    } else {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await prisma.user.create({
        data: {
          name: adm.name,
          email: adm.email,
          passwordHash: hashedPassword,
          role: 'ADMIN'
        }
      });
      console.log(`✅ Usuario administrador creado: ${adm.email}`);
    }
  }

  const customerEmail = 'cliente@vibranfrut.com';
  const existingCustomer = await prisma.user.findUnique({
    where: { email: customerEmail }
  });

  if (!existingCustomer) {
    const hashedPassword = await bcrypt.hash('cliente123', 10);
    await prisma.user.create({
      data: {
        name: 'Cliente VIP',
        email: customerEmail,
        passwordHash: hashedPassword,
        role: 'CUSTOMER'
      }
    });
    console.log('✅ Usuario Cliente creado exitosamente.');
    console.log(`Email: ${customerEmail}`);
    console.log('Contraseña: cliente123');
  } else {
    console.log('⚠️ El usuario cliente ya existe.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma';
import { OAuth2Client } from 'google-auth-library';
import { sendVerificationEmail } from '../services/emailService';

const JWT_SECRET = process.env.JWT_SECRET || 'secret123';
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID');

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'El nombre es obligatorio' });
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'Ingresa un email válido' });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existingUser = await prisma.user.findUnique({ where: { email: cleanEmail } });

    if (existingUser) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Seguridad: forzar siempre rol CUSTOMER en registro público (evita escalada de privilegios)
    let user;
    try {
      user = await prisma.user.create({
        data: {
          name: name.trim(),
          email: cleanEmail,
          passwordHash,
          role: 'CUSTOMER',
          isVerified: false
        }
      });
    } catch (createErr: any) {
      if (createErr.code === 'P2002' && createErr.meta?.target?.includes('id')) {
        // La secuencia users_id_seq en PostgreSQL quedó desfasada respecto a MAX(id). Corregir y reintentar.
        console.warn('[Register] Secuencia id desfasada (P2002). Sincronizando secuencia en PostgreSQL...');
        try {
          await prisma.$executeRawUnsafe(`
            SELECT setval(pg_get_serial_sequence('users', 'id'), GREATEST(COALESCE((SELECT MAX(id) FROM users), 0), 1));
          `);
        } catch (syncErr) {
          console.error('[Register] Error sincronizando secuencia:', syncErr);
        }
        user = await prisma.user.create({
          data: {
            name: name.trim(),
            email: cleanEmail,
            passwordHash,
            role: 'CUSTOMER',
            isVerified: false
          }
        });
      } else {
        throw createErr;
      }
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
      expiresIn: '1d'
    });

    // Generar token para verificación de email (24 horas)
    const verificationToken = jwt.sign(
      { userId: user.id, email: user.email, type: 'EMAIL_VERIFICATION' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const clientOrigin = (req.headers.origin as string) || (req.headers.referer as string);
    // Enviar correo de validación asincrónicamente para respuesta inmediata
    sendVerificationEmail(user.email, user.name, verificationToken, clientOrigin).catch(err => {
      console.warn('[Register] Error enviando correo de verificación:', err);
    });

    res.status(201).json({ 
      message: '¡Usuario registrado exitosamente! Te enviamos un correo de validación para activar tu cuenta.', 
      token, 
      user: { id: user.id, name: user.name, email: user.email, role: user.role, isVerified: user.isVerified } 
    });
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    res.status(500).json({ error: 'Error al registrar el usuario' });
  }
};

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ error: 'Token de verificación requerido' });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (jwtErr: any) {
      if (jwtErr.name === 'TokenExpiredError') {
        return res.status(400).json({ error: 'El enlace de validación ha expirado (válido por 24 horas). Por favor solicita uno nuevo.' });
      }
      return res.status(400).json({ error: 'El enlace de validación es inválido o está dañado.' });
    }

    if (!decoded || decoded.type !== 'EMAIL_VERIFICATION' || !decoded.userId) {
      return res.status(400).json({ error: 'Token de validación no válido.' });
    }

    // Actualizar usuario en base de datos
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;
      `);
      await prisma.$executeRawUnsafe(`
        UPDATE users SET is_verified = TRUE WHERE id = $1;
      `, decoded.userId);
    } catch (e) {
      console.warn('[verifyEmail] Raw SQL update warning:', e);
    }

    try {
      await (prisma as any).user.update({
        where: { id: Number(decoded.userId) },
        data: { isVerified: true }
      });
    } catch (pErr) {}

    const user = await prisma.user.findUnique({
      where: { id: Number(decoded.userId) },
      select: { id: true, name: true, email: true, role: true, isVerified: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    const sessionToken = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
      expiresIn: '1d'
    });

    res.json({
      success: true,
      message: '¡Tu correo electrónico ha sido verificado con éxito!',
      token: sessionToken,
      user
    });
  } catch (error: any) {
    console.error('Error al verificar email:', error);
    res.status(500).json({ error: 'Error al verificar el correo electrónico', details: error?.message });
  }
};

export const resendVerificationEmail = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'El email es obligatorio' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: cleanEmail } });

    if (!user) {
      return res.json({ success: true, message: 'Si el correo está registrado, enviamos un nuevo enlace de validación.' });
    }

    if (user.isVerified) {
      return res.json({ success: true, message: 'Tu cuenta ya se encuentra verificada. Ya puedes iniciar sesión.' });
    }

    const verificationToken = jwt.sign(
      { userId: user.id, email: user.email, type: 'EMAIL_VERIFICATION' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const clientOrigin = (req.headers.origin as string) || (req.headers.referer as string);
    await sendVerificationEmail(user.email, user.name, verificationToken, clientOrigin);

    res.json({ success: true, message: '¡Correo de validación reenviado! Revisa tu bandeja de entrada o spam.' });
  } catch (error: any) {
    console.error('Error al reenviar verificación:', error);
    res.status(500).json({ error: 'Error al reenviar correo de verificación' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ error: 'Credenciales inválidas' });
    }

    if (!user.passwordHash) {
      return res.status(400).json({ error: 'Esta cuenta fue registrada con Google. Inicia sesión con Google.' });
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Credenciales inválidas' });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
      expiresIn: '1d'
    });

    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, isVerified: user.isVerified } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
};

export const googleLogin = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID',
    });
    
    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return res.status(400).json({ error: 'Token de Google inválido' });
    }

    const { email, name } = payload;

    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: name || 'Usuario Google',
          role: 'CUSTOMER',
        }
      });
    }

    const jwtToken = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
      expiresIn: '1d'
    });

    res.json({ token: jwtToken, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    console.error('Error en googleLogin:', error);
    res.status(500).json({ error: 'Error al iniciar sesión con Google' });
  }
};

export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        orders: {
          select: {
            id: true,
            total: true,
            status: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formattedUsers = users.map(u => {
      const totalSpent = u.orders.reduce((sum, o) => sum + Number(o.total), 0);
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        createdAt: u.createdAt,
        orderCount: u.orders.length,
        totalSpent,
        recentOrders: u.orders.slice(0, 5)
      };
    });

    res.json(formattedUsers);
  } catch (error) {
    console.error('Error al obtener lista de usuarios:', error);
    res.status(500).json({ error: 'Error al obtener la lista de usuarios' });
  }
};

export const updateUserRole = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['CUSTOMER', 'ADMIN'].includes(role)) {
      return res.status(400).json({ error: 'Rol inválido. Debe ser CUSTOMER o ADMIN' });
    }

    const updated = await prisma.user.update({
      where: { id: Number(id) },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    });

    res.json(updated);
  } catch (error) {
    console.error('Error al actualizar rol:', error);
    res.status(500).json({ error: 'Error al actualizar el rol del usuario' });
  }
};

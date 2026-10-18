import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { getEmailSettings, saveEmailSettings, sendTestEmail } from '../services/emailService';

export const getEmailConfig = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    const settings = await getEmailSettings();
    res.json(settings);
  } catch (error: any) {
    console.error('Error al obtener configuración de correo:', error);
    res.status(500).json({ error: 'Error al obtener configuración de correo', details: error?.message });
  }
};

export const updateEmailConfig = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    const {
      host,
      port,
      secure,
      user,
      password,
      fromName,
      fromEmail,
      replyTo,
      bccAdmin,
      sendOnOrder,
      sendOnDelivery
    } = req.body;

    if (!host || !fromEmail) {
      return res.status(400).json({ error: 'El servidor Host y el Correo Remitente son obligatorios' });
    }

    const saved = await saveEmailSettings({
      host: String(host).trim(),
      port: Number(port) || 587,
      secure: Boolean(secure),
      user: String(user || '').trim(),
      password: password !== undefined ? String(password) : '',
      fromName: String(fromName || 'Vibranfrut').trim(),
      fromEmail: String(fromEmail || 'info@vibranfrut.com.ar').trim(),
      replyTo: replyTo ? String(replyTo).trim() : String(fromEmail || 'info@vibranfrut.com.ar').trim(),
      bccAdmin: bccAdmin !== undefined ? Boolean(bccAdmin) : true,
      sendOnOrder: sendOnOrder !== undefined ? Boolean(sendOnOrder) : true,
      sendOnDelivery: sendOnDelivery !== undefined ? Boolean(sendOnDelivery) : true
    });

    res.json({ message: 'Configuración de correo guardada con éxito', settings: saved });
  } catch (error: any) {
    console.error('Error al guardar configuración de correo:', error);
    res.status(500).json({ error: 'Error al guardar configuración de correo', details: error?.message });
  }
};

export const testEmailConnection = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    const { toEmail } = req.body;
    if (!toEmail) {
      return res.status(400).json({ error: 'Debes indicar un correo de destino para la prueba' });
    }

    const result = await sendTestEmail(toEmail);
    res.json(result);
  } catch (error: any) {
    console.error('Error en prueba de correo:', error);
    res.status(500).json({
      success: false,
      error: error?.message || 'Error al conectar con el servidor Mailcow / SMTP. Verifica los datos y puertos.'
    });
  }
};

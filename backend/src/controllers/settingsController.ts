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

    const { toEmail, settings } = req.body;
    if (!toEmail) {
      return res.status(400).json({ error: 'Debes indicar un correo de destino para la prueba' });
    }

    const result = await sendTestEmail(toEmail, settings);
    res.json(result);
  } catch (error: any) {
    console.error('Error en prueba de correo:', error);
    
    // Extraer detalles técnicos claros para el usuario
    let detailMsg = error?.message || 'Error al conectar con el servidor Mailcow';
    if (error?.code === 'ETIMEDOUT') {
      detailMsg = `Tiempo de espera agotado (ETIMEDOUT). El servidor o puerto no responde. Si usas el puerto 25, ten en cuenta que la mayoría de proveedores de internet lo bloquean. Usa el puerto 587 (STARTTLS).`;
    } else if (error?.code === 'ECONNREFUSED') {
      detailMsg = `Conexión rechazada (ECONNREFUSED). El servidor no está escuchando en ese puerto o la dirección IP/Host es inaccesible.`;
    } else if (error?.responseCode === 535 || detailMsg.includes('535') || error?.code === 'EAUTH') {
      detailMsg = `Error de autenticación (535): Usuario o contraseña de la casilla en Mailcow incorrectos. Verifica que el usuario sea la dirección completa (ej. info@vibranfrut.com.ar).`;
    } else if (error?.code === 'ENOTFOUND') {
      detailMsg = `No se pudo resolver el host (ENOTFOUND). Verifica que el nombre del servidor esté bien escrito o usa su dirección IP.`;
    } else if (error?.responseCode === 554 || detailMsg.includes('554') || detailMsg.includes('Access denied') || detailMsg.includes('Client host rejected')) {
      detailMsg = `Acceso denegado por Mailcow (554 Client host rejected). Esto ocurre si la conexión no se autenticó (falta la contraseña de la casilla en el campo 'Contraseña del Buzón'), o si se usó el puerto 25. Asegúrate de ingresar la contraseña y seleccionar el puerto 587 (STARTTLS).`;
    }

    res.status(500).json({
      success: false,
      error: detailMsg,
      code: error?.code,
      command: error?.command,
      rawError: error?.message
    });
  }
};

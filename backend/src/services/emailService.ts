import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { prisma } from '../prisma';
import { generateOrderPdf } from './pdfService';

export interface EmailSettingsPayload {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password?: string;
  fromName: string;
  fromEmail: string;
  replyTo?: string;
  bccAdmin?: boolean;
  sendOnOrder?: boolean;
  sendOnDelivery?: boolean;
}

const SETTINGS_FILE = path.join(__dirname, '../../data/email-settings.json');

// Caché de transportador
let cachedTransporter: Transporter | null = null;
let lastSettingsHash = '';

/**
 * Obtiene la configuración de correo actual desde la base de datos o archivo JSON de respaldo.
 */
export const getEmailSettings = async (): Promise<EmailSettingsPayload> => {
  // 1. Intentar desde la base de datos
  try {
    const dbSettings = await (prisma as any).emailSetting?.findFirst({
      orderBy: { id: 'desc' }
    });

    if (dbSettings) {
      return {
        host: dbSettings.host || 'mail.vibranfrut.com.ar',
        port: Number(dbSettings.port) || 587,
        secure: Boolean(dbSettings.secure),
        user: dbSettings.user || 'info@vibranfrut.com.ar',
        password: dbSettings.password || '',
        fromName: dbSettings.fromName || 'Vibranfrut',
        fromEmail: dbSettings.fromEmail || 'info@vibranfrut.com.ar',
        replyTo: dbSettings.replyTo || 'info@vibranfrut.com.ar',
        bccAdmin: dbSettings.bccAdmin !== undefined ? Boolean(dbSettings.bccAdmin) : true,
        sendOnOrder: dbSettings.sendOnOrder !== undefined ? Boolean(dbSettings.sendOnOrder) : true,
        sendOnDelivery: dbSettings.sendOnDelivery !== undefined ? Boolean(dbSettings.sendOnDelivery) : true,
      };
    }
  } catch (err) {
    // Si la tabla aún no se creó o hay error de conexión temporal, continuar con fallback
  }

  // 2. Intentar desde archivo local JSON de persistencia
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const fileContent = fs.readFileSync(SETTINGS_FILE, 'utf-8');
      const parsed = JSON.parse(fileContent);
      return {
        host: parsed.host || 'mail.vibranfrut.com.ar',
        port: Number(parsed.port) || 587,
        secure: Boolean(parsed.secure),
        user: parsed.user || 'info@vibranfrut.com.ar',
        password: parsed.password || '',
        fromName: parsed.fromName || 'Vibranfrut',
        fromEmail: parsed.fromEmail || 'info@vibranfrut.com.ar',
        replyTo: parsed.replyTo || 'info@vibranfrut.com.ar',
        bccAdmin: parsed.bccAdmin !== undefined ? Boolean(parsed.bccAdmin) : true,
        sendOnOrder: parsed.sendOnOrder !== undefined ? Boolean(parsed.sendOnOrder) : true,
        sendOnDelivery: parsed.sendOnDelivery !== undefined ? Boolean(parsed.sendOnDelivery) : true,
      };
    }
  } catch (fileErr) {
    console.warn('[EmailService] No se pudo leer email-settings.json:', fileErr);
  }

  // 3. Fallback a variables de entorno o valores por defecto para Mailcow Vibranfrut
  return {
    host: process.env.SMTP_HOST || 'mail.vibranfrut.com.ar',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || 'info@vibranfrut.com.ar',
    password: process.env.SMTP_PASS || '',
    fromName: process.env.SMTP_FROM_NAME || 'Vibranfrut - Frutas & Verduras',
    fromEmail: process.env.SMTP_FROM_EMAIL || 'info@vibranfrut.com.ar',
    replyTo: process.env.SMTP_REPLY_TO || 'info@vibranfrut.com.ar',
    bccAdmin: true,
    sendOnOrder: true,
    sendOnDelivery: true
  };
};

/**
 * Guarda o actualiza la configuración de correo en la base de datos y archivo de respaldo.
 */
export const saveEmailSettings = async (settings: EmailSettingsPayload): Promise<EmailSettingsPayload> => {
  // Asegurar directorio data/
  try {
    const dir = path.dirname(SETTINGS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8');
  } catch (fsErr) {
    console.warn('[EmailService] Error al guardar en email-settings.json:', fsErr);
  }

  // Intentar guardar en base de datos
  try {
    const existing = await (prisma as any).emailSetting?.findFirst({
      orderBy: { id: 'desc' }
    });

    if (existing) {
      await (prisma as any).emailSetting.update({
        where: { id: existing.id },
        data: {
          host: settings.host,
          port: Number(settings.port),
          secure: Boolean(settings.secure),
          user: settings.user,
          password: settings.password,
          fromName: settings.fromName,
          fromEmail: settings.fromEmail,
          replyTo: settings.replyTo,
          bccAdmin: Boolean(settings.bccAdmin),
          sendOnOrder: Boolean(settings.sendOnOrder),
          sendOnDelivery: Boolean(settings.sendOnDelivery)
        }
      });
    } else {
      await (prisma as any).emailSetting?.create({
        data: {
          host: settings.host,
          port: Number(settings.port),
          secure: Boolean(settings.secure),
          user: settings.user,
          password: settings.password,
          fromName: settings.fromName,
          fromEmail: settings.fromEmail,
          replyTo: settings.replyTo,
          bccAdmin: Boolean(settings.bccAdmin),
          sendOnOrder: Boolean(settings.sendOnOrder),
          sendOnDelivery: Boolean(settings.sendOnDelivery)
        }
      });
    }
  } catch (dbErr) {
    console.warn('[EmailService] No se pudo guardar en DB (usando archivo JSON):', dbErr);
  }

  // Invalidar caché del transporter para que use las nuevas credenciales
  cachedTransporter = null;
  lastSettingsHash = '';

  return settings;
};

/**
 * Inicializa y retorna el transportador Nodemailer con las configuraciones activas.
 */
const getTransporter = async (overrideSettings?: EmailSettingsPayload): Promise<{ transporter: Transporter; settings: EmailSettingsPayload }> => {
  let settings: EmailSettingsPayload;
  if (overrideSettings) {
    const saved = await getEmailSettings();
    settings = {
      ...saved,
      ...overrideSettings,
      password: (overrideSettings.password && overrideSettings.password.trim() !== '') ? overrideSettings.password : saved.password
    };
  } else {
    settings = await getEmailSettings();
  }

  const currentHash = `${settings.host}:${settings.port}:${settings.user}:${settings.password}:${settings.secure}`;

  if (!settings.password || settings.password.trim() === '') {
    throw new Error('Falta la contraseña de la casilla en Mailcow. Ingrésala en el campo "Contraseña del Buzón" para autenticar la conexión.');
  }

  if (overrideSettings) {
    // Si viene una configuración temporal para prueba, creamos un transportador nuevo
    const testTransporter = nodemailer.createTransport({
      host: settings.host,
      port: Number(settings.port),
      secure: Boolean(settings.secure), // true para 465 SSL, false para 587 STARTTLS
      requireTLS: settings.port === 587,
      auth: {
        user: settings.user,
        pass: settings.password
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
      tls: {
        rejectUnauthorized: false
      }
    });
    return { transporter: testTransporter, settings };
  }

  if (!cachedTransporter || lastSettingsHash !== currentHash) {
    cachedTransporter = nodemailer.createTransport({
      host: settings.host,
      port: Number(settings.port),
      secure: Boolean(settings.secure), // true para 465, false para 587
      requireTLS: settings.port === 587,
      auth: {
        user: settings.user,
        pass: settings.password
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
      tls: {
        // En servidores Mailcow internos o con certificados autofirmados / Let's Encrypt
        rejectUnauthorized: false
      }
    });

    lastSettingsHash = currentHash;
  }

  return { transporter: cachedTransporter, settings };
};

/**
 * Envía un correo de prueba para verificar conectividad con Mailcow / SMTP.
 */
export const sendTestEmail = async (toEmail: string, overrideSettings?: EmailSettingsPayload): Promise<{ success: boolean; message: string }> => {
  const { transporter, settings } = await getTransporter(overrideSettings);

  // Verificar conexión con el servidor
  await transporter.verify();

  const info = await transporter.sendMail({
    from: `"${settings.fromName}" <${settings.fromEmail}>`,
    to: toEmail,
    replyTo: settings.replyTo || settings.fromEmail,
    subject: '🍏 Verificación de Correo - Vibranfrut (Mailcow)',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; padding: 24px; border-radius: 16px;">
        <div style="background-color: #059669; padding: 20px; border-radius: 12px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 24px; letter-spacing: 1px;">VIBRANFRUT</h1>
          <p style="margin: 4px 0 0; font-size: 13px; opacity: 0.9;">Frutas y Verduras Seleccionadas</p>
        </div>
        <div style="background-color: white; padding: 24px; border-radius: 12px; margin-top: 16px; border: 1px solid #e2e8f0;">
          <h2 style="color: #065f46; margin-top: 0;">¡Conexión Exitosa con Mailcow! 🎉</h2>
          <p style="color: #334155; line-height: 1.6;">
            Este es un correo de prueba enviado desde el sistema de e-commerce de <strong>Vibranfrut</strong> para verificar la configuración de tu servidor corporativo.
          </p>
          <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 14px; border-radius: 8px; margin: 16px 0;">
            <p style="margin: 0; color: #166534; font-size: 13px;"><strong>Servidor Host:</strong> ${settings.host}</p>
            <p style="margin: 4px 0 0; color: #166534; font-size: 13px;"><strong>Puerto:</strong> ${settings.port} (${settings.secure ? 'SSL/TLS' : 'STARTTLS'})</p>
            <p style="margin: 4px 0 0; color: #166534; font-size: 13px;"><strong>Cuenta Remitente:</strong> ${settings.fromEmail}</p>
          </div>
          <p style="color: #64748b; font-size: 12px; margin-bottom: 0;">
            Fecha y hora de envío: ${new Date().toLocaleString('es-AR')}
          </p>
        </div>
      </div>
    `
  });

  return {
    success: true,
    message: `Correo de prueba enviado con éxito a ${toEmail}. ID del mensaje: ${info.messageId}`
  };
};

/**
 * Envía el correo de confirmación de pedido con el PDF adjunto al cliente.
 */
export const sendOrderConfirmationEmail = async (orderId: number): Promise<boolean> => {
  try {
    const { transporter, settings } = await getTransporter();

    if (!settings.sendOnOrder) {
      console.log(`[EmailService] Envío de email por pedido desactivado en configuración.`);
      return false;
    }

    // Obtener orden completa con sus relaciones
    const order = await prisma.order.findUnique({
      where: { id: Number(orderId) },
      include: {
        user: true,
        shippingZone: true,
        items: {
          include: { product: true }
        }
      }
    });

    if (!order) {
      console.error(`[EmailService] Pedido #${orderId} no encontrado para enviar email.`);
      return false;
    }

    const customerEmail = order.user?.email;
    if (!customerEmail) {
      console.warn(`[EmailService] El pedido #${orderId} no tiene email de cliente asociado.`);
      return false;
    }

    // Generar el comprobante PDF
    let pdfBuffer: Buffer | null = null;
    try {
      pdfBuffer = await generateOrderPdf(order);
    } catch (pdfErr) {
      console.error(`[EmailService] Error al generar PDF para pedido #${orderId}:`, pdfErr);
    }

    const itemsListHtml = order.items.map(item => `
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 10px 8px; color: #1e293b; font-weight: bold;">${item.quantity} ${item.product?.unit || 'kg'}</td>
        <td style="padding: 10px 8px; color: #334155;">${item.product?.name || 'Producto'}</td>
        <td style="padding: 10px 8px; color: #64748b; text-align: right;">$${Number(item.price).toFixed(2)}</td>
        <td style="padding: 10px 8px; color: #047857; font-weight: bold; text-align: right;">$${(Number(item.quantity) * Number(item.price)).toFixed(2)}</td>
      </tr>
    `).join('');

    const deliveryDateStr = order.deliveryDate
      ? new Date(order.deliveryDate).toLocaleDateString('es-AR', { weekday: 'long', day: '2-digit', month: 'long' })
      : 'A coordinar';

    const statusBadge = order.status === 'PAGADO'
      ? '<span style="background-color: #dcfce7; color: #166534; padding: 4px 10px; border-radius: 999px; font-weight: bold; font-size: 12px;">PAGADO</span>'
      : order.status === 'PAGO_EN_EFECTIVO'
        ? '<span style="background-color: #fef3c7; color: #92400e; padding: 4px 10px; border-radius: 999px; font-weight: bold; font-size: 12px;">EFECTIVO AL RECIBIR</span>'
        : '<span style="background-color: #e0f2fe; color: #0369a1; padding: 4px 10px; border-radius: 999px; font-weight: bold; font-size: 12px;">CONFIRMADO</span>';

    const bccList: string[] = [];
    if (settings.bccAdmin && settings.fromEmail) {
      bccList.push(settings.fromEmail);
    }

    await transporter.sendMail({
      from: `"${settings.fromName}" <${settings.fromEmail}>`,
      to: customerEmail,
      bcc: bccList.length > 0 ? bccList : undefined,
      replyTo: settings.replyTo || settings.fromEmail,
      subject: `🧺 Pedido Confirmado #${order.id} - Vibranfrut`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; background-color: #f8fafc; padding: 20px;">
          
          <!-- Encabezado con marca -->
          <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 24px; border-radius: 16px 16px 0 0; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 26px; font-weight: 900; letter-spacing: 1px;">VIBRANFRUT</h1>
            <p style="margin: 6px 0 0; font-size: 13px; opacity: 0.95;">Frutas & Verduras Frescas del Huerto</p>
          </div>

          <!-- Tarjeta Principal -->
          <div style="background-color: white; padding: 28px; border-radius: 0 0 16px 16px; border: 1px solid #e2e8f0; border-top: none;">
            
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #f1f5f9; padding-bottom: 16px; margin-bottom: 20px;">
              <div>
                <h2 style="color: #0f172a; margin: 0; font-size: 20px;">¡Gracias por tu compra, ${order.user?.name || 'Cliente'}! 🍓</h2>
                <p style="color: #64748b; font-size: 13px; margin: 4px 0 0;">Hemos registrado tu pedido exitosamente.</p>
              </div>
            </div>

            <!-- Datos Clave del Pedido -->
            <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
              <div style="margin-bottom: 10px;">
                <span style="font-size: 14px; font-weight: bold; color: #065f46;">Número de Pedido:</span>
                <span style="font-size: 16px; font-weight: 900; color: #047857; margin-left: 6px;">#${order.id}</span>
                <span style="margin-left: 12px;">${statusBadge}</span>
              </div>
              <div style="font-size: 13px; color: #1e293b; line-height: 1.6;">
                <p style="margin: 4px 0;">📅 <strong>Día de Entrega:</strong> ${deliveryDateStr}</p>
                <p style="margin: 4px 0;">⏰ <strong>Horario:</strong> ${order.deliveryTimeRange || 'Horario Flexible'}</p>
                <p style="margin: 4px 0;">📍 <strong>Dirección:</strong> ${order.deliveryAddress || 'Retiro en Local'}</p>
              </div>
            </div>

            <!-- Tabla de Productos -->
            <h3 style="color: #1e293b; font-size: 15px; margin-bottom: 12px;">Resumen de tu Cesta</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 20px;">
              <thead>
                <tr style="background-color: #f1f5f9; color: #475569; text-align: left;">
                  <th style="padding: 10px 8px; border-radius: 6px 0 0 6px;">Cant.</th>
                  <th style="padding: 10px 8px;">Producto</th>
                  <th style="padding: 10px 8px; text-align: right;">Unitario</th>
                  <th style="padding: 10px 8px; text-align: right; border-radius: 0 6px 6px 0;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsListHtml}
              </tbody>
            </table>

            <!-- Total Final -->
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; text-align: right; margin-bottom: 24px;">
              ${order.shippingZone && Number(order.shippingZone.price) > 0 ? `
                <p style="margin: 0 0 6px; font-size: 13px; color: #64748b;">
                  Envío (${order.shippingZone.name}): <strong style="color: #1e293b;">$${Number(order.shippingZone.price).toFixed(2)}</strong>
                </p>
              ` : ''}
              <p style="margin: 0; font-size: 18px; font-weight: 900; color: #047857;">
                TOTAL: $${Number(order.total).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </p>
            </div>

            <!-- Aviso de PDF adjunto -->
            ${pdfBuffer ? `
              <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; padding: 12px; display: flex; align-items: center; margin-bottom: 24px;">
                <p style="margin: 0; font-size: 13px; color: #1e40af;">
                  📄 <strong>Adjuntamos tu comprobante oficial en formato PDF</strong> para que puedas descargarlo o imprimirlo cuando quieras.
                </p>
              </div>
            ` : ''}

            <!-- Pie y Contacto -->
            <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; font-size: 12px; color: #64748b; line-height: 1.5; text-align: center;">
              <p style="margin: 0;">
                ¿Tenés alguna duda o cambio en tu pedido? Respondé directamente a este correo o contactanos a <a href="mailto:info@vibranfrut.com.ar" style="color: #059669; font-weight: bold; text-decoration: none;">info@vibranfrut.com.ar</a>.
              </p>
              <p style="margin: 8px 0 0; font-weight: bold; color: #065f46;">
                Vibranfrut • Calidad, frescura y sabor natural en tu hogar
              </p>
            </div>

          </div>
        </div>
      `,
      attachments: pdfBuffer ? [
        {
          filename: `Pedido-Vibranfrut-#${order.id}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ] : undefined
    });

    console.log(`[EmailService] Correo de confirmación enviado exitosamente para Pedido #${order.id} a ${customerEmail}`);
    return true;
  } catch (error) {
    console.error(`[EmailService] Error al enviar correo de pedido #${orderId}:`, error);
    return false;
  }
};

/**
 * Envía el correo notificando que el pedido ya está en camino a su domicilio.
 */
export const sendOrderDispatchedEmail = async (orderId: number): Promise<boolean> => {
  try {
    const { transporter, settings } = await getTransporter();

    if (!settings.sendOnDelivery) {
      console.log(`[EmailService] Envío de email por despacho desactivado en configuración.`);
      return false;
    }

    const order = await prisma.order.findUnique({
      where: { id: Number(orderId) },
      include: {
        user: true,
        shippingZone: true,
        items: {
          include: { product: true }
        }
      }
    });

    if (!order) return false;

    const customerEmail = order.user?.email;
    if (!customerEmail) return false;

    const itemsSummary = order.items
      .map(it => `${it.quantity} ${it.product?.unit || 'kg'} ${it.product?.name || 'Producto'}`)
      .join(', ');

    const paymentNotice = order.status === 'PAGO_EN_EFECTIVO'
      ? `<div style="background-color: #fef3c7; border: 1px solid #fde68a; padding: 12px; border-radius: 8px; margin: 16px 0; font-size: 13px; color: #92400e;">
           💵 <strong>Abono en efectivo contra entrega:</strong> Por favor ten a mano <strong>$${Number(order.total).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</strong> al recibir a nuestro repartidor.
         </div>`
      : `<div style="background-color: #dcfce7; border: 1px solid #bbf7d0; padding: 12px; border-radius: 8px; margin: 16px 0; font-size: 13px; color: #166534;">
           ✅ <strong>Pedido ya abonado:</strong> Solo debes recibir tu pedido y disfrutarlo.
         </div>`;

    await transporter.sendMail({
      from: `"${settings.fromName}" <${settings.fromEmail}>`,
      to: customerEmail,
      replyTo: settings.replyTo || settings.fromEmail,
      subject: `🚚 ¡Tu pedido #${order.id} de Vibranfrut está en camino!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; padding: 20px;">
          
          <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 24px; border-radius: 16px 16px 0 0; text-align: center; color: white;">
            <div style="font-size: 36px; margin-bottom: 6px;">🚚 💨</div>
            <h1 style="margin: 0; font-size: 24px; font-weight: 900;">¡Tu Pedido está en Camino!</h1>
            <p style="margin: 6px 0 0; font-size: 13px; opacity: 0.95;">Vibranfrut • Reparto en Ruta</p>
          </div>

          <div style="background-color: white; padding: 28px; border-radius: 0 0 16px 16px; border: 1px solid #e2e8f0; border-top: none;">
            
            <p style="font-size: 16px; color: #0f172a; margin-top: 0;">
              Hola <strong>${order.user?.name || 'Cliente'}</strong>,
            </p>
            <p style="color: #334155; line-height: 1.6; font-size: 14px;">
              Te avisamos que acabamos de armar y despachar el circuito de envíos del día. Nuestro repartidor ya tiene cargado tu pedido <strong>#${order.id}</strong> y se dirige a tu zona.
            </p>

            <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 16px; margin: 20px 0;">
              <p style="margin: 0 0 6px; font-size: 13px; color: #166534;">
                📍 <strong>Destino de Entrega:</strong> ${order.deliveryAddress || 'Domicilio acordado'}
              </p>
              <p style="margin: 0 0 6px; font-size: 13px; color: #166534;">
                ⏰ <strong>Franja Horaria:</strong> ${order.deliveryTimeRange || 'Horario habitual de reparto'}
              </p>
              <p style="margin: 0; font-size: 13px; color: #166534;">
                🧺 <strong>Contenido:</strong> ${itemsSummary}
              </p>
            </div>

            ${paymentNotice}

            <p style="color: #64748b; font-size: 13px; line-height: 1.6;">
              Si necesitas dejarnos alguna indicación adicional (número de timbre, persona que recibe, etc.), puedes comunicarte inmediatamente con nosotros respondiendo a este email o por WhatsApp.
            </p>

            <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 24px; text-align: center; font-size: 12px; color: #94a3b8;">
              <p style="margin: 0;">¡Que disfrutes la máxima frescura de Vibranfrut!</p>
              <p style="margin: 4px 0 0; color: #059669; font-weight: bold;">info@vibranfrut.com.ar</p>
            </div>

          </div>
        </div>
      `
    });

    console.log(`[EmailService] Aviso de pedido en camino #${order.id} enviado a ${customerEmail}`);
    return true;
  } catch (error) {
    console.error(`[EmailService] Error al enviar aviso de pedido en camino #${orderId}:`, error);
    return false;
  }
};

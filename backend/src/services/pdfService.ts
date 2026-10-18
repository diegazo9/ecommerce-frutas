import PDFDocument from 'pdfkit';

export interface OrderPdfData {
  id: number;
  createdAt: string | Date;
  total: number | any;
  status: string;
  deliveryDate?: string | Date | null;
  deliveryTimeRange?: string | null;
  deliveryAddress?: string | null;
  shippingZone?: { name: string; price: number | any } | null;
  user?: { name: string; email: string; phone?: string } | null;
  items?: Array<{
    id?: number;
    quantity: number;
    price: number;
    product: {
      name: string;
      unit?: string;
    };
  }>;
  [key: string]: any;
}

/**
 * Genera un PDF formal y elegante del pedido de Vibranfrut y retorna un Buffer.
 */
export const generateOrderPdf = async (order: OrderPdfData): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        margin: 40,
        size: 'A4',
        info: {
          Title: `Pedido Vibranfrut #${order.id}`,
          Author: 'Vibranfrut - Frutas & Verduras Frescas',
          Subject: `Detalle del Pedido #${order.id}`,
          Creator: 'Vibranfrut E-Commerce System'
        }
      });

      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });
      doc.on('error', (err) => reject(err));

      const primaryColor = '#059669'; // Emerald 600
      const primaryDark = '#065f46'; // Emerald 800
      const accentBg = '#f0fdf4'; // Emerald 50
      const textDark = '#1e293b'; // Slate 800
      const textMuted = '#64748b'; // Slate 500
      const borderColor = '#e2e8f0'; // Slate 200

      // ==================== CABECERA CON MARCA VIBRANFRUT ====================
      // Barra superior decorativa
      doc.rect(40, 40, doc.page.width - 80, 6)
        .fill(primaryColor);

      // Título y datos de contacto de la empresa
      doc.fillColor(primaryDark)
        .fontSize(24)
        .font('Helvetica-Bold')
        .text('VIBRANFRUT', 40, 56);

      doc.fillColor(primaryColor)
        .fontSize(9)
        .font('Helvetica-Bold')
        .text('FRUTAS & VERDURAS SELECCIONADAS DEL HUERTO', 40, 84);

      doc.fillColor(textMuted)
        .fontSize(8)
        .font('Helvetica')
        .text('Email: info@vibranfrut.com.ar | Web: vibranfrut.com.ar', 40, 96);

      // Bloque del Pedido (a la derecha)
      const orderDateStr = order.createdAt 
        ? new Date(order.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
        : new Date().toLocaleDateString('es-AR');

      doc.fillColor(primaryDark)
        .fontSize(16)
        .font('Helvetica-Bold')
        .text(`COMPROBANTE DE PEDIDO`, 300, 56, { align: 'right', width: doc.page.width - 340 });

      doc.fillColor(primaryColor)
        .fontSize(14)
        .font('Helvetica-Bold')
        .text(`PEDIDO #${order.id}`, 300, 76, { align: 'right', width: doc.page.width - 340 });

      doc.fillColor(textMuted)
        .fontSize(9)
        .font('Helvetica')
        .text(`Fecha: ${orderDateStr}`, 300, 94, { align: 'right', width: doc.page.width - 340 });

      // Línea divisoria
      doc.moveTo(40, 115).lineTo(doc.page.width - 40, 115).strokeColor(borderColor).lineWidth(1).stroke();

      // ==================== DATOS DEL CLIENTE Y ENTREGA ====================
      const clientBoxTop = 125;
      const boxWidth = (doc.page.width - 95) / 2;

      // Caja 1: Datos del Cliente
      doc.roundedRect(40, clientBoxTop, boxWidth, 90, 8)
        .fillAndStroke(accentBg, borderColor);

      doc.fillColor(primaryDark)
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('DATOS DEL CLIENTE', 52, clientBoxTop + 10);

      doc.fillColor(textDark)
        .fontSize(9)
        .font('Helvetica-Bold')
        .text(order.user?.name || 'Cliente Particular', 52, clientBoxTop + 26);

      doc.fillColor(textMuted)
        .fontSize(8.5)
        .font('Helvetica')
        .text(`Email: ${order.user?.email || 'No especificado'}`, 52, clientBoxTop + 40)
        .text(`Tel / WhatsApp: ${order.user?.phone || 'Registrado en pedido'}`, 52, clientBoxTop + 54);

      // Caja 2: Información de Envío y Entrega
      const box2Left = 40 + boxWidth + 15;
      doc.roundedRect(box2Left, clientBoxTop, boxWidth, 90, 8)
        .fillAndStroke(accentBg, borderColor);

      doc.fillColor(primaryDark)
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('DIRECCIÓN & HORARIO DE ENTREGA', box2Left + 12, clientBoxTop + 10);

      const deliveryDateFormatted = order.deliveryDate
        ? new Date(order.deliveryDate).toLocaleDateString('es-AR', { weekday: 'long', day: '2-digit', month: 'long' })
        : 'A coordinar';

      doc.fillColor(textDark)
        .fontSize(8.5)
        .font('Helvetica')
        .text(`Entrega: `, box2Left + 12, clientBoxTop + 26, { continued: true })
        .font('Helvetica-Bold')
        .text(deliveryDateFormatted);

      doc.font('Helvetica')
        .text(`Franja horaria: `, box2Left + 12, clientBoxTop + 39, { continued: true })
        .font('Helvetica-Bold')
        .text(order.deliveryTimeRange || 'Horario Flexible');

      doc.font('Helvetica')
        .text(`Destino: `, box2Left + 12, clientBoxTop + 52, { continued: true })
        .font('Helvetica-Bold')
        .text(order.deliveryAddress || 'Retiro en Local', { width: boxWidth - 24, height: 28 });

      // ==================== TABLA DE PRODUCTOS ====================
      const tableTop = 230;
      doc.rect(40, tableTop, doc.page.width - 80, 24)
        .fill(primaryDark);

      doc.fillColor('#ffffff')
        .fontSize(9)
        .font('Helvetica-Bold')
        .text('CANT.', 50, tableTop + 7)
        .text('DESCRIPCIÓN DEL PRODUCTO', 120, tableTop + 7)
        .text('PRECIO UNIT.', 370, tableTop + 7, { width: 80, align: 'right' })
        .text('SUBTOTAL', 460, tableTop + 7, { width: 85, align: 'right' });

      let currentY = tableTop + 24;
      const items = order.items || [];
      let calculatedSubtotal = 0;

      items.forEach((item, index) => {
        const qty = Number(item.quantity) || 1;
        const price = Number(item.price) || 0;
        const lineTotal = qty * price;
        calculatedSubtotal += lineTotal;
        const unit = item.product?.unit || 'kg';

        const rowBg = index % 2 === 0 ? '#ffffff' : '#f8fafc';
        doc.rect(40, currentY, doc.page.width - 80, 22).fill(rowBg);

        // Borde inferior fino
        doc.moveTo(40, currentY + 22).lineTo(doc.page.width - 40, currentY + 22).strokeColor('#f1f5f9').lineWidth(0.5).stroke();

        doc.fillColor(textDark)
          .fontSize(8.5)
          .font('Helvetica-Bold')
          .text(`${qty} ${unit}`, 50, currentY + 6);

        doc.font('Helvetica')
          .text(item.product?.name || 'Producto Fresco', 120, currentY + 6, { width: 240, ellipsis: true });

        doc.text(`$${price.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`, 370, currentY + 6, { width: 80, align: 'right' });

        doc.font('Helvetica-Bold')
          .text(`$${lineTotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`, 460, currentY + 6, { width: 85, align: 'right' });

        currentY += 22;
      });

      // Si no hubo items
      if (items.length === 0) {
        doc.rect(40, currentY, doc.page.width - 80, 24).fill('#ffffff');
        doc.fillColor(textMuted).fontSize(8.5).font('Helvetica').text('Detalle según registro de orden.', 50, currentY + 7);
        currentY += 24;
      }

      currentY += 12;

      // ==================== TOTALES Y FORMA DE PAGO ====================
      const totalsBoxWidth = 240;
      const totalsBoxLeft = doc.page.width - 40 - totalsBoxWidth;
      const orderTotal = Number(order.total) || calculatedSubtotal;
      const shippingCost = order.shippingZone ? Number(order.shippingZone.price) : Math.max(0, orderTotal - calculatedSubtotal);

      // Estado de Pago y Método a la izquierda
      doc.roundedRect(40, currentY, doc.page.width - 95 - totalsBoxWidth, 75, 8)
        .fillAndStroke('#f8fafc', borderColor);

      doc.fillColor(primaryDark)
        .fontSize(9)
        .font('Helvetica-Bold')
        .text('ESTADO DEL PEDIDO Y PAGO', 52, currentY + 10);

      const statusMap: Record<string, string> = {
        PAGADO: 'PAGADO (Aprobado)',
        PAGO_EN_EFECTIVO: 'A COBRAR EN EFECTIVO (Contra entrega)',
        PENDIENTE: 'PENDIENTE DE PAGO',
        PENDIENTE_MODO: 'TRANSFERENCIA / MODO (Pendiente de confirmación)',
        EN_PREPARACION: 'EN PREPARACIÓN',
        EN_CAMINO: 'EN CAMINO / EN REPARTO 🚚',
        ENTREGADO: 'ENTREGADO ✅',
        CANCELADO: 'CANCELADO ❌'
      };

      const friendlyStatus = statusMap[order.status] || order.status;

      doc.fillColor(textDark)
        .fontSize(8.5)
        .font('Helvetica-Bold')
        .text(friendlyStatus, 52, currentY + 26);

      doc.fillColor(textMuted)
        .fontSize(8)
        .font('Helvetica')
        .text('Cualquier modificación o aviso sobre tu entrega, por favor avísanos respondiendo a este email o por WhatsApp.', 52, currentY + 42, { width: doc.page.width - 120 - totalsBoxWidth });

      // Totales a la derecha
      doc.roundedRect(totalsBoxLeft, currentY, totalsBoxWidth, 75, 8)
        .fillAndStroke(accentBg, primaryColor);

      doc.fillColor(textDark)
        .fontSize(8.5)
        .font('Helvetica')
        .text('Subtotal Productos:', totalsBoxLeft + 14, currentY + 12)
        .text(`$${calculatedSubtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`, totalsBoxLeft + 130, currentY + 12, { width: 95, align: 'right' });

      doc.text('Costo de Envío:', totalsBoxLeft + 14, currentY + 28)
        .text(shippingCost > 0 ? `$${shippingCost.toLocaleString('es-AR', { minimumFractionDigits: 2 })}` : 'Bonificado / Gratis', totalsBoxLeft + 110, currentY + 28, { width: 115, align: 'right' });

      doc.moveTo(totalsBoxLeft + 14, currentY + 44).lineTo(totalsBoxLeft + totalsBoxWidth - 14, currentY + 44).strokeColor(borderColor).lineWidth(1).stroke();

      doc.fillColor(primaryDark)
        .fontSize(13)
        .font('Helvetica-Bold')
        .text('TOTAL:', totalsBoxLeft + 14, currentY + 52)
        .text(`$${orderTotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`, totalsBoxLeft + 100, currentY + 52, { width: 125, align: 'right' });

      // ==================== PIE DE PÁGINA ====================
      const footerY = doc.page.height - 75;

      doc.moveTo(40, footerY).lineTo(doc.page.width - 40, footerY).strokeColor(borderColor).lineWidth(1).stroke();

      doc.fillColor(primaryDark)
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('¡Gracias por elegir Vibranfrut para tu mesa!', 40, footerY + 10, { align: 'center', width: doc.page.width - 80 });

      doc.fillColor(textMuted)
        .fontSize(7.5)
        .font('Helvetica')
        .text('Vibranfrut • Productos frescos del huerto • Contacto: info@vibranfrut.com.ar • Argentina', 40, footerY + 25, { align: 'center', width: doc.page.width - 80 });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

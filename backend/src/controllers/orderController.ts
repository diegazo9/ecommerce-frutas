import { Request, Response } from 'express';
import { prisma } from '../prisma';
import { AuthRequest } from '../middlewares/auth';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';

// Configuración de Mercado Pago
const client = new MercadoPagoConfig({ 
  accessToken: process.env.MP_ACCESS_TOKEN || 'TEST-tu-access-token', 
  options: { timeout: 5000 } 
});

export const createOrderAndPreference = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id || null; 
    const { items, deliveryDate, deliveryTimeRange, shippingZoneId, deliveryAddress } = req.body; 

    if (!items || items.length === 0) return res.status(400).json({ error: 'El pedido no tiene items' });

    let total = 0;
    const orderItemsData = [];
    const preferenceItems = [];

    // Validar y sumar costo de envío
    let shippingCost = 0;
    if (shippingZoneId) {
      const zone = await prisma.shippingZone.findUnique({ where: { id: shippingZoneId } });
      if (zone) shippingCost = Number(zone.price);
    }

    for (const item of items) {
      const quantity = Number(item.quantity);
      if (!quantity || isNaN(quantity) || quantity <= 0) {
        return res.status(400).json({ error: 'Cada producto debe tener una cantidad válida y mayor a cero' });
      }

      const product = await prisma.product.findUnique({ where: { id: Number(item.productId) } });
      if (!product) return res.status(404).json({ error: `Producto con ID ${item.productId} no encontrado` });

      const itemTotal = Number(product.price) * quantity;
      total += itemTotal;

      orderItemsData.push({
        productId: product.id,
        quantity: quantity,
        price: product.price
      });

      preferenceItems.push({
        id: product.id.toString(),
        title: product.name,
        quantity: quantity,
        unit_price: Number(product.price),
        currency_id: 'ARS'
      });
    }

    // Agregar costo de envío si existe
    if (shippingCost > 0) {
      total += shippingCost;
      preferenceItems.push({
        id: 'SHIPPING',
        title: 'Costo de Envío',
        quantity: 1,
        unit_price: shippingCost,
        currency_id: 'ARS'
      });
    }

    if (!userId) return res.status(401).json({ error: 'Debes iniciar sesión para comprar' });

    const order = await prisma.order.create({
      data: {
        userId,
        total,
        status: 'PENDIENTE',
        deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
        deliveryTimeRange: deliveryTimeRange || null,
        deliveryAddress: deliveryAddress || null,
        shippingZoneId: shippingZoneId || null,
        items: {
          create: orderItemsData
        }
      }
    });

    // Crear Preferencia en Mercado Pago (con fallback simulado)
    const baseUrl = req.get('origin') || 'http://localhost:5173';
    let preferenceId = 'simulated_id';
    let initPoint = `${baseUrl}/#/profile`; 

    try {
      const preference = new Preference(client);
      const result = await preference.create({
        body: {
          items: preferenceItems,
          metadata: { orderId: order.id },
          back_urls: {
            success: baseUrl, 
            failure: baseUrl,
            pending: baseUrl
          },
          notification_url: process.env.WEBHOOK_URL ? `${process.env.WEBHOOK_URL}/api/orders/webhook` : undefined
        }
      });
      preferenceId = result.id!;
      initPoint = result.init_point!;
    } catch (mpError) {
      console.warn('⚠️ MercadoPago falló. Asegúrate de tener credenciales válidas y conexión a internet.', mpError);
      // Opcional: si quieres que falle de verdad cuando MP falle, descomenta la siguiente línea:
      // return res.status(500).json({ error: 'Error al conectar con Mercado Pago' });
    }

    // Devolver el ID de preferencia y la URL
    res.status(201).json({ 
      orderId: order.id, 
      preferenceId, 
      initPoint 
    });
  } catch (error) {
    console.error('Error creando orden/preferencia:', error);
    res.status(500).json({ error: 'Error al crear la orden de pago' });
  }
};

export const receiveWebhook = async (req: Request, res: Response) => {
  try {
    const payment = req.body;
    const paymentId = req.query['data.id'] || payment?.data?.id || (payment?.type === 'payment' ? payment?.id : null);
    
    if (paymentId) {
      try {
        const paymentClient = new Payment(client);
        const paymentInfo = await paymentClient.get({ id: Number(paymentId) });
        const orderId = Number(paymentInfo.metadata?.order_id || paymentInfo.external_reference);
        
        if (orderId && paymentInfo.status === 'approved') {
          const order = await prisma.order.findUnique({ where: { id: orderId } });
          
          // Seguridad: validar que la orden exista y que el monto pagado cubra el total de la orden
          if (order && Number(paymentInfo.transaction_amount) >= Number(order.total)) {
            await prisma.order.update({
              where: { id: orderId },
              data: { status: 'PAGADO' }
            });
            console.log(`[Webhook MP] Pedido #${orderId} verificado con monto correcto y actualizado a PAGADO`);
          } else {
            console.warn(`[Webhook MP] Alerta: Monto de pago (${paymentInfo.transaction_amount}) no coincide con el total esperado (${order?.total})`);
          }
        }
      } catch (err) {
        console.error('Error al procesar pago en webhook:', err);
      }
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Error en webhook', error);
    res.status(500).send('Error');
  }
};

export const getOrders = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;

    if (!userId) return res.status(401).json({ error: 'No autorizado' });

    // Sincronización automática de pagos con Mercado Pago
    try {
      const pendingOrders = await prisma.order.findMany({
        where: { status: 'PENDIENTE' },
        select: { id: true, total: true }
      });

      if (pendingOrders.length > 0) {
        const paymentClient = new Payment(client);
        const searchResult = await paymentClient.search({
          options: {
            sort: 'date_created',
            criteria: 'desc',
            limit: 20
          }
        });

        if (searchResult.results && searchResult.results.length > 0) {
          const pendingMap = new Map(pendingOrders.map(o => [o.id, Number(o.total)]));
          for (const p of searchResult.results) {
            const orderId = Number(p.metadata?.order_id || p.external_reference);
            const expectedTotal = pendingMap.get(orderId);
            if (orderId && expectedTotal !== undefined && p.status === 'approved' && Number(p.transaction_amount) >= expectedTotal) {
              await prisma.order.update({
                where: { id: orderId },
                data: { status: 'PAGADO' }
              });
              pendingMap.delete(orderId);
            }
          }
        }
      }
    } catch (syncErr) {
      console.warn('Error al sincronizar pagos de MP en getOrders:', syncErr);
    }

    const orders = await prisma.order.findMany({
      where: role === 'ADMIN' ? undefined : { userId },
      include: { 
        items: { include: { product: true } },
        user: true,
        shippingZone: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener ordenes' });
  }
};

export const updateOrderStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (req.user?.role !== 'ADMIN') return res.status(403).json({ error: 'Denegado' });

    const order = await prisma.order.update({
      where: { id: Number(id) },
      data: { status }
    });

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar orden' });
  }
};

export const cancelOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const role = req.user?.role;

    const order = await prisma.order.findUnique({ where: { id: Number(id) } });
    if (!order) return res.status(404).json({ error: 'Pedido no encontrado' });

    if (role !== 'ADMIN' && order.userId !== userId) {
      return res.status(403).json({ error: 'No tienes permiso para cancelar este pedido' });
    }

    if (order.status === 'ENTREGADO' || order.status === 'CANCELADO') {
      return res.status(400).json({ error: `No se puede cancelar un pedido ${order.status.toLowerCase()}` });
    }

    const updated = await prisma.order.update({
      where: { id: Number(id) },
      data: { status: 'CANCELADO' }
    });

    res.json(updated);
  } catch (error) {
    console.error('Error al cancelar pedido:', error);
    res.status(500).json({ error: 'Error al cancelar pedido' });
  }
};

export const payCashOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const order = await prisma.order.findUnique({ where: { id: Number(id) } });
    if (!order) return res.status(404).json({ error: 'Pedido no encontrado' });

    if (order.userId !== userId && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'No autorizado' });
    }

    if (order.status !== 'PENDIENTE') {
      return res.status(400).json({ error: 'Solo se pueden pagar en efectivo pedidos pendientes' });
    }

    const updated = await prisma.order.update({
      where: { id: Number(id) },
      data: { status: 'PAGO_EN_EFECTIVO' }
    });

    res.json(updated);
  } catch (error) {
    console.error('Error al marcar pago en efectivo:', error);
    res.status(500).json({ error: 'Error al actualizar el pedido' });
  }
};

export const payOrderWithMercadoPago = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const order = await prisma.order.findUnique({
      where: { id: Number(id) },
      include: {
        items: { include: { product: true } },
        shippingZone: true
      }
    });

    if (!order) return res.status(404).json({ error: 'Pedido no encontrado' });
    if (order.userId !== userId && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'No autorizado' });
    }

    if (order.status === 'PAGADO' || order.status === 'CANCELADO') {
      return res.status(400).json({ error: `El pedido ya está ${order.status.toLowerCase()}` });
    }

    const baseUrl = req.get('origin') || 'http://localhost:5173';
    const preferenceItems = order.items.map(item => ({
      id: item.productId.toString(),
      title: item.product.name,
      quantity: Number(item.quantity),
      unit_price: Number(item.price),
      currency_id: 'ARS'
    }));

    if (order.shippingZone && Number(order.shippingZone.price) > 0) {
      preferenceItems.push({
        id: 'SHIPPING',
        title: `Envío: ${order.shippingZone.name}`,
        quantity: 1,
        unit_price: Number(order.shippingZone.price),
        currency_id: 'ARS'
      });
    }

    const preference = new Preference(client);
    const result = await preference.create({
      body: {
        items: preferenceItems,
        metadata: { orderId: order.id },
        back_urls: {
          success: baseUrl,
          failure: baseUrl,
          pending: baseUrl
        },
        notification_url: process.env.WEBHOOK_URL ? `${process.env.WEBHOOK_URL}/api/orders/webhook` : undefined
      }
    });

    res.json({ initPoint: result.init_point });
  } catch (error: any) {
    console.error('Error al generar pago con Mercado Pago:', error);
    res.status(500).json({ error: 'Error al generar preferencia de Mercado Pago' });
  }
};

export const getOrderFinances = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    // Tasa estándar estimada de Mercado Pago en Argentina (6.39% + IVA 21% = ~7.73%)
    const defaultFeeRate = 0.0773;

    // 1. Obtener pagos recientes directamente desde Mercado Pago si hay token activo
    const mpPaymentsMap = new Map<number, any>();
    try {
      const paymentClient = new Payment(client);
      const searchResult = await paymentClient.search({
        options: {
          sort: 'date_created',
          criteria: 'desc',
          limit: 100
        }
      });

      if (searchResult.results && searchResult.results.length > 0) {
        for (const p of searchResult.results) {
          const orderId = Number(p.metadata?.order_id || p.external_reference);
          if (orderId) {
            mpPaymentsMap.set(orderId, p);
          }
        }
      }
    } catch (mpErr) {
      console.warn('[Finanzas] No se pudo consultar la API de Mercado Pago directamente:', mpErr);
    }

    // 2. Obtener todas las órdenes registradas
    const orders = await prisma.order.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        shippingZone: { select: { id: true, name: true, price: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    let totalGross = 0;
    let totalFees = 0;
    let totalNet = 0;
    let paidOrdersCount = 0;

    const settlements = orders.map(order => {
      const gross = Number(order.total);
      const isPaid = ['PAGADO', 'ENTREGADO', 'EN_PREPARACION'].includes(order.status);
      const mpData = mpPaymentsMap.get(order.id);

      let feeAmount = 0;
      let netAmount = gross;
      let feeDetail = 'Mercado Pago (7.73% IVA incl.)';
      let mpPaymentId = mpData?.id ? String(mpData.id) : null;
      let paymentMethod = mpData?.payment_type_id || mpData?.payment_method_id || 'Mercado Pago';

      if (mpData) {
        const realNet = Number(mpData.net_received_amount);
        const realGross = Number(mpData.transaction_amount) || gross;
        if (!isNaN(realNet) && realNet > 0 && realNet <= realGross) {
          netAmount = realNet;
          feeAmount = Number((realGross - realNet).toFixed(2));
          feeDetail = mpData.fee_details?.map((f: any) => `${f.type}: $${f.amount}`).join(', ') || 'Comisión Oficial MP';
        } else {
          feeAmount = Number((gross * defaultFeeRate).toFixed(2));
          netAmount = Number((gross - feeAmount).toFixed(2));
        }
      } else {
        feeAmount = Number((gross * defaultFeeRate).toFixed(2));
        netAmount = Number((gross - feeAmount).toFixed(2));
      }

      if (isPaid) {
        totalGross += gross;
        totalFees += feeAmount;
        totalNet += netAmount;
        paidOrdersCount += 1;
      }

      return {
        orderId: order.id,
        mpPaymentId,
        date: order.createdAt,
        customerName: order.user?.name || 'Cliente',
        customerEmail: order.user?.email || '',
        status: order.status,
        isPaid,
        grossAmount: gross,
        feeAmount,
        netAmount,
        feeDetail,
        paymentMethod
      };
    });

    res.json({
      summary: {
        totalGross: Number(totalGross.toFixed(2)),
        totalFees: Number(totalFees.toFixed(2)),
        totalNet: Number(totalNet.toFixed(2)),
        paidOrdersCount,
        averageTicket: paidOrdersCount > 0 ? Number((totalGross / paidOrdersCount).toFixed(2)) : 0,
        averageFeePercentage: totalGross > 0 ? Number(((totalFees / totalGross) * 100).toFixed(2)) : 7.73
      },
      settlements
    });
  } catch (error) {
    console.error('Error calculando finanzas:', error);
    res.status(500).json({ error: 'Error al obtener reporte financiero' });
  }
};


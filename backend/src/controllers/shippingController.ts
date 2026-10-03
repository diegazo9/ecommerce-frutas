import { Request, Response } from 'express';
import { prisma } from '../prisma';

export const getShippingZones = async (req: Request, res: Response) => {
  try {
    const zones = await prisma.shippingZone.findMany({
      orderBy: { id: 'asc' }
    });
    res.json(zones);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching shipping zones' });
  }
};

export const createShippingZone = async (req: Request, res: Response) => {
  try {
    const { name, description, price, isActive } = req.body;
    const zone = await prisma.shippingZone.create({
      data: { name, description, price, isActive }
    });
    res.status(201).json(zone);
  } catch (error) {
    res.status(500).json({ error: 'Error creating shipping zone' });
  }
};

export const updateShippingZone = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, price, isActive } = req.body;
    const zone = await prisma.shippingZone.update({
      where: { id: Number(id) },
      data: { name, description, price, isActive }
    });
    res.json(zone);
  } catch (error) {
    res.status(500).json({ error: 'Error updating shipping zone' });
  }
};

export const deleteShippingZone = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.shippingZone.delete({
      where: { id: Number(id) }
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Error deleting shipping zone' });
  }
};

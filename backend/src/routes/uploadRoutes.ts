import { Router } from 'express';
import { authenticateToken, requireAdmin } from '../middlewares/auth';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';

const router = Router();
const uploadsDir = path.join(__dirname, '../../uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ error: 'No se recibió ninguna imagen' });
    }

    // Identificar tipo de imagen y extraer el base64 puro
    const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    let buffer: Buffer;
    let ext = 'jpg';

    if (matches && matches.length === 3) {
      const mime = matches[1].toLowerCase();
      if (mime.includes('png')) ext = 'png';
      else if (mime.includes('webp')) ext = 'webp';
      else if (mime.includes('gif')) ext = 'gif';
      else if (mime.includes('svg')) ext = 'svg';
      buffer = Buffer.from(matches[2], 'base64');
    } else {
      buffer = Buffer.from(image, 'base64');
    }

    // Nombre único para el archivo
    const filename = `prod-${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${ext}`;
    const filepath = path.join(uploadsDir, filename);

    await fs.promises.writeFile(filepath, buffer);

    // Construir la URL pública
    const protocol = req.get('x-forwarded-proto') || req.protocol;
    const host = req.get('host') || 'api.vibranfrut.com.ar';
    const url = `${protocol}://${host}/uploads/${filename}`;

    res.json({ success: true, url });
  } catch (err: any) {
    console.error('Error al guardar imagen:', err);
    res.status(500).json({ error: 'Error interno al guardar la imagen en el servidor' });
  }
});

export default router;

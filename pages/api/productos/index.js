// pages/api/productos/index.js
import { ProductoController } from '../../../controllers/ProductoController';

// Permite subir fotos optimizadas desde el celular (data URL) sin servicios externos.
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4mb'
    }
  }
};

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return ProductoController.listar(req, res);
  }
  if (req.method === 'POST') {
    return ProductoController.crear(req, res);
  }
  return res.status(405).json({ error: 'Método no permitido' });
}

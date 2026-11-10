// pages/api/productos/[id].js
import { ProductoController } from '../../../controllers/ProductoController';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4mb'
    }
  }
};

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return ProductoController.obtener(req, res);
  }
  if (req.method === 'PUT' || req.method === 'PATCH') {
    return ProductoController.actualizar(req, res);
  }
  if (req.method === 'DELETE') {
    return ProductoController.eliminar(req, res);
  }
  return res.status(405).json({ error: 'Método no permitido' });
}

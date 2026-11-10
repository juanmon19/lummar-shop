// pages/api/productos/index.js
import { ProductoController } from '../../../controllers/ProductoController';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return ProductoController.listar(req, res);
  }
  if (req.method === 'POST') {
    return ProductoController.crear(req, res);
  }
  if (req.method === 'DELETE') {
    return ProductoController.eliminar(req, res);
  }
  return res.status(405).json({ error: 'Método no permitido' });
}

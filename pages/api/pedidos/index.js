// pages/api/pedidos/index.js
import { PedidoController } from '../../../controllers/PedidoController';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    return PedidoController.crear(req, res);
  }
  if (req.method === 'GET') {
    return PedidoController.listar(req, res);
  }
  return res.status(405).json({ error: 'Método no permitido' });
}

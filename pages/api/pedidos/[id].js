// pages/api/pedidos/[id].js
import { PedidoController } from '../../../controllers/PedidoController';

export default async function handler(req, res) {
  if (req.method === 'PATCH' || req.method === 'PUT') {
    return PedidoController.actualizarEstado(req, res);
  }
  return res.status(405).json({ error: 'Método no permitido' });
}

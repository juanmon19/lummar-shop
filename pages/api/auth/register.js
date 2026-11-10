// pages/api/auth/register.js
import { AuthController } from '../../../controllers/AuthController';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    return AuthController.registrar(req, res);
  }
  return res.status(405).json({ error: 'Método no permitido' });
}

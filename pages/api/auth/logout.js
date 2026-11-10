// pages/api/auth/logout.js
import { AuthController } from '../../../controllers/AuthController';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    return AuthController.logout(req, res);
  }
  return res.status(405).json({ error: 'Método no permitido' });
}

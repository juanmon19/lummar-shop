// pages/api/auth/login.js
import { AuthController } from '../../../controllers/AuthController';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    return AuthController.login(req, res);
  }
  return res.status(405).json({ error: 'Método no permitido' });
}

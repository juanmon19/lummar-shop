// pages/api/health.js
// Diagnóstico público: indica si la base de datos está configurada y conectada.

import { healthCheck } from '../../config/database';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const db = await healthCheck();
  const ok = db.connected;

  res.setHeader('Cache-Control', 'no-store');
  return res.status(ok ? 200 : 503).json({
    ok,
    aplicacion: 'Lummar Shop',
    database: db,
    setupHabilitado: Boolean(process.env.SETUP_SECRET),
    whatsappConfigurado: Boolean(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER),
    googleConfigurado: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
  });
}

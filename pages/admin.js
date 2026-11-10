// pages/admin.js - Ruta protegida de Administrador (/admin)
import React from 'react';
import AdminDashboardView from '../views/admin/AdminDashboardView';
import { ProductoModel } from '../models/ProductoModel';
import { getTokenFromRequest, verifySessionToken } from '../config/security';

export default function AdminPage({ adminUser, productos }) {
  return <AdminDashboardView adminUser={adminUser} initialProducts={productos} />;
}

export async function getServerSideProps({ req }) {
  const token = getTokenFromRequest(req);
  const sesion = token ? await verifySessionToken(token) : null;

  if (!sesion || sesion.rol !== 'admin') {
    return {
      redirect: {
        destination: '/login',
        permanent: false
      }
    };
  }

  const productos = await ProductoModel.obtenerTodos();
  return {
    props: {
      adminUser: sesion,
      productos: JSON.parse(JSON.stringify(productos))
    }
  };
}

// pages/admin.js - Ruta protegida de Administrador (/admin)
import React from 'react';
import AdminDashboardView from '../views/admin/AdminDashboardView';
import { ProductoModel, PRODUCTOS_DEMO } from '../models/ProductoModel';
import { getSessionFromRequest } from '../config/security';
import { isDbConfigured } from '../config/database';

export default function AdminPage({ adminUser, productos, dbConfigurado, dbError }) {
  return (
    <AdminDashboardView
      adminUser={adminUser}
      initialProducts={productos}
      dbConfigurado={dbConfigurado}
      dbError={dbError}
    />
  );
}

export async function getServerSideProps({ req }) {
  const sesion = await getSessionFromRequest(req);

  if (!sesion || sesion.rol !== 'admin') {
    return {
      redirect: {
        destination: '/login',
        permanent: false
      }
    };
  }

  let productos = PRODUCTOS_DEMO;
  let dbConfigurado = isDbConfigured();
  let dbError = null;

  try {
    const resultado = await ProductoModel.listar({
      incluirInactivos: true,
      usarDemoSiFalla: false
    });
    productos = resultado.productos;
    dbConfigurado = resultado.dbConfigurado;
  } catch (error) {
    console.error('[pages/admin.js]', error);
    dbError = error.message;
  }

  return {
    props: {
      adminUser: sesion,
      productos: JSON.parse(JSON.stringify(productos)),
      dbConfigurado,
      dbError
    }
  };
}

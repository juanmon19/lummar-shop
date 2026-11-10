// pages/index.js - Tienda pública
import React from 'react';
import HomeView from '../views/tienda/HomeView';
import { ProductoModel, PRODUCTOS_DEMO } from '../models/ProductoModel';
import { isDbConfigured } from '../config/database';

export default function IndexPage({ productos, dbConfigurado, origen }) {
  return (
    <HomeView
      initialProducts={productos}
      dbConfigurado={dbConfigurado}
      origen={origen}
    />
  );
}

export async function getServerSideProps() {
  try {
    const resultado = await ProductoModel.listar();
    return {
      props: {
        productos: JSON.parse(JSON.stringify(resultado.productos)),
        dbConfigurado: resultado.dbConfigurado,
        origen: resultado.origen
      }
    };
  } catch (error) {
    console.error('[pages/index.js]', error);
    return {
      props: {
        productos: JSON.parse(JSON.stringify(PRODUCTOS_DEMO)),
        dbConfigurado: isDbConfigured(),
        origen: 'demo'
      }
    };
  }
}

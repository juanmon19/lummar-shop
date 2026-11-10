// pages/index.js - Punto de entrada principal (Front Controller -> Vista Tienda)
import React from 'react';
import HomeView from '../views/tienda/HomeView';
import { ProductoModel } from '../models/ProductoModel';

export default function IndexPage({ productos }) {
  return <HomeView initialProducts={productos} />;
}

export async function getServerSideProps() {
  const productos = await ProductoModel.obtenerTodos();
  return {
    props: {
      productos: JSON.parse(JSON.stringify(productos))
    }
  };
}

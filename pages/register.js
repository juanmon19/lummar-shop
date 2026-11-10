// pages/register.js - Ruta de registro con Google + Bcrypt (/register)
import React from 'react';
import RegisterView from '../views/auth/RegisterView';

export default function RegisterPage({ googleEnabled }) {
  return <RegisterView googleEnabled={googleEnabled} />;
}

export async function getServerSideProps() {
  return {
    props: {
      googleEnabled: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
    }
  };
}

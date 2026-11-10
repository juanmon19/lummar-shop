// pages/login.js - Ruta independiente de Login (/login)
import React from 'react';
import LoginView from '../views/auth/LoginView';

export default function LoginPage({ googleEnabled }) {
  return <LoginView googleEnabled={googleEnabled} />;
}

export async function getServerSideProps() {
  return {
    props: {
      googleEnabled: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
    }
  };
}

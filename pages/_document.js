// pages/_document.js
import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="es">
      <Head>
        <meta name="theme-color" content="#FFF8F0" />
        <meta name="format-detection" content="telephone=no" />
        <meta
          name="description"
          content="Lummar Shop: bolsos, joyería, fragancias y accesorios seleccionados. Compra fácil por WhatsApp."
        />
        <link rel="icon" href="/img/logo.jpg" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

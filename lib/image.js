// lib/image.js
// Optimiza fotos en el navegador (celular o computador) y las convierte a JPEG.
// Así el administrador puede subir productos sin contratar un servicio de archivos.

const MAX_ORIGINAL = 20 * 1024 * 1024; // 20 MB

function cargarImagen(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(
        new Error(
          'No se pudo leer la imagen. Prueba con JPG, PNG o WEBP. Si es HEIC del iPhone, expórtala como JPG.'
        )
      );
    };
    img.src = url;
  });
}

export async function optimizarImagen(
  file,
  { maxDimension = 1280, quality = 0.82, maxBytes = 3_200_000 } = {}
) {
  if (!file) {
    throw new Error('Selecciona una imagen.');
  }
  if (!file.type || !file.type.startsWith('image/')) {
    throw new Error('El archivo seleccionado no es una imagen.');
  }
  if (file.size > MAX_ORIGINAL) {
    throw new Error('La imagen original supera los 20 MB. Elige una foto más liviana.');
  }

  const img = await cargarImagen(file);
  const escala = Math.min(1, maxDimension / Math.max(img.width, img.height));
  const ancho = Math.max(1, Math.round(img.width * escala));
  const alto = Math.max(1, Math.round(img.height * escala));

  const canvas = document.createElement('canvas');
  canvas.width = ancho;
  canvas.height = alto;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Tu navegador no pudo procesar la imagen.');
  }

  // Fondo blanco para fotos con transparencia (PNG).
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, ancho, alto);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, ancho, alto);

  let dataUrl = canvas.toDataURL('image/jpeg', quality);
  for (const q of [0.72, 0.62, 0.5]) {
    if (dataUrl.length <= maxBytes) break;
    dataUrl = canvas.toDataURL('image/jpeg', q);
  }

  if (dataUrl.length > maxBytes) {
    throw new Error('La imagen sigue siendo muy pesada. Intenta con una foto más pequeña.');
  }

  return {
    dataUrl,
    width: ancho,
    height: alto,
    kb: Math.round((dataUrl.length * 0.75) / 1024)
  };
}

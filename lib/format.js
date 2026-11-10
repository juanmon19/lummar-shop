// lib/format.js
// Utilidades de formato compartidas por la tienda y el panel.

const COP = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0
});

export function formatCOP(valor) {
  const numero = Number(valor);
  return COP.format(Number.isFinite(numero) ? numero : 0);
}

export function formatFecha(valor) {
  if (!valor) return '';
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return '';
  return fecha.toLocaleString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function soloDigitos(valor) {
  return String(valor || '').replace(/\D/g, '');
}

export function normalizarWhatsApp(valor, pais = '57') {
  let digitos = soloDigitos(valor);
  if (!digitos) return '';
  if (digitos.startsWith('00')) digitos = digitos.slice(2);
  if (digitos.length === 10) digitos = `${pais}${digitos}`;
  return digitos;
}

export function telefonoBonito(valor) {
  const digitos = soloDigitos(valor);
  if (digitos.length === 12 && digitos.startsWith('57')) {
    return `+57 ${digitos.slice(2, 5)} ${digitos.slice(5, 8)} ${digitos.slice(8)}`;
  }
  if (digitos.length === 10) {
    return `${digitos.slice(0, 3)} ${digitos.slice(3, 6)} ${digitos.slice(6)}`;
  }
  return valor;
}

export const ESTADOS_PEDIDO = [
  { valor: 'pendiente', etiqueta: 'Pendiente', clase: 'bg-amber-100 text-amber-800 border-amber-300' },
  { valor: 'confirmado', etiqueta: 'Confirmado', clase: 'bg-sky-100 text-sky-800 border-sky-300' },
  { valor: 'enviado', etiqueta: 'Enviado', clase: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
  { valor: 'entregado', etiqueta: 'Entregado', clase: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  { valor: 'cancelado', etiqueta: 'Cancelado', clase: 'bg-rose-100 text-rose-800 border-rose-300' }
];

export function estadoPedido(valor) {
  return ESTADOS_PEDIDO.find((estado) => estado.valor === valor) || ESTADOS_PEDIDO[0];
}

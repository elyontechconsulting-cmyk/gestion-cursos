// Recibo de pago en PDF (jsPDF, cargado bajo demanda).
// Se genera siempre desde la base de datos, así la reimpresión es idéntica al original.
import { pagosApi } from '@/api/pagos.api';
import { MEDIOS_PAGO } from '@/lib/constants';
import { formatFecha, formatFechaHora, formatMoneda } from '@/utils/format';
import { datosOrganizacion } from './export.service';
import { notify } from './notify';

export const formatNumeroRecibo = (n: number) => String(n).padStart(6, '0');

/** Imprime el recibo mostrando el error al usuario si falla. Por defecto lo marca como reimpresión. */
export async function reimprimir(pagoId: string, inscripcionId: string, reimpresion = true): Promise<void> {
  try {
    await imprimirRecibo(pagoId, inscripcionId, { reimpresion });
  } catch (e) {
    notify.error(e, 'No se pudo generar el recibo');
  }
}

/**
 * Genera el recibo del pago y lo abre en una pestaña nueva para imprimir.
 * Si el navegador bloquea la pestaña, se descarga el PDF.
 */
export async function imprimirRecibo(pagoId: string, inscripcionId: string, opts: { reimpresion?: boolean } = {}): Promise<void> {
  const [{ jsPDF }, historial, org] = await Promise.all([
    import('jspdf'),
    pagosApi.historial(inscripcionId),
    datosOrganizacion(),
  ]);
  const pago = historial.find((p) => p.id === pagoId);
  if (!pago) throw new Error('No se encontró el pago (puede haber sido anulado)');

  // Acumulado hasta este pago (el número de recibo es correlativo por orden de registro)
  const pagadoAcum = historial
    .filter((p) => p.numero_recibo <= pago.numero_recibo)
    .reduce((s, p) => s + Number(p.monto), 0);
  const total = Number(pago.inscripcion_monto_total);
  const saldo = Math.max(0, Math.round((total - pagadoAcum) * 100) / 100);
  const numero = formatNumeroRecibo(pago.numero_recibo);

  const doc = new jsPDF({ unit: 'pt', format: 'a5' });
  const W = doc.internal.pageSize.getWidth();
  const M = 32;
  let y = 44;

  // Encabezado: datos de la organización (pantalla Configuración) y número de recibo
  const anchoOrg = W - M * 2 - 145;
  const nombreOrg = doc.splitTextToSize(org.nombre, anchoOrg) as string[];
  doc.setFont('helvetica', 'bold').setFontSize(13).text(nombreOrg, M, y);
  let yOrg = y + 15 * nombreOrg.length - 3;
  doc.setFont('helvetica', 'normal').setFontSize(8).setTextColor(110);
  const contacto = [
    org.ruc ? `RUC ${org.ruc}` : '',
    org.direccion ?? '',
    [org.telefono, org.correo].filter(Boolean).join(' · '),
  ].filter(Boolean);
  for (const linea of contacto) {
    const partes = doc.splitTextToSize(linea, anchoOrg) as string[];
    doc.text(partes, M, yOrg);
    yOrg += 10 * partes.length;
  }
  doc.setTextColor(0);
  doc.setDrawColor(79, 70, 229).setLineWidth(1).roundedRect(W - M - 130, y - 18, 130, 40, 4, 4);
  doc.setFont('helvetica', 'bold').setFontSize(9).setTextColor(79, 70, 229).text('RECIBO DE PAGO N.°', W - M - 65, y - 3, { align: 'center' });
  doc.setFontSize(14).text(numero, W - M - 65, y + 14, { align: 'center' });
  doc.setTextColor(0);
  y = Math.max(yOrg, y + 30) + 14;

  if (opts.reimpresion) {
    doc.setFont('helvetica', 'bold').setFontSize(8).setTextColor(220, 38, 38);
    doc.text(`REIMPRESIÓN · ${formatFechaHora(new Date().toISOString())}`, W - M, y - 8, { align: 'right' });
    doc.setTextColor(0);
  }

  // Datos del estudiante y del curso
  const fila = (etiqueta: string, valor: string) => {
    doc.setFont('helvetica', 'normal').setFontSize(9).setTextColor(110).text(etiqueta, M, y);
    doc.setTextColor(0);
    const lineas = doc.splitTextToSize(valor, W - M * 2 - 90) as string[];
    doc.text(lineas, M + 90, y);
    y += 14 * lineas.length;
  };
  doc.setDrawColor(228).setLineWidth(0.5).line(M, y - 10, W - M, y - 10);
  y += 6;
  fila('Fecha de pago', formatFecha(pago.fecha_pago));
  fila('Estudiante', pago.estudiante_nombre);
  fila('DNI', pago.dni);
  fila('Curso', `${pago.curso_codigo} · ${pago.curso_nombre}`);
  fila('Medio de pago', `${MEDIOS_PAGO[pago.medio_pago]}${pago.numero_operacion ? ` · Op. ${pago.numero_operacion}` : ''}`);
  y += 6;

  // Concepto e importe
  doc.setFillColor(79, 70, 229).rect(M, y, W - M * 2, 20, 'F');
  doc.setFont('helvetica', 'bold').setFontSize(9).setTextColor(255);
  doc.text('Concepto', M + 8, y + 13);
  doc.text('Importe', W - M - 8, y + 13, { align: 'right' });
  doc.setTextColor(0);
  y += 34;
  doc.setFont('helvetica', 'normal');
  const tipo = saldo > 0 ? 'Pago parcial' : pagadoAcum > Number(pago.monto) ? 'Cancelación de saldo' : 'Pago total';
  const concepto = `${tipo} del curso ${pago.curso_codigo}`;
  doc.text(concepto, M + 8, y);
  doc.text(formatMoneda(pago.monto), W - M - 8, y, { align: 'right' });
  y += 12;
  doc.line(M, y, W - M, y);
  y += 16;

  doc.setFont('helvetica', 'bold').setFontSize(11).text('TOTAL PAGADO', M + 8, y);
  doc.text(formatMoneda(pago.monto), W - M - 8, y, { align: 'right' });
  y += 16;
  doc.setFont('helvetica', 'normal').setFontSize(8.5);
  const letras = doc.splitTextToSize(`Son: ${montoEnLetras(Number(pago.monto))}`, W - M * 2 - 16) as string[];
  doc.text(letras, M + 8, y);
  y += 12 * letras.length + 14;

  // Estado de cuenta de la inscripción tras este pago
  doc.setFillColor(244, 244, 245).roundedRect(M, y, W - M * 2, 58, 4, 4, 'F');
  const resumen = (etiqueta: string, valor: string, dy: number, destacado = false) => {
    doc.setFont('helvetica', destacado ? 'bold' : 'normal').setFontSize(9);
    doc.text(etiqueta, M + 10, y + dy);
    doc.text(valor, W - M - 10, y + dy, { align: 'right' });
  };
  resumen('Total del curso', formatMoneda(total), 16);
  resumen('Pagado a la fecha', formatMoneda(pagadoAcum), 31);
  resumen('Saldo pendiente', formatMoneda(saldo), 47, true);
  y += 76;

  if (pago.observaciones) {
    doc.setFont('helvetica', 'normal').setFontSize(8.5).setTextColor(90);
    const obs = doc.splitTextToSize(`Observaciones: ${pago.observaciones}`, W - M * 2) as string[];
    doc.text(obs, M, y);
    y += 11 * obs.length + 6;
    doc.setTextColor(0);
  }

  // Pie
  const H = doc.internal.pageSize.getHeight();
  doc.setDrawColor(160).line(W / 2 - 80, H - 78, W / 2 + 80, H - 78);
  doc.setFontSize(8).setTextColor(110).text('Firma y sello', W / 2, H - 66, { align: 'center' });
  doc.text(
    `Registrado: ${formatFechaHora(pago.created_at)}${pago.registrado_por ? ` · ${pago.registrado_por}` : ''}`,
    W / 2, H - 30, { align: 'center' },
  );

  doc.setProperties({ title: `Recibo ${numero}` });
  doc.autoPrint();
  const url = URL.createObjectURL(doc.output('blob'));
  const ventana = window.open(url, '_blank');
  if (!ventana) doc.save(`recibo_${numero}.pdf`);
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

// --- Monto en letras (formato usual en comprobantes peruanos) -----------------

const UNIDADES = ['', 'UNO', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE', 'DIEZ',
  'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISÉIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE', 'VEINTE',
  'VEINTIUNO', 'VEINTIDÓS', 'VEINTITRÉS', 'VEINTICUATRO', 'VEINTICINCO', 'VEINTISÉIS', 'VEINTISIETE', 'VEINTIOCHO', 'VEINTINUEVE'];
const DECENAS = ['', '', '', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
const CENTENAS = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS',
  'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

function menorMil(n: number): string {
  if (n === 100) return 'CIEN';
  const c = Math.floor(n / 100);
  const r = n % 100;
  const resto = r < 30 ? UNIDADES[r] : `${DECENAS[Math.floor(r / 10)]}${r % 10 ? ` Y ${UNIDADES[r % 10]}` : ''}`;
  return [CENTENAS[c], resto].filter(Boolean).join(' ');
}

function enteroEnLetras(n: number): string {
  if (n === 0) return 'CERO';
  const millones = Math.floor(n / 1_000_000);
  const miles = Math.floor((n % 1_000_000) / 1000);
  const resto = n % 1000;
  return [
    millones ? (millones === 1 ? 'UN MILLÓN' : `${menorMil(millones).replace(/UNO$/, 'UN')} MILLONES`) : '',
    miles ? (miles === 1 ? 'MIL' : `${menorMil(miles).replace(/UNO$/, 'UN')} MIL`) : '',
    resto ? menorMil(resto) : '',
  ].filter(Boolean).join(' ');
}

/** 1250.5 → "MIL DOSCIENTOS CINCUENTA Y 50/100 SOLES" */
export function montoEnLetras(monto: number): string {
  const centimos = Math.round(monto * 100);
  const entero = Math.floor(centimos / 100);
  return `${enteroEnLetras(entero)} Y ${String(centimos % 100).padStart(2, '0')}/100 SOLES`;
}

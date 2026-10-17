// Exportación a Excel (exceljs) y PDF (jsPDF + autotable).
// Las librerías se cargan bajo demanda para no aumentar el bundle inicial.
import { formatFechaHora } from '@/utils/format';
import { configuracionApi } from '@/api/configuracion.api';
import { queryClient, queryKeys } from '@/lib/queryClient';

export type TipoColumna = 'texto' | 'moneda' | 'fecha' | 'numero';

export interface ColumnaExport<T> {
  header: string;
  value: (row: T) => string | number | null | undefined;
  tipo?: TipoColumna;
  width?: number;
}

export interface OpcionesExport<T> {
  titulo: string;
  subtitulo?: string;
  archivo: string;
  columnas: ColumnaExport<T>[];
  filas: T[];
  totales?: Partial<Record<number, string | number>>;
  orientacion?: 'portrait' | 'landscape';
}

const ORG = 'Gestión de Cursos';

export interface DatosOrganizacion {
  nombre: string;
  ruc: string | null;
  direccion: string | null;
  telefono: string | null;
  correo: string | null;
}

/** Datos de la organización (pantalla Configuración), cacheados por React Query. */
export async function datosOrganizacion(): Promise<DatosOrganizacion> {
  try {
    const c = await queryClient.fetchQuery({ queryKey: queryKeys.configuracion, queryFn: configuracionApi.obtener });
    return { nombre: c.nombre_organizacion, ruc: c.ruc, direccion: c.direccion, telefono: c.telefono, correo: c.correo };
  } catch {
    // Sin la tabla de configuración (migración pendiente) se usa el nombre por defecto
    return { nombre: ORG, ruc: null, direccion: null, telefono: null, correo: null };
  }
}

function descargar(blob: Blob, nombre: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const marcaTiempo = () => new Date().toISOString().slice(0, 10);

export async function exportarExcel<T>(o: OpcionesExport<T>): Promise<void> {
  const [{ default: ExcelJS }, org] = await Promise.all([import('exceljs'), datosOrganizacion()]);
  const wb = new ExcelJS.Workbook();
  wb.creator = org.nombre;
  wb.created = new Date();
  const ws = wb.addWorksheet(o.titulo.slice(0, 31), { views: [{ state: 'frozen', ySplit: 4 }] });

  const nCols = o.columnas.length;
  ws.mergeCells(1, 1, 1, nCols);
  ws.getCell(1, 1).value = o.titulo;
  ws.getCell(1, 1).font = { bold: true, size: 14 };
  ws.mergeCells(2, 1, 2, nCols);
  ws.getCell(2, 1).value = `${org.nombre} · ${o.subtitulo ? o.subtitulo + ' · ' : ''}Generado: ${formatFechaHora(new Date().toISOString())}`;
  ws.getCell(2, 1).font = { size: 10, color: { argb: 'FF71717A' } };

  const header = ws.getRow(4);
  o.columnas.forEach((c, i) => {
    const cell = header.getCell(i + 1);
    cell.value = c.header;
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
    cell.alignment = { vertical: 'middle' };
    ws.getColumn(i + 1).width = c.width ?? Math.max(12, c.header.length + 4);
  });

  o.filas.forEach((f, r) => {
    const row = ws.getRow(5 + r);
    o.columnas.forEach((c, i) => {
      const v = c.value(f);
      const cell = row.getCell(i + 1);
      if (c.tipo === 'moneda') {
        cell.value = Number(v ?? 0);
        cell.numFmt = '"S/" #,##0.00';
      } else if (c.tipo === 'numero') {
        cell.value = Number(v ?? 0);
      } else if (c.tipo === 'fecha' && typeof v === 'string' && v) {
        cell.value = new Date(`${v.slice(0, 10)}T00:00:00Z`);
        cell.numFmt = 'dd/mm/yyyy';
      } else {
        cell.value = v ?? '';
      }
    });
  });

  if (o.totales) {
    const row = ws.getRow(5 + o.filas.length);
    Object.entries(o.totales).forEach(([idx, v]) => {
      const i = Number(idx);
      const cell = row.getCell(i + 1);
      cell.value = v as string | number;
      cell.font = { bold: true };
      if (o.columnas[i]?.tipo === 'moneda') cell.numFmt = '"S/" #,##0.00';
    });
  }

  ws.autoFilter = { from: { row: 4, column: 1 }, to: { row: 4 + o.filas.length, column: nCols } };
  const buf = await wb.xlsx.writeBuffer();
  descargar(
    new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    `${o.archivo}_${marcaTiempo()}.xlsx`,
  );
}

export async function exportarPdf<T>(o: OpcionesExport<T>): Promise<void> {
  const [{ jsPDF }, { default: autoTable }, fmt, org] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
    import('@/utils/format'),
    datosOrganizacion(),
  ]);
  const doc = new jsPDF({ orientation: o.orientacion ?? 'landscape', unit: 'pt', format: 'a4' });
  const ancho = doc.internal.pageSize.getWidth();

  doc.setFontSize(15).setFont('helvetica', 'bold').text(o.titulo, 40, 44);
  doc.setFontSize(9).setFont('helvetica', 'normal').setTextColor(110);
  doc.text(`${org.nombre}${o.subtitulo ? ' · ' + o.subtitulo : ''}`, 40, 60);
  doc.text(`Generado: ${formatFechaHora(new Date().toISOString())}`, ancho - 40, 60, { align: 'right' });
  doc.setTextColor(0);

  const formatear = (c: ColumnaExport<T>, v: unknown) => {
    if (v === null || v === undefined || v === '') return '';
    if (c.tipo === 'moneda') return fmt.formatMoneda(v as number);
    if (c.tipo === 'fecha') return fmt.formatFecha(String(v));
    if (c.tipo === 'numero') return fmt.formatNumero(v as number);
    return String(v);
  };

  const foot = o.totales
    ? [o.columnas.map((c, i) => (o.totales![i] !== undefined ? formatear(c, o.totales![i]) : ''))]
    : undefined;

  autoTable(doc, {
    startY: 74,
    head: [o.columnas.map((c) => c.header)],
    body: o.filas.map((f) => o.columnas.map((c) => formatear(c, c.value(f)))),
    foot,
    styles: { fontSize: 8, cellPadding: 4 },
    headStyles: { fillColor: [79, 70, 229], textColor: 255 },
    footStyles: { fillColor: [244, 244, 245], textColor: 20, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [250, 250, 250] },
    columnStyles: Object.fromEntries(
      o.columnas.map((c, i) => [i, { halign: c.tipo === 'moneda' || c.tipo === 'numero' ? 'right' : 'left' }]),
    ),
    didDrawPage: () => {
      const h = doc.internal.pageSize.getHeight();
      doc.setFontSize(8).setTextColor(140);
      doc.text(`Página ${doc.getNumberOfPages()}`, ancho - 40, h - 20, { align: 'right' });
      doc.setTextColor(0);
    },
  });

  doc.save(`${o.archivo}_${marcaTiempo()}.pdf`);
}

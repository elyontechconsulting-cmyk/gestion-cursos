import { useState } from 'react';
import { FileSpreadsheet, FileText } from 'lucide-react';
import { Button } from '@/components/ui';
import { notify } from '@/services/notify';

export function ExportButtons({ onExcel, onPdf, disabled }: { onExcel: () => Promise<void>; onPdf: () => Promise<void>; disabled?: boolean }) {
  const [cargando, setCargando] = useState<'xlsx' | 'pdf' | null>(null);
  const run = async (tipo: 'xlsx' | 'pdf', fn: () => Promise<void>) => {
    setCargando(tipo);
    try {
      await fn();
    } catch (e) {
      notify.error(e, 'No se pudo exportar');
    } finally {
      setCargando(null);
    }
  };
  return (
    <div className="flex gap-2">
      <Button variant="outline" disabled={disabled} loading={cargando === 'xlsx'} icon={<FileSpreadsheet className="h-4 w-4" />} onClick={() => run('xlsx', onExcel)}>Excel</Button>
      <Button variant="outline" disabled={disabled} loading={cargando === 'pdf'} icon={<FileText className="h-4 w-4" />} onClick={() => run('pdf', onPdf)}>PDF</Button>
    </div>
  );
}

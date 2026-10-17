import { useState } from 'react';
import { PageHeader } from '@/components/ui';
import { cn } from '@/utils/cn';
import { ReporteInscritos } from './ReporteInscritos';
import { ReporteFinanciero } from './ReporteFinanciero';
import { ReporteEstudiantes } from './ReporteEstudiantes';

const TABS = [
  { id: 'inscritos', label: 'Inscritos por curso' },
  { id: 'financiero', label: 'Financiero' },
  { id: 'estudiantes', label: 'Estudiantes' },
] as const;

export default function ReportesPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('inscritos');
  return (
    <>
      <PageHeader title="Reportes" description="Indicadores académicos y financieros exportables a Excel y PDF" />
      <div className="mb-5 flex gap-1 overflow-x-auto border-b border-zinc-200 dark:border-white/[0.07]">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              '-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition-colors',
              tab === t.id ? 'border-brand-600 text-zinc-900 dark:text-white' : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'inscritos' && <ReporteInscritos />}
      {tab === 'financiero' && <ReporteFinanciero />}
      {tab === 'estudiantes' && <ReporteEstudiantes />}
    </>
  );
}

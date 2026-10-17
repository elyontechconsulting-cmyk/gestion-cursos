import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { EmptyState, Button } from '@/components/ui';

export default function SinAccesoPage() {
  return (
    <EmptyState
      icon={<ShieldAlert className="h-5 w-5" />}
      title="No tiene acceso a esta sección"
      description="Su rol no tiene permisos para ver esta página. Si cree que es un error, contacte al administrador."
      action={<Link to="/"><Button variant="outline">Ir al inicio</Button></Link>}
    />
  );
}

import { Link } from 'react-router-dom';
import { EmptyState, Button } from '@/components/ui';

export default function NotFoundPage() {
  return (
    <EmptyState
      title="Página no encontrada"
      description="La dirección no existe o fue movida."
      action={<Link to="/"><Button variant="outline">Ir al inicio</Button></Link>}
    />
  );
}

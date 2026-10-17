import { useEffect, useRef, useState } from 'react';
import { consultarDni, type DatosDni } from '@/services/dni.service';
import { estudiantesApi } from '@/api/estudiantes.api';

export type EstadoConsulta = 'idle' | 'buscando' | 'encontrado' | 'duplicado' | 'error';

/**
 * Al completar 8 dígitos: verifica que el DNI no esté registrado y consulta la API de DNI.
 * Cancela la consulta anterior si el usuario sigue escribiendo.
 */
export function useConsultaDni(dni: string, habilitado: boolean, onDatos: (d: DatosDni) => void) {
  const [estado, setEstado] = useState<EstadoConsulta>('idle');
  const [mensaje, setMensaje] = useState<string>('');
  const onDatosRef = useRef(onDatos);
  onDatosRef.current = onDatos;

  useEffect(() => {
    if (!habilitado || !/^\d{8}$/.test(dni)) {
      setEstado('idle');
      setMensaje('');
      return;
    }
    const ctrl = new AbortController();
    (async () => {
      setEstado('buscando');
      setMensaje('Consultando RENIEC…');
      try {
        const existente = await estudiantesApi.porDni(dni);
        if (ctrl.signal.aborted) return;
        if (existente) {
          setEstado('duplicado');
          setMensaje(`Ya registrado: ${existente.nombres} ${existente.apellido_paterno}`);
          return;
        }
        const datos = await consultarDni(dni, ctrl.signal);
        if (ctrl.signal.aborted) return;
        onDatosRef.current(datos);
        setEstado('encontrado');
        setMensaje('Datos completados automáticamente');
      } catch (e) {
        if (ctrl.signal.aborted) return;
        setEstado('error');
        setMensaje(`${(e as Error).message}. Puede ingresar los datos manualmente.`);
      }
    })();
    return () => ctrl.abort();
  }, [dni, habilitado]);

  return { estado, mensaje };
}

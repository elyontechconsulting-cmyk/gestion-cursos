import { useEffect, useRef, useState } from 'react';
import { consultarDni, type DatosDni } from '@/services/dni.service';
import { estudiantesApi } from '@/api/estudiantes.api';

export type EstadoConsulta = 'idle' | 'buscando' | 'encontrado' | 'duplicado' | 'error';

/** Devuelve el nombre de quien ya tiene ese DNI registrado, o null si está libre. */
export type BuscarExistente = (dni: string) => Promise<string | null>;

const estudianteExistente: BuscarExistente = async (dni) => {
  const e = await estudiantesApi.porDni(dni);
  return e ? `${e.nombres} ${e.apellido_paterno}` : null;
};

/**
 * Al completar 8 dígitos: verifica que el DNI no esté registrado y consulta la API de DNI.
 * Cancela la consulta anterior si el usuario sigue escribiendo.
 * Por defecto busca duplicados entre los estudiantes; `buscarExistente` permite otra tabla.
 */
export function useConsultaDni(
  dni: string,
  habilitado: boolean,
  onDatos: (d: DatosDni) => void,
  buscarExistente: BuscarExistente = estudianteExistente,
) {
  const [estado, setEstado] = useState<EstadoConsulta>('idle');
  const [mensaje, setMensaje] = useState<string>('');
  const onDatosRef = useRef(onDatos);
  onDatosRef.current = onDatos;
  const buscarRef = useRef(buscarExistente);
  buscarRef.current = buscarExistente;

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
        const existente = await buscarRef.current(dni);
        if (ctrl.signal.aborted) return;
        if (existente) {
          setEstado('duplicado');
          setMensaje(`Ya registrado: ${existente}`);
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

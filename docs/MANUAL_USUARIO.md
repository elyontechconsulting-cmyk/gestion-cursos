# Manual de usuario

Sistema web para administrar cursos, estudiantes, inscripciones y pagos. Funciona en computadora, tablet y celular, y se puede instalar como aplicación.

## 1. Acceso

1. Abra la dirección del sistema e ingrese su **correo** y **contraseña**.
2. ¿Olvidó la contraseña? Use **¿Olvidó su contraseña?** y siga el enlace que llegará a su correo.
3. Las cuentas las crea el administrador. Si su cuenta está desactivada, no podrá ingresar.

### Qué puede hacer cada rol

| Rol | Puede |
|---|---|
| **Administrador** | Todo: cursos, estudiantes, inscripciones, pagos, reportes, usuarios y auditoría |
| **Operador** | Registrar estudiantes, inscripciones y pagos; ver cursos y dashboard |
| **Consulta** | Ver dashboard y reportes |

Las opciones que su rol no permite no aparecen en el menú.

## 2. Pantalla principal

* **Menú lateral**: navegue entre módulos. En computadora puede **colapsarlo** con el botón *Colapsar*; en celular se abre con el ícono ☰.
* **Tema**: el ícono de la barra superior alterna entre claro, oscuro y el del sistema.
* **Búsqueda instantánea**: escriba en el buscador de cada tabla; los resultados se actualizan mientras escribe.
* **Filtros**: el botón *Filtros* abre opciones avanzadas (estado, fechas, curso…). *Limpiar* los quita.
* **Paginación**: al pie de cada tabla elija cuántas filas ver y cambie de página.

## 3. Dashboard

Muestra: total de cursos, estudiantes e inscritos, total recaudado, pagos pendientes (con el monto por cobrar) y cursos activos, además de los gráficos de recaudación mensual, cobranza y recaudación por curso. Pase el cursor (o toque) sobre un gráfico para ver el valor exacto.

## 4. Cursos

* **Nuevo curso**: complete código (ej. `EXC-001`), nombre, fechas, horario, modalidad (Presencial, Virtual o Híbrido), costo en soles, cupos y estado.
* **Editar** ✏️ · **Duplicar** 📄 (crea una copia programada con código nuevo, ideal para una nueva edición) · **Eliminar** 🗑️ (solo si no tiene inscripciones; si las tiene, cámbielo a *Cancelado*).
* **Ver inscritos** 👁️ o clic en la fila: ficha del curso con cupos, pagados, recaudado y por cobrar, la lista de inscritos, botón **Inscribir** y exportación a Excel/PDF.
* La barra de *Inscritos* cambia a ámbar al 80 % y a rojo cuando el curso está lleno.

## 5. Estudiantes

1. Clic en **Nuevo estudiante**.
2. Escriba el **DNI** (8 dígitos). El sistema:
   * avisa si el DNI ya está registrado, y
   * consulta RENIEC y **completa nombres y apellidos automáticamente**.
3. Complete correo, teléfono (celular de 9 dígitos, ej. `987654321`), dirección y fecha de nacimiento, y **Guardar**.

Si la consulta de DNI no responde, puede escribir los datos a mano. El botón 📋 muestra los cursos del estudiante y su saldo.

## 6. Inscripciones

1. **Nueva inscripción** → busque al estudiante por DNI o nombre (si no existe, elija *Registrar nuevo estudiante*).
2. Seleccione el curso; verá el costo y los cupos disponibles. Los cursos sin cupos aparecen deshabilitados.
3. Elija estado *Inscrito* o *Preinscrito* y guarde. El sistema le ofrecerá **registrar un pago** de inmediato.

Reglas: un estudiante no puede inscribirse dos veces en el mismo curso, no se puede superar el cupo y solo se inscribe en cursos *Programados* o *En ejecución*. Una preinscripción pasa a *Inscrito* automáticamente al registrar el primer pago. Desde ⋯ puede cambiar el estado (por ejemplo *Retirado* o *Finalizado*).

## 7. Pagos

**Saldos por inscripción** lista a quién le falta pagar (filtro inicial: *Pendiente*; cámbielo a *Parcial*, *Pagado* o *Todos*).

Para cobrar, pulse **Pagar**:

```
Total del curso         S/ 350.00
(−) Pagos registrados   S/ 150.00
---------------------------------
Saldo pendiente         S/ 200.00
```

* Ingrese el monto: el botón **Total** coloca el saldo completo (pago total); un monto menor es un **pago parcial** y el sistema muestra cuánto quedará.
* Elija el medio: Efectivo, Yape, Plin, Transferencia o Tarjeta. Salvo en efectivo, el **número de operación es obligatorio** y no puede repetirse.
* El monto nunca puede superar el saldo.
* Debajo verá el **historial de pagos** de esa inscripción.

**Historial de pagos** muestra todos los pagos con filtros por medio, curso y fechas, y exportación a Excel. El administrador puede **anular** un pago indicando el motivo (queda en auditoría y el saldo se recalcula).

## 8. Reportes

| Reporte | Filtros | Contenido |
|---|---|---|
| **Inscritos por curso** | Curso, fecha inicio, fecha fin | Cantidad de inscritos, pagados, pendientes e ingresos por curso, con totales y gráfico |
| **Financiero** | Rango de fechas | Recaudación por mes (línea y barras), por curso, por medio de pago, pagos realizados vs. pendientes (pie) |
| **Estudiantes** | Curso, estado, fechas | Listado de estudiantes inscritos con estado de pago y saldo |

Cada reporte tiene botones **Excel** y **PDF**. Los archivos incluyen título, filtros aplicados y fecha de generación (hora de Lima); los montos van en soles (S/) y las fechas en formato dd/mm/aaaa.

## 9. Administración (solo administrador)

* **Usuarios**: *Nuevo usuario* (con contraseña temporal o, sin ella, se envía una invitación por correo), cambiar rol 🛡️ y activar/desactivar ⏻. No puede cambiar su propio rol.
* **Auditoría**: quién creó, modificó o eliminó cada registro y cuándo. Clic en una fila para ver los valores antes y después (los cambios se resaltan). Se conservan los últimos 12 meses; lo más antiguo se borra automáticamente cada mes.

## 10. Instalar la aplicación

* **Android (Chrome)**: aparecerá el aviso *Instala la aplicación* → **Instalar**. También: menú ⋮ → *Instalar aplicación*.
* **iPhone/iPad (Safari)**: toque **Compartir** ⬆️ → **Agregar a inicio**.
* **Computadora (Chrome/Edge)**: ícono de instalación en la barra de direcciones.

**Sin conexión**: la app abre y muestra los últimos datos consultados (aparece una franja amarilla). Para registrar o modificar información se necesita internet. Cuando haya una versión nueva verá el aviso *Actualizar*.

## 11. Preguntas frecuentes

* **"No hay cupos disponibles"**: el curso está lleno. Aumente los cupos (administrador) o retire a alguien.
* **"El monto excede el saldo pendiente"**: alguien registró otro pago al mismo tiempo; cierre y vuelva a abrir el pago.
* **"No tiene permisos"**: su rol no permite esa acción; consulte al administrador.
* **El DNI no autocompleta**: verifique los 8 dígitos o ingrese los datos a mano; el servicio externo puede no tener el registro.

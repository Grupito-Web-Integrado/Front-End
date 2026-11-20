# REST provisional de matrículas

El microservicio original tiene esquema y dominio, pero carece de controladores HTTP. Este adaptador permite **probar**, no lanzar a producción, registros respaldados por PostgreSQL.

* POST /api/matriculas: {courseId,nombre,correo,telefono,tipoDocumento,documento}, JWT requerido.
* GET /api/matriculas: solo matrículas del subject del JWT.
* GET /api/matriculas/admin: solo realm role ADMIN.

El backend comprueba que el curso está PUBLISHED, tiene cupos y obtiene su precio mediante GET /api/v1/courses/{id}; no acepta importe manipulado desde Angular. Inserta la matrícula y su snapshot de estudiante en transacción.

**No implementa Saga de pagos, liberación/reserva real de cupos, comprobantes ni notificaciones.**

Para instalar en tu clon local, con permisos del compañero y sin cambios pendientes:
```powershell
.\infra\APLICAR_API_MATRICULAS.ps1 -Confirmar
```
El adaptador no se sube automáticamente al repositorio del microservicio; debe pasar revisión independiente.

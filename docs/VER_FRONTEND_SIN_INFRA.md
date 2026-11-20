# MyAcademy: iniciar solamente el FRONTEND (sin Docker ni Java)

Este acceso abre Angular y su interfaz REAL, sin modo demostracion ni datos falsos.
- Doble clic en VER_FRONTEND.bat
- Abre http://localhost:4200/inicio
- Login y datos: requieren que Keycloak, Catalogo, Matriculas y los demas servicios esten ejecutandose. Si no lo estan, se muestra el error correspondiente; no se simulan cursos ni matriculas.
- Para levantar tambien los servidores Java y la infraestructura de Docker, usa ABRIR_MYACADEMY.bat.

Este acceso resulta util para revisar la interfaz y la responsividad aunque Docker Desktop aun este apagado.

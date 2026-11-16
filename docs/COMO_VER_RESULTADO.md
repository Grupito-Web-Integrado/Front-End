# Ver resultado en Windows

1. Actualiza el repositorio **Front-End** en `feat/dwi-frontend-gonzalo`.
2. Haz doble clic en `ABRIR_MYACADEMY.bat` para iniciar Angular demo.
3. Se abrirá `http://localhost:4200/inicio`; en `/login` alterna perfiles de estudiante y administrador de prueba.
4. El catálogo demo incluye 35 cursos, categorías dinámicas, horarios y sedes de ejemplo, sin necesitar Docker.

Para modo API se requieren PostgreSQL, Elasticsearch, Kafka, Keycloak y los repositorios Java con parches revisados. El catálogo demo no acredita el funcionamiento integral de esos servicios. Los parches backend deben pasar PR separado en el repositorio de cada compañero.

GitHub Actions guarda el artefacto de Angular `myacademy-angular-build` (caduca a los siete días). No existe aún un enlace público desplegado.

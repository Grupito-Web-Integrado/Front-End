# Dataset de ejemplo en modo API

Disponible un conjunto de 11 categorías y 35 cursos ficticios extraídos del catálogo Angular, con horarios y sedes de muestra. Se guardan mediante SQL en el PostgreSQL de desarrollo; se proyectan a Elasticsearch para probar llamadas reales. No son cursos de usuarios ni datos de producción.

Requiere migraciones V1, V2 y V3 en el backend y Docker. El comando NO se ejecuta por defecto:

    .\infra\CARGAR_CURSOS_DEMO_EN_BD.ps1 -Confirmar

Utiliza INSERT ON CONFLICT DO NOTHING, sin borrar ni sobrescribir registros existentes. Evita ejecutarlo en bases compartidas o de producción.
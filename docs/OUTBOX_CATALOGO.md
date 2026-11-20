# Reparación del flujo de Catálogo

El proyecto original trae un Outbox con columnas que no existen en V2 y un publisher que devuelve `Mono.empty()`. Además, V1 restringe la modalidad a PRESENTIAL mientras el enum Java produce IN_PERSON.

Los archivos de `integrations/catalogo-outbox` implementan un publisher Kafka con confirmación de envío y corrigen el esquema V3; se aplican al clon local limpio con `infra/APLICAR_OUTBOX_CATALOGO.ps1 -Confirmar`. Requiere Kafka e Indexer activos, y pruebas de eventos completos antes de aprobar el PR. En entornos con Debezium no debe ejecutarse otro publicador simultáneamente para evitar duplicados.

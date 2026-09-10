# Memoria de Arquitectura (PROJECT_MEMORY.md)

## 1. Identidad de Infraestructura
- **Proyecto Dedicado Google Cloud Platform**: `claudio-dashboard-app`
- **Número de Proyecto**: `1082975588170`
- **Base de Datos**: Cloud Firestore Native en región `nam5` (multi-región).
- **Aislamiento**: Proyecto 100% independiente de cualquier otra solución (ej: `virtual-enterprise-93bf8`). Cero compartición de colecciones, reglas, cuotas o dominios.

## 2. Decisiones Arquitectónicas del Backend
- **100% Google Cloud & Firebase Native**: Cero frameworks de servidor intermediarios (sin Fastify, sin Express, sin Zod en servidor).
- **Validación Declarativa**: La validación de esquemas y permisos reside exclusivamente en `firestore.rules` (Security Rules v2) y contratos de tipos TypeScript en el cliente.
- **Modo Multi-tenant por UID**: Cada usuario autenticado con Google Sign-In opera estrictamente bajo su subárbol `users/{userId}/*`.
- **Política de Datos**: Base de datos de producción inicializada en limpio (Opción A elegida por el Desarrollador). Copias de seguridad históricas persistidas localmente en `data/backups/*.cld`.
- **Caché y Resiliencia**: Inicialización de Firestore con `persistentLocalCache` y `persistentMultipleTabManager` para soporte offline en ruta.

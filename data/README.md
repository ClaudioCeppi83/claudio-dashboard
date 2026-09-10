# Persistencia

Los datos reales se almacenan en:

- `deliveries.cld`
- `debts.cld`
- `expenses.cld`
- `settings.cld`
- `raw.cld`

Son NDJSON con extensión `.cld`. Los archivos están excluidos del control de
versiones mediante `.gitignore`, porque pueden contener información financiera
o personal.

La v0.3 introduce el adaptador `CldStore` y el `Repository`, manteniendo la
persistencia desacoplada de la lógica de negocio.
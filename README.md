# Claudio Dashboard

Dashboard mobile-first para entregas y finanzas basado en **minimalismo funcional**: interfaz tranquila, arquitectura desacoplada y rendimiento ultrarrápido.

## 🚀 Características

- **Diseño Mobile-First**: Interfaz limpia, accesible e inspirada en el minimalismo con respuesta táctil fluida.
- **Parsing Automático de WhatsApp**: Reconocimiento inteligente de reportes copiados de WhatsApp con validación matemática (`recibidos - incidencias = entregados`).
- **Persistencia en Navegador & Google Cloud**: Guardado automático continuo mediante `localStorage` y sincronización con Cloud Firestore.
- **Exportación/Importación `.cld`**: Copias de seguridad en formato NDJSON (`.cld`) listas para descargar e importar.
- **Prevención de Duplicados**: Detección automática por repartidor, ruta y fecha.
- **Cálculo Financiero Dinámico**: Balance disponible, ingresos brutos, deudas, gastos y promedio por día activo.
- **TypeScript Estricto & Tests Unitarios**: Suite de pruebas con Vitest.

## 🛠️ Stack Tecnológico

- **Lenguaje**: TypeScript
- **Bundler**: Vite
- **Cloud & DB**: Google Cloud Firestore & Firebase Auth
- **Estilos**: CSS Nativo
- **Testing**: Vitest
- **Calidad**: ESLint + Prettier

## 📦 Ejecución y Desarrollo

Instalar dependencias:
```bash
npm install
```

Iniciar servidor local de desarrollo:
```bash
npm run dev
```

Ejecutar pruebas unitarias:
```bash
npm test
```

Compilar para producción:
```bash
npm run build
```

Ejecutar linter:
```bash
npm run lint
```

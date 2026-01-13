# Análisis del Repositorio: hongos-back

## Resumen Ejecutivo

Este repositorio contiene el **backend de una aplicación de e-commerce** construida con **Medusa.js v2**, un framework de comercio modular y open-source. El proyecto está específicamente configurado para operaciones de comercio electrónico en **Colombia**, con integraciones personalizadas para el mercado colombiano.

## 🎯 Propósito del Proyecto

El proyecto "hongos-back" es un backend de tienda en línea que proporciona:
- **API REST** para operaciones de e-commerce (productos, carritos, órdenes)
- **Panel de administración** para gestionar la tienda
- **Integración de pagos** con Wompi (procesador de pagos colombiano)
- **Funcionalidades personalizadas** para el mercado colombiano

## 🏗️ Arquitectura y Tecnologías

### Framework Principal
- **Medusa.js 2.12.3**: Framework de comercio headless
- **Node.js >=20**: Requisito de versión del motor
- **TypeScript 5.6.2**: Lenguaje principal de desarrollo

### Base de Datos
- **Configuración flexible**: Soporta PostgreSQL o SQLite
- **Redis**: Para cache y gestión de sesiones
- **DATABASE_URL configurable** a través de variables de entorno

### Frontend Admin
- **Medusa Dashboard 2.12.3**: Panel de administración
- **React 18.3.1**: Para componentes del dashboard
- **Vite 5.4.14**: Bundler para el frontend admin

## 🔌 Módulos Personalizados

### 1. Proveedor de Pagos Wompi
**Ubicación**: `src/modules/wompi-payment/`

Integración personalizada con **Wompi**, la pasarela de pagos más popular de Colombia.

**Características**:
- Implementa la interfaz `AbstractPaymentProvider` de Medusa
- Soporta modo de prueba y producción
- Maneja el ciclo completo de pagos:
  - `initiatePayment`: Inicia la sesión de pago
  - `authorizePayment`: Autoriza el pago
  - `capturePayment`: Captura fondos autorizados
  - `refundPayment`: Procesa reembolsos
  - `cancelPayment`: Cancela pagos

**Configuración**:
```javascript
publicKey: process.env.WOMPI_PUB_KEY
privateKey: process.env.WOMPI_PRV_KEY
integritySecret: process.env.WOMPI_INTEGRITY_SECRET
testMode: process.env.WOMPI_TEST_MODE === "true"
```

### 2. API Endpoint Personalizado: Metadata del Carrito
**Ubicación**: `src/api/store/carts/[id]/metadata/route.ts`

Endpoint REST para actualizar metadatos del carrito, **especialmente diseñado para almacenar la cédula** del cliente (documento de identidad colombiano).

**Ruta**: `POST /store/carts/:id/metadata`

**Funcionalidad**:
- Sanitiza la cédula (elimina puntos, espacios, guiones)
- Valida formato: 6-10 dígitos numéricos
- Actualiza metadata del carrito con información del cliente
- Manejo de errores con `MedusaError`

**Ejemplo de uso**:
```json
{
  "cedula": "1.234.567-8"  // Se convierte a "12345678"
}
```

## 🎭 Event Subscribers (Suscriptores de Eventos)

### 1. Colombia Address Handler
**Ubicación**: `src/subscribers/colombia-address-handler.ts`
**Evento**: `cart.updated`

**Propósito**: Soluciona un problema común en Colombia donde muchas direcciones no tienen código postal formal.

**Funcionamiento**:
- Detecta direcciones con `country_code = "co"` (Colombia)
- Si el `postal_code` está vacío o es nulo
- Automáticamente inyecta el código postal genérico `"000000"`
- Esto previene errores de validación en el checkout

**Razón de existir**: En Colombia, no todas las ciudades/zonas tienen códigos postales asignados, pero muchos sistemas internacionales lo requieren como campo obligatorio.

### 2. Cart to Order Metadata Handler
**Ubicación**: `src/subscribers/cart-to-order-metadata.ts`
**Evento**: `order.placed`

**Propósito**: Preserva información importante del carrito cuando se convierte en orden.

**Funcionamiento**:
- Escucha el evento `order.placed`
- Transfiere toda la metadata del carrito a la orden recién creada
- **Especialmente importante para preservar la cédula** del cliente
- Usa el Query API de Medusa para obtener datos relacionados

**Por qué es necesario**: Por defecto, Medusa no copia automáticamente la metadata del carrito a la orden. Este subscriber asegura que información crítica (como la cédula) se preserve en la orden final.

## 🛡️ Middleware Personalizado

**Ubicación**: `src/api/middlewares.ts`

### Sanitizador de Cédula

**Rutas protegidas**:
- `POST /store/carts/:id`
- `POST /store/carts/:id/complete`

**Funcionalidad**:
- Intercepta requests antes de llegar al handler
- Limpia la cédula de caracteres no numéricos
- Previene datos inconsistentes en la base de datos

**Procesamiento**:
```javascript
// Input: "1.234.567-8"
// Output: "12345678"
body.metadata.cedula = body.metadata.cedula.replace(/[^\d]/g, "")
```

## 📋 Scripts Disponibles

```json
{
  "build": "medusa build && ls -R build-admin",
  "seed": "medusa exec ./src/scripts/seed.ts",
  "start": "medusa start",
  "dev": "medusa develop",
  "test:integration:http": "TEST_TYPE=integration:http NODE_OPTIONS=--experimental-vm-modules jest",
  "test:integration:modules": "TEST_TYPE=integration:modules NODE_OPTIONS=--experimental-vm-modules jest",
  "test:unit": "TEST_TYPE=unit NODE_OPTIONS=--experimental-vm-modules jest"
}
```

### Comandos principales:
- **`npm run dev`**: Inicia el servidor en modo desarrollo con hot-reload
- **`npm run build`**: Compila el proyecto TypeScript y el dashboard admin
- **`npm run start`**: Inicia el servidor en modo producción
- **`npm run seed`**: Ejecuta scripts de seed para poblar la BD con datos iniciales
- **`npm test:*`**: Suite de pruebas (unitarias, integración de módulos, integración HTTP)

## 🔧 Configuración del Proyecto

### Variables de Entorno Clave

```bash
# CORS
STORE_CORS=http://localhost:8000
ADMIN_CORS=http://localhost:5173,http://localhost:9000
AUTH_CORS=http://localhost:5173,http://localhost:9000

# Base de datos y cache
DATABASE_URL="file:./medusa-db.sqlite"
REDIS_URL=redis://localhost:6379

# Seguridad
JWT_SECRET=supersecret
COOKIE_SECRET=supersecret

# Wompi (Pagos)
WOMPI_PUB_KEY=pub_test_example
WOMPI_PRV_KEY=prv_test_example
WOMPI_INTEGRITY_SECRET=secret_test_example
WOMPI_TEST_MODE=true

# Admin Backend
MEDUSA_ADMIN_BACKEND_URL=http://localhost:9000
```

### Configuración Especial de Medusa

**`medusa-config.js`**:
- Admin output personalizado: `build-admin` (en lugar de carpeta oculta)
  - **Razón**: Evitar problemas con el despliegue en Render.com
- Integración del módulo de pagos Wompi
- Configuración de CORS para store, admin y auth

## 🌐 Características Específicas para Colombia

1. **Manejo de Direcciones Sin Código Postal**
   - Auto-completa código postal "000000" para direcciones colombianas
   - Soluciona problema de validación en zonas sin código postal oficial

2. **Validación de Cédula**
   - Formato: 6-10 dígitos numéricos
   - Sanitización automática (elimina puntos, guiones, espacios)
   - Preservación de cédula desde carrito hasta orden

3. **Integración con Wompi**
   - Pasarela de pagos local colombiana
   - Soporta múltiples métodos de pago populares en Colombia
   - Manejo de firmas de integridad (integrity signatures)

## 🗂️ Estructura de Directorios

```
hongos-back/
├── src/
│   ├── api/               # Endpoints REST personalizados
│   │   ├── middlewares.ts # Middlewares globales
│   │   └── store/         # API del storefront
│   ├── modules/           # Módulos personalizados de Medusa
│   │   └── wompi-payment/ # Proveedor de pagos Wompi
│   ├── subscribers/       # Event handlers
│   │   ├── colombia-address-handler.ts
│   │   └── cart-to-order-metadata.ts
│   ├── admin/             # Personalizaciones del admin
│   ├── workflows/         # Workflows personalizados (vacío actualmente)
│   ├── jobs/              # Jobs programados (vacío actualmente)
│   ├── links/             # Enlaces entre módulos (vacío actualmente)
│   └── scripts/           # Scripts de utilidad (seed, etc.)
├── integration-tests/     # Tests de integración
├── static/                # Archivos estáticos
├── medusa-config.js       # Configuración principal de Medusa
├── jest.config.js         # Configuración de Jest para tests
├── tsconfig.json          # Configuración de TypeScript
└── package.json           # Dependencias y scripts
```

## 🚀 Flujo de Operación

### Proceso de Compra Típico:

1. **Cliente navega productos** (frontend)
2. **Crea carrito** → `POST /store/carts`
3. **Agrega productos** → `POST /store/carts/:id/line-items`
4. **Ingresa información personal**:
   - Dirección de envío → Si es Colombia y sin código postal, se auto-completa "000000"
   - Cédula → `POST /store/carts/:id/metadata` → Middleware sanitiza la cédula
5. **Selecciona método de pago** → Wompi
6. **Inicia pago**:
   - Backend crea sesión de pago con Wompi
   - Cliente es redirigido a widget de Wompi
7. **Completa pago** en Wompi
8. **Orden creada**:
   - Evento `order.placed` se dispara
   - Subscriber transfiere metadata (incluyendo cédula) del carrito a la orden
9. **Admin puede ver la orden** con toda la información del cliente

## 🧪 Testing

El proyecto incluye configuración para tres tipos de tests:

- **Tests Unitarios**: Prueban funciones/clases individuales
- **Tests de Integración de Módulos**: Verifican interacción entre módulos
- **Tests de Integración HTTP**: Validan endpoints API completos

Framework: **Jest** con soporte para módulos ES6 (`--experimental-vm-modules`)

## 🎨 Caso de Uso Sugerido

Basándome en el nombre "hongos-back" (hongos = mushrooms/fungi), este backend podría estar siendo usado para:

1. **Tienda de productos relacionados con hongos**:
   - Hongos comestibles gourmet
   - Kits de cultivo de hongos
   - Suplementos/productos medicinales de hongos
   - Productos para cultivo de hongos

2. **Dirigido al mercado colombiano**:
   - Necesidad de cédula (documento de identidad)
   - Integración con Wompi (pasarela colombiana)
   - Manejo especial de direcciones colombianas

## 🔐 Consideraciones de Seguridad

- **Sanitización de inputs**: Middleware limpia datos de cédula
- **Validación de formato**: Endpoint valida estructura de cédula
- **Secrets configurables**: Keys de Wompi via variables de entorno
- **CORS configurado**: Limita orígenes permitidos
- **JWT/Cookie secrets**: Para autenticación segura

## 📦 Dependencias Principales

- **@medusajs/framework**: 2.12.3 - Core framework
- **@medusajs/medusa**: 2.12.3 - Backend engine
- **@medusajs/dashboard**: 2.12.3 - Admin UI
- **@medusajs/cli**: 2.12.3 - CLI tools
- **TypeScript**: 5.6.2 - Type safety
- **Jest**: 29.7.0 - Testing framework
- **React**: 18.3.1 - Admin frontend

## 🚢 Deployment

El proyecto está configurado para despliegue en **Render.com**:
- Build admin output en carpeta no-oculta (`build-admin`)
- Configuración de DATABASE_URL flexible
- Soporte para SQLite (dev) o PostgreSQL (prod)

## 📝 Conclusión

**hongos-back** es un backend de e-commerce robusto y bien estructurado, específicamente adaptado para el mercado colombiano. Utiliza Medusa.js v2 como base y añade funcionalidades personalizadas críticas:

- ✅ Integración con sistema de pagos local (Wompi)
- ✅ Manejo de documentos de identidad colombianos (cédula)
- ✅ Soluciones para peculiaridades del sistema de direcciones colombiano
- ✅ Arquitectura modular y extensible
- ✅ Suite completa de tests
- ✅ Configuración lista para producción

El código muestra buenas prácticas:
- Separación de concerns (módulos, subscribers, middleware)
- Validación y sanitización de datos
- Logging apropiado
- Configuración via variables de entorno
- TypeScript para type safety
